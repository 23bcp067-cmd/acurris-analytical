# acurrisanalytical.com

This folder holds the Acurris Analytical website: a static Eleventy (11ty) frontend with plain CSS and JavaScript, plus a Vercel Node.js Function for lead submissions. The legacy PHP handler is retained under `src/api/lead.php` during migration but is not published by Eleventy. The plan behind the site is `../website-plan.md`.

The frontend is generated into `_site/`; Vercel also deploys the root `api/lead.js` function. The API requires Neon Postgres for durable leads and rate limits, and Resend for team/customer email.

## What is where

| Path | What it holds |
|---|---|
| `src/_data/site.json` | Phone, WhatsApp, address, GST, GA4 ID, evaluation pack price, feature flags. Most launch edits happen here |
| `src/_data/categories.json` | All 11 product categories: names, tables, method notes, FAQs, spec sheet file names |
| `src/index.njk` | Home page |
| `src/products/category.njk` | Template that builds all 11 category pages from `categories.json` |
| `src/solutions/`, `src/about.md`, `src/legal/` | Solutions, About, privacy, terms and cookie pages |
| `src/resources/articles/` | Testing guides, one Markdown file each |
| `src/_includes/partials/forms.njk` | Every form: two-step quote request, evaluation pack, spec sheet, trade show |
| `src/assets/css/site.css` | The whole stylesheet. Colors and spacing are CSS variables at the top |
| `src/assets/js/site.js` | Menus, form validation and submission, cookie consent, GA4 events |
| `src/assets/img/logo/` | Logo concepts A (test strip, used on the site) and B (sample and baseline) |
| `src/assets/img/products/` | Product and category renders (WebP) |
| `tools/renders/` | Scripts that generate the product renders |
| `api/lead.js` | Vercel Function: validates, stores and emails lead submissions |
| `database/schema.sql` | Neon Postgres tables for leads and rate limits |
| `src/api/lead.php` | Legacy PHP handler retained during migration; not published by Eleventy |
| `src/api/config.sample.php` | Legacy PHP mail settings example; not used by the Vercel Function |
| `src/static/.htaccess` | HTTPS redirect, caching, security headers, 404 page |
| `_site/` | The built site. Upload this |

## Rebuild after editing

```bash
npm install        # first time only
npm run build      # writes _site/
npm run serve      # Eleventy-only static preview at http://localhost:8080
vercel dev         # frontend plus /api/lead at http://localhost:3000
```

`npm run serve` does not run API functions. Use `vercel dev` to test the actual Node function. Apply `database/schema.sql` to Neon, then configure these variables in Vercel Project Settings or a local `.env.local` file (ignored by Git):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string with SSL enabled |
| `RESEND_API_KEY` | Resend API credential for team and customer emails |
| `LEAD_EMAIL_TO` | Team inbox receiving lead notifications |
| `LEAD_EMAIL_FROM` | Sender address/name verified in Resend |
| `RATE_LIMIT_SECRET` | Stable secret used to hash IPs for rate limiting |
| `SITE_URL` | Public site URL in customer confirmations; defaults to `https://acurrisanalytical.com` |
| `SUPPORT_HOURS` | Confirmation response window; defaults to `48` |

Open `http://localhost:3000/request-quote/` after starting `vercel dev`. The API returns success only after the lead is stored and the team email is accepted. Do not commit `.env.local` or service credentials.

## Vercel deployment

The static Eleventy output and Node function deploy together:

- Build command: `npm run build`
- Output directory: `_site`
- API endpoint: same-origin `POST /api/lead`
- Node runtime: `24.x`

Configure the variables above for Preview and Production environments. Vercel Functions do not have reliable persistent local filesystem storage, so leads are stored in Neon instead of a CSV file. The PHP handler remains only as a migration reference; Eleventy no longer copies `src/api` into `_site`.

## Launch checklist

| Step | Where | Done |
|---|---|---|
| Fill in phone, address and evaluation pack price | `src/_data/site.json`, then rebuild | |
| Verify a sender domain/address with Resend and set the lead inbox | Resend dashboard and Vercel environment variables | |
| Create a Neon database and apply `database/schema.sql` | Neon SQL Editor | |
| Set `DATABASE_URL`, `RESEND_API_KEY`, `LEAD_EMAIL_TO`, `LEAD_EMAIL_FROM` and `RATE_LIMIT_SECRET` | Vercel Project Settings > Environment Variables | |
| Create a GA4 property, paste the measurement ID (`G-...`) into `ga4` | `site.json`, then rebuild | |
| Deploy the site and function to Vercel | Vercel project | |
| Configure the custom domain and HTTPS | Vercel project settings | |
| Submit a real test quote on the live site and confirm both emails arrive | Live site | |
| Verify the domain and submit `https://acurrisanalytical.com/sitemap.xml` | Google Search Console | |
| Mark `rfq_step1_submit`, `rfq_step2_submit`, `sample_request_submit` and `expo_form_submit` as key events | GA4 > Admin > Events | |

The retained PHP handler and PHPMailer files are not used by Vercel. The static `.htaccess` file is only relevant if `_site` is separately uploaded to Apache hosting.

## Settings in site.json

| Key | Effect when filled in | Effect when empty |
|---|---|---|
| `phone`, `phoneDisplay` | Call button in the mobile bar, phone in footer and quote page | Hidden |
| `whatsapp` (digits only, with 91, e.g. `919876543210`) | WhatsApp button in the mobile bar and quote page | Hidden |
| `address` (list of lines) | Shown in footer, About, quote page, privacy notice | Hidden |
| `gst` | Shown in the footer | Hidden |
| `ga4` | Cookie banner appears. GA4 loads only after a visitor accepts | No banner, no analytics |
| `evalPack.price` (e.g. `"₹2,500 plus GST"`) | Shown on the evaluation pack page and category pages | "Confirmed by email" wording |
| `flags.qualityProcess` | Shows the supplier quality-check section on the home page | Section hidden. Turn on only after you approve the wording (plan section 7.3) |

## Adding a spec sheet

1. Put the PDF in `src/assets/docs/`, for example `quechers-spec.pdf`.
2. In `categories.json`, set `"spec_pdf": "quechers-spec.pdf"` for that category.
3. Rebuild and upload.

The category page then shows "Download spec sheet (PDF)" in place of the request form.

## Leads

The Node API sends team emails with subject tags `[RFQ]`, `[RFQ DETAILS]`, `[SAMPLE]`, `[SPEC]` or `[EXPO]`; customer confirmations use the same lead reference. Lead data and email status are stored in Neon Postgres. The RFQ steps merge by lead ID, and quote-list items remain part of the stored payload and email.

Spam protection: hidden honeypot field, three-second minimum fill time, server-side field validation, and a 10-per-hour per-IP limit using a hashed IP in Neon. All API responses are JSON. Missing database or email configuration causes a visible failure, not a simulated success.

## Trade show QR code

Point the QR code at `https://acurrisanalytical.com/expo/?event=EVENT-NAME`. The event name prefills the "Where we met" field, and leads arrive tagged `[EXPO]`. The page is hidden from search engines.

## Content to verify before launch

These lines describe products or service levels that no supplier agreement backs yet. Confirm each one, or edit it, before the site goes live.

| Claim | Where |
|---|---|
| "Stocked in India" and "reorders do not wait on an import cycle" | Home trust row, category pages |
| Pre-filled 50 mL QuEChERS tubes and pouches | QuEChERS page |
| dSPE in 2 mL and 15 mL tubes | dSPE page |
| Syringe filter membranes and 0.22 and 0.45 micron pore sizes | Filtration page |
| 2 mL clear and amber vials, 15 and 50 mL centrifuge tubes | Sample handling page |
| "Setup guide with every kit" and "troubleshooting after delivery" | Home, category pages |
| Staff training by video call | Dairy page, adulteration FAQ |
| Legal entity wording "a division of Acurris Biosystems" | Privacy and terms pages. Have a lawyer review both |

## Product images

Every product and category image is a 3D render of generic labware and Acurris-branded packaging, produced by the scripts in `tools/renders/` (three.js scenes rendered in headless Chromium, then trimmed and saved as WebP into `src/assets/img/products/`). The renders show formats, not your actual supplier's products. Replace them with real packaging photos or renders once the white-label packaging exists, keeping the same file names.

To re-render after a label or product change: install `three` and `playwright` in `tools/renders/`, serve that folder on port 8099, edit `gen.py`, then run `python3 gen.py && node run.mjs all.json && python3 trim.py`.

## Stock photos

The site has no stock photography yet. Unsplash, Pexels and similar libraries were blocked from the build environment. If you want photos in the solution pages and About page, download licensed images (lab bench pipetting, milk collection center, grain or feed intake), send them over, and they can be added in the same well-framed style.

## Product reference codes

Each product shows a reference such as `AA-QC-EN-50`. These are placeholder codes following one pattern (`AA-` + category + item). Replace them in `categories.json` with your real SKUs before launch. The quote list and the lead emails use whatever is there.

## Quote list

Visitors can add products to a quote list from any category page. The list lives in the visitor's own browser, appears on the Request a quote page, and is sent with the step 1 form as a "Quote list" line in the lead email and CSV. It clears after a successful submission.

## Licenses

IBM Plex Sans and IBM Plex Mono (SIL Open Font License, `src/assets/fonts/OFL.txt`), Lucide icons (ISC), PHPMailer (LGPL 2.1, `src/api/lib/PHPMailer-LICENSE.txt`).
