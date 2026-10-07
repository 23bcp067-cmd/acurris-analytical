---
layout: layouts/page.njk
permalink: /privacy/
title: Privacy notice
metaTitle: "Privacy Notice | Acurris Analytical"
description: "How Acurris Analytical collects, uses and protects personal data submitted through this website."
heading: Privacy notice
eleventyComputed:
  intro: "Last updated {{ build.date | readableDate }}."
hideCtaBand: true
breadcrumbs:
  - label: Privacy
---
<section class="section"><div class="wrap"><div class="prose">

This notice explains how Acurris Analytical, a division of Acurris Biosystems ("we", "us"), handles personal data you submit through acurrisanalytical.com. We process personal data in line with India's Digital Personal Data Protection Act, 2023.

## What we collect

When you fill in a form on this site, we collect the details you enter: your name, organization, mobile number, email address, and any information about your testing needs, location, GST number or delivery address that you choose to give. We also record the page you submitted from and the time.

If you accept analytics cookies, Google Analytics collects information about how you use the site, such as pages viewed and buttons clicked. See our [cookie policy](/cookies/).

## Why we collect it

We use your details only to reply to your enquiry, prepare a quotation, send a spec sheet or evaluation pack you asked for, and follow up on that request. We do not sell your data or share it with third parties for their marketing.

## Your consent

We process form data on the basis of the consent you give by ticking the box on the form. You can withdraw consent at any time by emailing {{ site.email }}. Withdrawing consent stops further processing but does not affect processing that happened before.

## Who can see it

Our sales and technical staff. Our email and website hosting providers store the data on our behalf. We may share your details with a courier only to deliver an evaluation pack or order you requested.

## How long we keep it

We keep enquiry records for up to three years after our last contact with you, or longer if a law requires it (for example, invoice records for tax purposes). We then delete them.

## Your rights

You can ask us to access, correct, update or erase your personal data, and you can nominate another person to exercise these rights for you. Email {{ site.email }}. We reply within 30 days. If you are not satisfied with our response, you may complain to the Data Protection Board of India.

## Security

Forms on this site are sent over an encrypted (HTTPS) connection. We limit access to enquiry data to the staff who need it.

## Contact

Questions about this notice: {{ site.email }}{% if site.address.length %}, or write to {{ site.address | join(", ") }}{% endif %}.

</div></div></section>
