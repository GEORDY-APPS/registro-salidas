<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'adsa_g4');
define('DB_USER', 'adsa_g4');
define('DB_PASS', 'grupo4m');
define('DB_PORT', 3306);

define('RENIEC_TOKEN', 'sk_12872.O7LAvWbTyDcMSCIhh9sYuL5Irbwsc3fk');
define('RENIEC_URL',   'https://api.decolecta.com/v1/reniec/dni');

define('CORS_ORIGIN', '*');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT
             . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}