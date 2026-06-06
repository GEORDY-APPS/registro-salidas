<?php
// backend/login.php — POST { username, password } → { token, rol }
require_once __DIR__ . '/cors.php';
setCorsHeaders();
 
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Solo POST', 405);
 
$body = json_decode(file_get_contents('php://input'), true);
$user = trim($body['username'] ?? '');
$pass = trim($body['password'] ?? '');
 
if (!$user || !$pass) jsonError('Faltan credenciales');
 
try {
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id, password, rol FROM usuarios WHERE username = ?');
    $stmt->execute([$user]);
    $row  = $stmt->fetch();
 
    if (!$row || !password_verify($pass, $row['password'])) {
        jsonError('Credenciales incorrectas', 401);
    }
 
    $payload = base64_encode(json_encode([
        'id'  => $row['id'],
        'rol' => $row['rol'],
        'exp' => time() + 86400
    ]));
    $sig   = hash_hmac('sha256', $payload, 'ApuTranspor_Sis_2026_Sec_Key_UAC');
    $token = $payload . '.' . $sig;
 
    jsonResponse(['token' => $token, 'rol' => $row['rol']]);
 
} catch (PDOException $e) {
    jsonError('Error BD: ' . $e->getMessage(), 500);
}