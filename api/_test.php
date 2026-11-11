<?php
/**
 * TEMPORARY — connection test. Delete after Step 1 is verified.
 * Visit: http://localhost/itzone-electronics/api/_test.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db();

    $products   = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
    $images     = (int) $pdo->query('SELECT COUNT(*) FROM product_images')->fetchColumn();
    $admins     = (int) $pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();

    $version = $pdo->query('SELECT VERSION()')->fetchColumn();

    echo json_encode([
        'ok'             => true,
        'mysql_version'  => $version,
        'database'       => 'itzone_electronics',
        'products_count' => $products,
        'images_count'   => $images,
        'admins_count'   => $admins,
        'message'        => 'Database connection and schema verified.',
    ], JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok'    => false,
        'error' => $e->getMessage(),
    ], JSON_PRETTY_PRINT);
}