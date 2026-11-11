<?php
/**
 * PDO connection factory. Include this file and call db() to get a connection.
 *   require_once __DIR__ . '/config/db.php';
 *   $pdo = db();
 */

declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = require __DIR__ . '/config.php';
    $c = $config['db'];

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $c['host'],
        $c['port'],
        $c['name'],
        $c['charset']
    );

    try {
        $pdo = new PDO($dsn, $c['user'], $c['password'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        if (!empty($config['debug'])) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'ok'    => false,
                'error' => 'Database connection failed',
                'detail' => $e->getMessage(),
            ]);
            exit;
        }
        http_response_code(500);
        echo 'Database connection error.';
        exit;
    }

    return $pdo;
}