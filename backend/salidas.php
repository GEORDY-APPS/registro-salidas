<?php
require_once __DIR__ . '/cors.php';
setCorsHeaders();

define('ERROR_BD', 'Error BD: ');

function getTokenFromRequest(): string {
    if (!empty($_SERVER['HTTP_X_TOKEN'])) {
        return $_SERVER['HTTP_X_TOKEN'];
    }
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
    }
    $body = json_decode(file_get_contents('php://input'), true);
    if (!empty($body['_token'])) {
        return $body['_token'];
    }
    if (!empty($_GET['_token'])) {
        return $_GET['_token'];
    }
    return '';
}

verifyToken();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $empresa = $_GET['empresa'] ?? '';
    try {
        $pdo = getDB();
        if ($empresa) {
            $stmt = $pdo->prepare(
                'SELECT id, empresa, ruta, dni, nombre, firma_b64,
                        DATE_FORMAT(fecha, "%d/%m/%Y %H:%i") AS fecha
                   FROM salidas WHERE empresa = ? ORDER BY fecha DESC'
            );
            $stmt->execute([$empresa]);
        } else {
            $stmt = $pdo->query(
                'SELECT id, empresa, ruta, dni, nombre, firma_b64,
                        DATE_FORMAT(fecha, "%d/%m/%Y %H:%i") AS fecha
                   FROM salidas ORDER BY fecha DESC'
            );
        }
        jsonResponse($stmt->fetchAll());
    } catch (PDOException $e) {
        jsonError(ERROR_BD . $e->getMessage(), 500);
    }
}

if ($method === 'POST') {
    $body    = json_decode(file_get_contents('php://input'), true);
    $empresa = trim($body['empresa']   ?? '');
    $ruta    = trim($body['ruta']      ?? '');
    $dni     = trim($body['dni']       ?? '');
    $nombre  = trim($body['nombre']    ?? '');
    $firma   = $body['firma_b64']      ?? '';

    if (!$empresa || !$ruta || strlen($dni) !== 8 || !$nombre) {
        jsonError('Datos incompletos');
    }

    try {
        $pdo  = getDB();
        $stmt = $pdo->prepare(
            'INSERT INTO salidas (empresa, ruta, dni, nombre, firma_b64)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$empresa, $ruta, $dni, $nombre, $firma]);
        jsonResponse(['id' => $pdo->lastInsertId(), 'ok' => true], 201);
    } catch (PDOException $e) {
        jsonError(ERROR_BD . $e->getMessage(), 500);
    }
}

if ($method === 'DELETE') {
    requireAdmin();
    try {
        getDB()->exec('DELETE FROM salidas');
        jsonResponse(['ok' => true, 'msg' => 'Tabla limpia']);
    } catch (PDOException $e) {
        jsonError(ERROR_BD . $e->getMessage(), 500);
    }
}

jsonError('Método no soportado', 405);

function verifyToken(): array {
    $token = getTokenFromRequest();
    if (!$token) {
        jsonError('Sin token', 401);
    }

    $parts = explode('.', $token);
    if (count($parts) !== 2) {
        jsonError('Token inválido', 401);
    }

    [$payload, $sig] = $parts;
    $expected = hash_hmac('sha256', $payload, 'ApuTranspor_Sis_2026_Sec_Key_UAC');
    if (!hash_equals($expected, $sig)) {
        jsonError('Token inválido', 401);
    }

    $data = json_decode(base64_decode($payload), true);
    if (!$data || $data['exp'] < time()) {
        jsonError('Token expirado', 401);
    }

    return $data;
}

function requireAdmin(): void {
    $data = verifyToken();
    if ($data['rol'] !== 'admin') {
        jsonError('Acceso denegado', 403);
    }
}
