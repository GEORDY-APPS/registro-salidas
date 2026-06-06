<?php
// backend/reniec.php — POST { dni } → datos RENIEC
require_once __DIR__ . '/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Solo POST', 405);

$body = json_decode(file_get_contents('php://input'), true);
$dni  = preg_replace('/\D/', '', $body['dni'] ?? '');

if (strlen($dni) !== 8) jsonError('DNI inválido');

$url = RENIEC_URL . '?numero=' . $dni;
$ch  = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . RENIEC_TOKEN,
    ],
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err      = curl_error($ch);
curl_close($ch);

if ($err) jsonError($err, 500);
http_response_code($httpCode);
echo $response;
