<?php
/**
 * Acurris Analytical lead handler.
 * Receives every website form (rfq1, rfq2, sample, spec, expo), validates it,
 * emails the team, sends the visitor a confirmation, and logs the lead to CSV.
 *
 * Configuration: copy config.sample.php to config.php (or, better, to
 * acurris-config.php one level ABOVE public_html) and fill in the values.
 */
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

ini_set('display_errors', '0');
ini_set('log_errors', '1');

require __DIR__ . '/lib/Exception.php';
require __DIR__ . '/lib/PHPMailer.php';
require __DIR__ . '/lib/SMTP.php';

/* ---------- Config ---------- */
$configCandidates = [
    dirname(__DIR__, 2) . '/acurris-config.php', // above public_html (preferred)
    __DIR__ . '/config.php',
];
$config = null;
foreach ($configCandidates as $c) {
    if (is_file($c)) { $config = require $c; break; }
}
if (!is_array($config)) {
    respond(false, 'The form is not configured yet. Please email us directly.', 500);
}
$cfg = array_merge([
    'to_email'      => '',
    'from_email'    => '',
    'from_name'     => 'Acurris Analytical website',
    'smtp_host'     => '',
    'smtp_port'     => 465,
    'smtp_secure'   => 'ssl',
    'smtp_user'     => '',
    'smtp_pass'     => '',
    'allowed_origin' => '',
    'log_dir'       => dirname(__DIR__, 2) . '/acurris-leads',
    'rate_limit'    => 10,
    'support_hours' => 48,
    'site_url'      => 'https://acurrisanalytical.com',
], $config);

$allowedOrigin = rtrim((string)$cfg['allowed_origin'], '/');
$requestOrigin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
$originAllowed = $allowedOrigin !== '' && $requestOrigin === $allowedOrigin;
if ($originAllowed) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Accept, Content-Type');
}
if ($requestOrigin !== '' && $allowedOrigin !== '' && !$originAllowed) {
    respond(false, 'Origin not allowed.', 403);
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    if (!$originAllowed) respond(false, 'Origin not allowed.', 403);
    http_response_code(204);
    exit;
}

/* ---------- Helpers ---------- */
function wants_json(): bool {
    return isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;
}

function respond(bool $ok, string $message = '', int $code = 200, array $extra = []): void {
    http_response_code($ok ? 200 : $code);
    if (wants_json() || !$ok) {
        header('Content-Type: application/json; charset=utf-8');
        $json = json_encode(array_merge(['ok' => $ok, 'error' => $ok ? null : $message], $extra), JSON_INVALID_UTF8_SUBSTITUTE);
        echo $json === false ? '{"ok":false,"error":"Unable to create response."}' : $json;
        exit;
    }
    if ($ok && !empty($extra['redirect'])) {
        header('Location: ' . $extra['redirect'], true, 303);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    $msg = htmlspecialchars($message ?: 'Something went wrong.', ENT_QUOTES, 'UTF-8');
    echo "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
       . "<title>Form error</title><body style='font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;color:#0f172a'>"
       . "<h1>We couldn't send your request</h1><p>{$msg}</p><p><a href='javascript:history.back()'>Go back and try again</a></p></body>";
    exit;
}

function clean(string $key, int $max = 300): string {
    $v = $_POST[$key] ?? '';
    if (!is_string($v)) return '';
    $v = trim(strip_tags($v));
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
}

function one_line(string $v): string {
    return trim(preg_replace('/[\r\n]+/', ' ', $v) ?? '');
}

/* ---------- Method and spam checks ---------- */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'Method not allowed.', 405);
}

$type = clean('form_type', 20);
$redirects = [
    'rfq1'   => '/thank-you/quote/',
    'rfq2'   => '/thank-you/quote/',
    'sample' => '/thank-you/sample/',
    'spec'   => '/thank-you/spec/',
    'expo'   => '/thank-you/quote/',
];
if (!isset($redirects[$type])) respond(false, 'Unknown form.', 400);
$redirect = $redirects[$type];

// Honeypot: bots fill hidden fields. Pretend success, send nothing.
if (clean('company_website') !== '') respond(true, '', 200, ['redirect' => $redirect, 'lead_id' => '']);

// Time trap: humans take more than 3 seconds to fill a form.
$ts = clean('ts', 20);
if ($ts !== '' && ctype_digit($ts) && (microtime(true) * 1000 - (float)$ts) < 3000) {
    respond(true, '', 200, ['redirect' => $redirect, 'lead_id' => '']);
}

// Rate limit per IP per hour.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlFile = rtrim(sys_get_temp_dir(), '/') . '/aa_rl_' . hash('sha256', $ip);
$now = time();
$hits = [];
if (is_file($rlFile)) {
    $hits = array_filter(array_map('intval', explode(',', (string)file_get_contents($rlFile))), fn($t) => $t > $now - 3600);
}
if (count($hits) >= (int)$cfg['rate_limit']) {
    respond(false, 'Too many requests from your connection. Please email us directly.', 429);
}
$hits[] = $now;
@file_put_contents($rlFile, implode(',', $hits), LOCK_EX);

/* ---------- Fields ---------- */
$categories = [
    'quechers' => 'QuEChERS', 'mycotoxins' => 'Mycotoxins', 'antibiotic-residues' => 'Antibiotic residues',
    'food-adulteration' => 'Food adulteration', 'pesticide-residues' => 'Pesticide residues',
    'foodborne-pathogens' => 'Foodborne pathogens', 'food-allergens' => 'Food allergens', 'dspe' => 'dSPE',
    'spe' => 'SPE', 'filtration' => 'Filtration', 'sample-handling' => 'Sample handling',
    'several' => 'Several categories', 'not-sure' => 'Not sure yet',
];

$f = [
    'name'             => one_line(clean('name', 120)),
    'organization'     => one_line(clean('organization', 160)),
    'mobile'           => one_line(clean('mobile', 20)),
    'email'            => one_line(clean('email', 160)),
    'category'         => one_line(clean('category', 40)),
    'quantity'         => one_line(clean('quantity', 80)),
    'unit'             => one_line(clean('unit', 40)),
    'requirement'      => one_line(clean('requirement', 500)),
    'org_type'         => one_line(clean('org_type', 80)),
    'volume'           => one_line(clean('volume', 40)),
    'analytes'         => one_line(clean('analytes', 300)),
    'matrix'           => one_line(clean('matrix', 300)),
    'location'         => one_line(clean('location', 120)),
    'timeline'         => one_line(clean('timeline', 40)),
    'gst'              => strtoupper(one_line(clean('gst', 15))),
    'message'          => clean('message', 2000),
    'delivery_address' => clean('delivery_address', 500),
    'event'            => one_line(clean('event', 120)),
    'page'             => one_line(clean('page', 200)),
    'consent'          => clean('consent', 5),
    'lead_id'          => one_line(clean('lead_id', 40)),
    'items'            => one_line(clean('items', 1500)),
];

$required = [
    'rfq1'   => ['name', 'organization', 'mobile', 'email', 'category', 'consent'],
    'rfq2'   => ['lead_id'],
    'sample' => ['name', 'organization', 'mobile', 'email', 'category', 'org_type', 'volume', 'analytes', 'matrix', 'location', 'timeline', 'delivery_address', 'consent'],
    'spec'   => ['name', 'organization', 'email', 'category', 'consent'],
    'expo'   => ['name', 'organization', 'mobile', 'email', 'category', 'consent'],
][$type];

$labels = [
    'name' => 'Full name', 'organization' => 'Organization', 'mobile' => 'Mobile number', 'email' => 'Work email',
    'category' => 'Product category', 'quantity' => 'Quantity', 'unit' => 'Unit', 'requirement' => 'Application / requirement',
    'org_type' => 'Organization type', 'volume' => 'Tests per month',
    'analytes' => 'Analytes or products', 'matrix' => 'Sample matrix', 'location' => 'City and state',
    'timeline' => 'Timeline', 'gst' => 'GST number', 'message' => 'Message', 'delivery_address' => 'Delivery address',
    'event' => 'Where we met', 'items' => 'Quote list', 'page' => 'Submitted from', 'lead_id' => 'Lead ID',
];

$errors = [];
foreach ($required as $r) {
    if ($f[$r] === '') $errors[] = ($r === 'consent' ? 'Consent' : $labels[$r]) . ' is required';
}
if ($f['consent'] !== '' && $f['consent'] !== 'yes') $errors[] = 'Consent is required';
if ($f['email'] !== '' && !filter_var($f['email'], FILTER_VALIDATE_EMAIL)) $errors[] = 'Email address is not valid';
if ($f['mobile'] !== '') {
    $digits = preg_replace('/\D/', '', $f['mobile']) ?? '';
    if (strlen($digits) < 10 || strlen($digits) > 13) $errors[] = 'Mobile number is not valid';
}
if ($f['category'] !== '' && !isset($categories[$f['category']])) $errors[] = 'Product category is not valid';
if ($f['gst'] !== '' && !preg_match('/^[0-9A-Z]{15}$/', $f['gst'])) $errors[] = 'GST number must be 15 letters and digits';
if ($type === 'rfq2' && !preg_match('/^AA-\d{8}-[A-F0-9]{6}$/', $f['lead_id'])) $errors[] = 'Your session expired. Please email us the details instead';

if ($errors) respond(false, implode('. ', $errors) . '.', 422);

/* ---------- Lead ID ---------- */
$leadId = $type === 'rfq2' ? $f['lead_id'] : 'AA-' . gmdate('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
$catLabel = $categories[$f['category']] ?? '';

/* ---------- Log to CSV ---------- */
$logDir = (string)$cfg['log_dir'];
if (!is_dir($logDir)) @mkdir($logDir, 0750, true);
if (is_dir($logDir) && is_writable($logDir)) {
    $csv = $logDir . '/leads-' . gmdate('Y-m') . '.csv';
    $isNew = !is_file($csv);
    $fh = @fopen($csv, 'ab');
    if ($fh) {
        flock($fh, LOCK_EX);
        $cols = ['received_utc', 'lead_id', 'form_type', 'name', 'organization', 'mobile', 'email', 'category', 'quantity', 'unit', 'requirement', 'org_type', 'volume', 'analytes', 'matrix', 'location', 'timeline', 'gst', 'event', 'items', 'delivery_address', 'message', 'page'];
        if ($isNew) fputcsv($fh, $cols);
        $row = [gmdate('c'), $leadId, $type];
        foreach (array_slice($cols, 3) as $c) {
            $v = $c === 'category' ? $catLabel : ($f[$c] ?? '');
            if ($v !== '' && strpbrk($v[0], '=+-@') !== false) $v = "'" . $v; // block spreadsheet formula injection
            $row[] = $v;
        }
        fputcsv($fh, $row);
        flock($fh, LOCK_UN);
        fclose($fh);
    }
}

/* ---------- Email ---------- */
function mailer(array $cfg): PHPMailer {
    $m = new PHPMailer(true);
    $m->CharSet = 'UTF-8';
    if ($cfg['smtp_host'] !== '') {
        $m->isSMTP();
        $m->Host = $cfg['smtp_host'];
        $m->Port = (int)$cfg['smtp_port'];
        $m->SMTPAuth = $cfg['smtp_user'] !== '';
        $m->Username = $cfg['smtp_user'];
        $m->Password = $cfg['smtp_pass'];
        if ($cfg['smtp_secure'] === 'tls') {
            $m->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        } elseif ($cfg['smtp_secure'] === 'ssl') {
            $m->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $m->SMTPSecure = '';
            $m->SMTPAutoTLS = false;
        }
    } else {
        $m->isMail();
    }
    $m->setFrom($cfg['from_email'], $cfg['from_name']);
    return $m;
}

$tags = ['rfq1' => 'RFQ', 'rfq2' => 'RFQ DETAILS', 'sample' => 'SAMPLE', 'spec' => 'SPEC', 'expo' => 'EXPO'];
$subject = sprintf('[%s] %s%s%s (%s)',
    $tags[$type],
    $f['name'] ?: 'Step 2',
    $f['organization'] ? ', ' . $f['organization'] : '',
    $catLabel ? ', ' . $catLabel : '',
    $leadId
);

$lines = ["Lead ID: {$leadId}", 'Form: ' . $tags[$type], 'Received: ' . gmdate('Y-m-d H:i') . ' UTC', ''];
foreach ($labels as $k => $label) {
    if ($k === 'lead_id') continue;
    $v = $k === 'category' ? $catLabel : $f[$k];
    if ($v !== '') $lines[] = "{$label}: {$v}";
}
if ($type === 'rfq2') {
    $lines[] = '';
    $lines[] = 'This adds detail to the step 1 request with the same lead ID.';
}
$lines[] = '';
$lines[] = "Reply within {$cfg['support_hours']} working hours.";

try {
    $m = mailer($cfg);
    $m->addAddress($cfg['to_email']);
    if ($f['email'] !== '' && filter_var($f['email'], FILTER_VALIDATE_EMAIL)) $m->addReplyTo($f['email'], $f['name']);
    $m->Subject = $subject;
    $m->Body = implode("\n", $lines);
    $m->send();
} catch (MailException $e) {
    error_log('Acurris lead mail failed: ' . $e->getMessage());
    respond(false, 'We could not send your request just now. Please email ' . $cfg['to_email'] . ' and we will reply within ' . $cfg['support_hours'] . ' hours.', 500);
}

// Confirmation to the visitor (not for step 2, they already got one).
if ($type !== 'rfq2' && $f['email'] !== '') {
    $what = [
        'rfq1'   => 'your quote request',
        'sample' => 'your evaluation pack request',
        'spec'   => 'your spec sheet request',
        'expo'   => 'your details from the event',
    ][$type];
    $body = "Hello {$f['name']},\n\n"
        . "Thank you for {$what}" . ($catLabel ? " ({$catLabel})" : '') . ". "
        . "A member of our technical team will reply within {$cfg['support_hours']} hours on working days.\n\n"
        . "Your reference: {$leadId}\n\n"
        . ($type === 'sample' ? "Nothing ships and nothing is charged until you confirm. The pack cost is credited against your first order.\n\n" : '')
        . "If you have more detail to add, reply to this email.\n\n"
        . "Acurris Analytical\n{$cfg['site_url']}\n";
    try {
        $c = mailer($cfg);
        $c->addAddress($f['email'], $f['name']);
        $c->addReplyTo($cfg['to_email'], 'Acurris Analytical');
        $c->Subject = 'We received ' . $what . " ({$leadId})";
        $c->Body = $body;
        $c->send();
    } catch (MailException $e) {
        error_log('Acurris confirmation mail failed: ' . $e->getMessage());
    }
}

respond(true, '', 200, ['redirect' => $redirect, 'lead_id' => $leadId]);
