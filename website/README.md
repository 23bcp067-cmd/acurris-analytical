# acurrisanalytical.com

This folder holds the source for the Acurris Analytical website: a static site built with Eleventy (11ty), plain CSS and plain JavaScript, plus one PHP file that handles the forms. The plan behind it is `../website-plan.md`. The visual system came from the UI UX Pro Max design-system search and is recorded in `design-system/acurris-analytical/MASTER.md`.

You upload the contents of `_site/` to `public_html` on the cPanel host. You only need Node.js if you want to rebuild the site after editing the source.

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
| `src/api/lead.php` | Form handler: emails the team, sends the visitor a confirmation, logs to CSV |
| `src/api/config.sample.php` | Template for the mail settings |
| `src/static/.htaccess` | HTTPS redirect, caching, security headers, 404 page |
| `_site/` | The built site. Upload this |

## Rebuild after editing

```bash
npm install        # first time only
npm run build      # writes _site/
npm run serve      # local preview at http://localhost:8080 (forms need PHP, see below)
```

## Launch checklist

| Step | Where | Done |
|---|---|---|
| Fill in phone, address and evaluation pack price | `src/_data/site.json`, then rebuild | |
| Create the mailbox `enquiries@acurrisanalytical.com` | cPanel > Email Accounts | |
| Copy `api/config.sample.php` to `acurris-config.php` in your home folder (one level above `public_html`) and enter the mailbox password | cPanel File Manager | |
| Create a GA4 property, paste the measurement ID (`G-...`) into `ga4` | `site.json`, then rebuild | |
| Upload everything inside `_site/`, including the hidden `.htaccess` files | FTP to `public_html` | |
| Turn on SSL (AutoSSL) for the domain | cPanel > SSL/TLS Status | |
| Submit a real test quote on the live site and confirm both emails arrive | Live site | |
| Verify the domain and submit `https://acurrisanalytical.com/sitemap.xml` | Google Search Console | |
| Mark `rfq_step1_submit`, `rfq_step2_submit`, `sample_request_submit` and `expo_form_submit` as key events | GA4 > Admin > Events | |

Most FTP clients hide dotfiles. Turn on "show hidden files" so `.htaccess`, `api/.htaccess` and `api/lib/.htaccess` upload too. Without them the HTTPS redirect, caching and the lock on the PHP library folder do not apply.

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

Each form submission emails the team with a subject tag: `[RFQ]`, `[RFQ DETAILS]` (step 2, same lead ID), `[SAMPLE]`, `[SPEC]` or `[EXPO]`. The visitor gets a confirmation with the same reference. Every lead is also appended to a monthly CSV file in `acurris-leads/`, next to `public_html`, so you have a record even if an email goes astray.

Spam protection: a hidden honeypot field, a three-second minimum fill time, and a limit of 10 submissions per IP per hour.

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

## Photos

The site launches without photos. The stock libraries could not be reached from the build environment, and placeholders would look unfinished. The layout works without them. When you have licensed lab and field photos, or packaging renders, send them over and they can go into the home hero, category heroes and solution pages as WebP files.

## Licenses

Plus Jakarta Sans (SIL Open Font License, `src/assets/fonts/OFL.txt`), Lucide icons (ISC), PHPMailer (LGPL 2.1, `src/api/lib/PHPMailer-LICENSE.txt`).
