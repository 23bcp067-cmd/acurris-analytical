import { createHmac, randomBytes } from "node:crypto";
import Busboy from "busboy";
import { neon } from "@neondatabase/serverless";

export const config = { api: { bodyParser: false } };

const CATEGORIES = {
  quechers: "QuEChERS",
  mycotoxins: "Mycotoxins",
  "antibiotic-residues": "Antibiotic residues",
  "food-adulteration": "Food adulteration",
  "pesticide-residues": "Pesticide residues",
  "foodborne-pathogens": "Foodborne pathogens",
  "food-allergens": "Food allergens",
  dspe: "dSPE",
  spe: "SPE",
  filtration: "Filtration",
  "sample-handling": "Sample handling",
  several: "Several categories",
  "not-sure": "Not sure yet",
};

const REDIRECTS = {
  rfq1: "/thank-you/quote/",
  rfq2: "/thank-you/quote/",
  sample: "/thank-you/sample/",
  spec: "/thank-you/spec/",
  expo: "/thank-you/quote/",
};

const REQUIRED_FIELDS = {
  rfq1: ["name", "organization", "mobile", "email", "category", "consent"],
  rfq2: ["lead_id"],
  sample: [
    "name", "organization", "mobile", "email", "category", "org_type",
    "volume", "analytes", "matrix", "location", "timeline",
    "delivery_address", "consent",
  ],
  spec: ["name", "organization", "email", "category", "consent"],
  expo: ["name", "organization", "mobile", "email", "category", "consent"],
};

const FIELD_LIMITS = {
  name: 120,
  organization: 160,
  mobile: 20,
  email: 160,
  category: 40,
  quantity: 80,
  unit: 40,
  requirement: 500,
  org_type: 80,
  volume: 40,
  analytes: 300,
  matrix: 300,
  location: 120,
  timeline: 40,
  gst: 15,
  message: 2000,
  delivery_address: 500,
  event: 120,
  page: 200,
  consent: 5,
  lead_id: 40,
  items: 1500,
  form_type: 20,
  ts: 20,
  company_website: 300,
  redirect: 100,
};

const LABELS = {
  name: "Full name",
  organization: "Organization",
  mobile: "Mobile number",
  email: "Work email",
  category: "Product category",
  quantity: "Quantity",
  unit: "Unit",
  requirement: "Application / requirement",
  org_type: "Organization type",
  volume: "Tests per month",
  analytes: "Analytes or products",
  matrix: "Sample matrix",
  location: "City and state",
  timeline: "Timeline",
  gst: "GST number",
  message: "Message",
  delivery_address: "Delivery address",
  event: "Where we met",
  items: "Quote list",
  page: "Submitted from",
  lead_id: "Lead ID",
};

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
}

function parseMultipart(req) {
  const contentType = String(req.headers["content-type"] || "");
  if (!/^multipart\/form-data\s*;/i.test(contentType)) {
    console.error("Lead API received unsupported content type", {
      hasMultipartContentType: /^multipart\/form-data\s*;/i.test(contentType),
      requestIsPipeable: typeof req.pipe === "function",
      hasParsedBody: req.body !== undefined,
    });
    throw new ApiError(415, "Submit the form using multipart form data.");
  }

  return new Promise((resolve, reject) => {
    let parser;
    const fields = Object.create(null);
    let settled = false;
    let receivedBytes = 0;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    try {
      parser = Busboy({
        headers: req.headers,
        limits: { fields: 40, fieldSize: 5000, files: 0, parts: 40 },
      });
    } catch (error) {
      console.error("Lead multipart parser initialization failed", { errorType: error?.name || "Error" });
      fail(new ApiError(400, "The form data could not be read."));
      return;
    }

    parser.on("field", (name, value, info) => {
      if (info.valueTruncated) {
        fail(new ApiError(413, "A form field is too long."));
        return;
      }
      if (Object.hasOwn(fields, name)) {
        fail(new ApiError(400, "The form contains duplicate fields."));
        return;
      }
      fields[name] = value;
    });
    parser.on("file", (_name, file) => {
      file.resume();
      fail(new ApiError(400, "File uploads are not accepted."));
    });
    parser.on("fieldsLimit", () => fail(new ApiError(413, "The form contains too many fields.")));
    parser.on("filesLimit", () => fail(new ApiError(400, "File uploads are not accepted.")));
    parser.on("partsLimit", () => fail(new ApiError(413, "The form contains too many parts.")));
    parser.on("error", (error) => {
      console.error("Lead multipart parser failed", {
        errorType: error?.name || "Error",
        errorMessage: error?.message || "unknown",
        contentLength: req.headers["content-length"] || null,
        receivedBytes,
        requestBodyType: req.body === undefined ? "undefined" : typeof req.body,
        requestIsPipeable: typeof req.pipe === "function",
        requestComplete: req.complete === true,
      });
      fail(new ApiError(400, "The form data could not be read."));
    });
    parser.on("close", () => {
      if (settled) return;
      settled = true;
      resolve(fields);
    });
    req.on("aborted", () => fail(new ApiError(400, "The form submission was interrupted.")));
    req.on("data", (chunk) => { receivedBytes += chunk.length; });
    req.pipe(parser);
  });
}

function cleanText(value, maxLength, multiline = false) {
  const withoutTags = String(value ?? "").replace(/<[^>]*>/g, "");
  const withoutControls = withoutTags.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  const normalized = multiline
    ? withoutControls.replace(/\r\n?/g, "\n").trim()
    : withoutControls.replace(/[\r\n]+/g, " ").trim();
  return Array.from(normalized).slice(0, maxLength).join("");
}

function sanitizeFields(fields) {
  const cleaned = Object.create(null);
  for (const [name, value] of Object.entries(fields)) {
    const limit = FIELD_LIMITS[name] || 500;
    cleaned[name] = cleanText(value, limit, ["message", "delivery_address"].includes(name));
  }
  if (cleaned.email) cleaned.email = cleaned.email.toLowerCase();
  if (cleaned.gst) cleaned.gst = cleaned.gst.toUpperCase();
  return cleaned;
}

function validateFields(fields) {
  const type = fields.form_type;
  if (!Object.hasOwn(REQUIRED_FIELDS, type)) throw new ApiError(400, "Unknown form type.");

  if (fields.company_website) throw new ApiError(400, "Unable to process this submission.");
  if (fields.ts && /^\d+$/.test(fields.ts)) {
    const age = Date.now() - Number(fields.ts);
    if (age >= 0 && age < 3000) throw new ApiError(400, "Please wait a moment before submitting the form.");
  }

  const errors = [];
  for (const name of REQUIRED_FIELDS[type]) {
    if (!fields[name]) errors.push(name === "consent" ? "Consent is required" : `${LABELS[name]} is required`);
  }
  if (fields.consent && fields.consent !== "yes") errors.push("Consent is required");
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.push("Email address is not valid");
  if (fields.mobile) {
    const digits = fields.mobile.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) errors.push("Mobile number is not valid");
  }
  if (fields.category && !Object.hasOwn(CATEGORIES, fields.category)) errors.push("Product category is not valid");
  if (fields.gst && !/^[0-9A-Z]{15}$/.test(fields.gst)) errors.push("GST number must be 15 letters and digits");
  if (type === "rfq2" && !/^AA-\d{8}-[A-F0-9]{6}$/.test(fields.lead_id || "")) {
    errors.push("Your session expired. Please email us the details instead");
  }
  if (errors.length) throw new ApiError(422, `${errors.join(". ")}.`);

  return type;
}

function createLeadId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `AA-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function getRequestIp(req) {
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp) return realIp;
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function getMailText(fields, type, leadId, categoryLabel, supportHours) {
  const tag = { rfq1: "RFQ", rfq2: "RFQ DETAILS", sample: "SAMPLE", spec: "SPEC", expo: "EXPO" }[type];
  const details = Object.entries(LABELS)
    .filter(([key]) => key !== "lead_id" && fields[key])
    .map(([key, label]) => `${label}: ${key === "category" ? categoryLabel : fields[key]}`);
  return [
    `Lead ID: ${leadId}`,
    `Form: ${tag}`,
    `Received: ${new Date().toISOString()}`,
    "",
    ...details,
    ...(type === "rfq2" ? ["", "This adds detail to the step 1 request with the same lead ID."] : []),
    "",
    `Reply within ${supportHours} working hours.`,
  ].join("\n");
}

async function sendEmail({ to, from, subject, text, replyTo }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!response.ok) {
    console.error("Lead email delivery failed", { status: response.status });
    throw new ApiError(502, "Unable to deliver the request email.");
  }
}

async function persistLead(sql, type, leadId, fields) {
  const storedFields = Object.fromEntries(
    Object.entries(fields).filter(([key]) => Object.hasOwn(LABELS, key) || key === "consent"),
  );
  const payload = JSON.stringify(storedFields);
  await sql`
    INSERT INTO acurris_leads (lead_id, form_type, payload, email_status)
    VALUES (${leadId}, ${type}, ${payload}::jsonb, 'pending')
    ON CONFLICT (lead_id)
    DO UPDATE SET form_type = EXCLUDED.form_type,
                  payload = acurris_leads.payload || EXCLUDED.payload,
                  email_status = 'pending',
                  updated_at = now()
  `;
}

async function applyRateLimit(sql, ip) {
  const secret = process.env.RATE_LIMIT_SECRET;
  const ipHash = createHmac("sha256", secret).update(ip).digest("hex");
  const result = await sql`
    INSERT INTO acurris_lead_rate_limits (ip_hash, window_started_at, hit_count)
    VALUES (${ipHash}, now(), 1)
    ON CONFLICT (ip_hash) DO UPDATE SET
      window_started_at = CASE
        WHEN acurris_lead_rate_limits.window_started_at <= now() - interval '1 hour' THEN now()
        ELSE acurris_lead_rate_limits.window_started_at
      END,
      hit_count = CASE
        WHEN acurris_lead_rate_limits.window_started_at <= now() - interval '1 hour' THEN 1
        ELSE acurris_lead_rate_limits.hit_count + 1
      END
    RETURNING hit_count
  `;
  if (Number(result[0]?.hit_count) > 10) throw new ApiError(429, "Too many requests. Please try again later.");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { ok: false, error: "Method not allowed." });
  }

  let fields;
  let type;
  try {
    fields = sanitizeFields(await parseMultipart(req));
    type = validateFields(fields);
  } catch (error) {
    if (error instanceof ApiError) return sendJson(res, error.status, { ok: false, error: error.message });
    console.error("Lead request parsing failed", {
      errorType: error?.name || "Error",
      requestIsPipeable: typeof req.pipe === "function",
      hasParsedBody: req.body !== undefined,
    });
    return sendJson(res, 400, { ok: false, error: "The form data could not be read." });
  }

  const requiredEnv = ["DATABASE_URL", "RESEND_API_KEY", "LEAD_EMAIL_TO", "LEAD_EMAIL_FROM", "RATE_LIMIT_SECRET"];
  if (requiredEnv.some((key) => !process.env[key])) {
    return sendJson(res, 503, { ok: false, error: "Request submission is not configured yet. Please contact our team directly." });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await applyRateLimit(sql, getRequestIp(req));

    const leadId = type === "rfq2" ? fields.lead_id : createLeadId();
    const categoryLabel = CATEGORIES[fields.category] || "";
    const supportHours = Number(process.env.SUPPORT_HOURS || 48);
    await persistLead(sql, type, leadId, fields);

    const tags = { rfq1: "RFQ", rfq2: "RFQ DETAILS", sample: "SAMPLE", spec: "SPEC", expo: "EXPO" };
    const subject = `[${tags[type]}] ${fields.name || "Step 2"}${fields.organization ? `, ${fields.organization}` : ""}${categoryLabel ? `, ${categoryLabel}` : ""} (${leadId})`;
    const mailText = getMailText(fields, type, leadId, categoryLabel, supportHours);
    await sendEmail({
      to: process.env.LEAD_EMAIL_TO,
      from: process.env.LEAD_EMAIL_FROM,
      subject,
      text: mailText,
      replyTo: fields.email && type !== "rfq2" ? fields.email : undefined,
    });
    try {
      await sql`UPDATE acurris_leads SET email_status = 'sent', updated_at = now() WHERE lead_id = ${leadId}`;
    } catch {
      console.error("Lead email status update failed", { formType: type, leadId });
    }

    if (type !== "rfq2" && fields.email) {
      const what = {
        rfq1: "your quote request",
        sample: "your evaluation pack request",
        spec: "your spec sheet request",
        expo: "your details from the event",
      }[type];
      const confirmation = [
        `Hello ${fields.name},`,
        "",
        `Thank you for ${what}${categoryLabel ? ` (${categoryLabel})` : ""}. A member of our technical team will reply within ${supportHours} hours on working days.`,
        "",
        `Your reference: ${leadId}`,
        "",
        ...(type === "sample" ? ["Nothing ships and nothing is charged until you confirm. The pack cost is credited against your first order.", ""] : []),
        "If you have more detail to add, reply to this email.",
        "",
        "Acurris Analytical",
        process.env.SITE_URL || "https://acurrisanalytical.com",
      ].join("\n");
      try {
        await sendEmail({
          to: fields.email,
          from: process.env.LEAD_EMAIL_FROM,
          subject: `We received ${what} (${leadId})`,
          text: confirmation,
          replyTo: process.env.LEAD_EMAIL_TO,
        });
      } catch {
        console.error("Customer confirmation email failed", { formType: type, leadId });
      }
    }

    return sendJson(res, 200, {
      ok: true,
      message: "Request received. We will reply shortly.",
      lead_id: leadId,
      redirect: REDIRECTS[type],
    });
  } catch (error) {
    if (error instanceof ApiError) return sendJson(res, error.status, { ok: false, error: error.message });
    console.error("Lead request processing failed", { formType: type, errorType: error?.name || "Error" });
    return sendJson(res, 500, { ok: false, error: "Unable to process your request." });
  }
}
