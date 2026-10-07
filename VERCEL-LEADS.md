# Vercel Lead API

## Architecture

The static Eleventy site posts same-origin multipart form data to `POST /api/lead`. Vercel handles the root `api/lead.js` as a Node.js 24 Function. Eleventy no longer copies `src/api` into `_site`; `src/api/lead.php` remains untouched during this migration and is not part of the deployed static output.

The function requires a Neon Postgres database and Resend email delivery. It does not report success unless a lead is durably stored and the team notification is accepted by Resend. Vercel's local filesystem is not used for persistence.

## Provisioning

1. Create a Neon Postgres database and run `database/schema.sql` in the Neon SQL editor.
2. Create a Resend account, verify the sender domain/address, and generate an API key.
3. Add the following environment variables to Vercel Preview and Production, and to local `.env.local` for `vercel dev`:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string with SSL enabled |
| `RESEND_API_KEY` | Resend API key |
| `LEAD_EMAIL_TO` | Destination inbox for lead notifications |
| `LEAD_EMAIL_FROM` | Verified sender, such as `Acurris Analytical <leads@example.com>` |
| `RATE_LIMIT_SECRET` | Long random secret used to HMAC-hash client IPs |
| `SITE_URL` | Public site URL used in customer confirmation emails; optional, defaults to `https://acurrisanalytical.com` |
| `SUPPORT_HOURS` | Reply window in hours; optional, defaults to `48` |

Never commit `.env.local` or place service credentials in frontend data, templates, or JavaScript. `RATE_LIMIT_SECRET` should remain stable across deployments so the hourly limit is consistent.

## Local Development

```bash
npm install
vercel dev
```

Open `http://localhost:3000/request-quote/`. `npm run serve` only runs Eleventy and does not execute API functions.

Without the four service credentials and `RATE_LIMIT_SECRET`, valid submissions deliberately receive a JSON `503` and the frontend shows its friendly failure state. No test or local fallback fakes success.

## Verification

```bash
curl -i http://localhost:3000/api/lead
```

GET should return `405` with `Content-Type: application/json`. POST form submissions use `multipart/form-data`; the function validates fields and spam checks, stores the lead and rate-limit record in Neon, and sends the team email through Resend. Request success is returned only after the durable write and team-email send both succeed.

The database stores the submitted lead fields as `jsonb`, with a lead ID, form type, email status and timestamps. The per-IP hourly rate-limit table stores an HMAC of the IP rather than the raw address. There is no CSV export in this Vercel implementation; use Neon exports or a database backup process for retention and audit needs.

The customer confirmation email is best-effort, matching the prior PHP behavior: a failure is logged server-side, while successful lead storage and team notification remain successful. Team-email failure returns an error and leaves the durable lead record with `email_status = 'pending'` for follow-up.
