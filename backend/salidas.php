<?php
// backend/salidas.php
//  GET    ?empresa=China Civil   → lista de salidas filtradas
//  POST   { empresa, ruta, dni, nombre, firma_b64 } → insertar
//  DELETE (admin) → borrar todo
require_once __DIR__ . '/cors.php';
setCorsHeaders();
verifyToken();   // todas las rutas requieren token válido

$method = $_SERVER['REQUEST_METHOD'];

// ── GET ──────────────────────────────────────────────────────────────────────
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
        jsonError('Error BD: ' . $e->getMessage(), 500);
    }
}

// ── POST ─────────────────────────────────────────────────────────────────────
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
        jsonError('Error BD: ' . $e->getMessage(), 500);
    }
}

// ── DELETE (solo admin) ───────────────────────────────────────────────────────
if ($method === 'DELETE') {
    requireAdmin();
    try {
        getDB()->exec('DELETE FROM salidas');
        jsonResponse(['ok' => true, 'msg' => 'Tabla limpia']);
    } catch (PDOException $e) {
        jsonError('Error BD: ' . $e->getMessage(), 500);
    }
}

jsonError('Método no soportado', 405);

// ── HELPERS DE AUTENTICACIÓN ─────────────────────────────────────────────────
function verifyToken(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token  = str_replace('Bearer ', '', $header);
    if (!$token) jsonError('Sin token', 401);

    [$payload, $sig] = explode('.', $token) + [null, null];
    if (!$payload || !$sig) jsonError('Token inválido', 401);

    $expected = hash_hmac('sha256', $payload, 'ApuTranspor_Sis_2026_Sec_Key_UAC');
    if (!hash_equals($expected, $sig)) jsonError('Token inválido', 401);

    $data = json_decode(base64_decode($payload), true);
    if (!$data || $data['exp'] < time()) jsonError('Token expirado', 401);

    return $data;
}

function requireAdmin(): void {
    $data = verifyToken();
    if ($data['rol'] !== 'admin') jsonError('Acceso denegado', 403);
}
