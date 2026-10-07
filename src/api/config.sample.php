<?php
/**
 * Copy this file to acurris-config.php ONE LEVEL ABOVE public_html (preferred),
 * or to config.php in this folder, then fill in the values.
 * Never commit or email the real file: it holds the mailbox password.
 */
return [
    // Where leads are delivered, and the address they are sent from (create this mailbox in cPanel).
    'to_email'    => 'enquiries@acurrisanalytical.com',
    'from_email'  => 'enquiries@acurrisanalytical.com',
    'from_name'   => 'Acurris Analytical website',

    // cPanel > Email Accounts > Connect Devices shows these values. Leave smtp_host empty to use PHP mail().
    'smtp_host'   => 'mail.acurrisanalytical.com',
    'smtp_port'   => 465,
    'smtp_secure' => 'ssl',          // 'ssl' for port 465, 'tls' for port 587
    'smtp_user'   => 'enquiries@acurrisanalytical.com',
    'smtp_pass'   => 'CHANGE-ME',
    'allowed_origin' => '',          // exact frontend origin only when the site and API use different origins

    // CSV lead log. Default: a folder next to public_html, not reachable from the web.
    // 'log_dir'  => '/home/CPANEL-USER/acurris-leads',

    'rate_limit'    => 10,           // max submissions per IP per hour
    'support_hours' => 48,
    'site_url'      => 'https://acurrisanalytical.com',
];
