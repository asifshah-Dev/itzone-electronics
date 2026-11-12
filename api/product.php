<?php
declare(strict_types=1);

/**
 * GET /api/product.php?id=LAP-0001
 *   ?id=<sku>     — required — matches your product.html?id=lap-002 URLs
 *
 * Returns JSON:
 *   - Success: { "ok": true, "product": {...} }
 *   - Failure: { "ok": false, "error": "..." }  (404 if not found)
 *
 * The `product` object has the SAME shape as one entry from api/products.php,
 * so product.page.js can drop it straight into its renderer.
 */

ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/php-errors.log');
error_reporting(E_ALL);
ob_start();

register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        while (ob_get_level() > 0) ob_end_clean();
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode(['ok' => false, 'error' => 'Server error']);
    }
});

require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $id = trim((string) ($_GET['id'] ?? ''));
    if ($id === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing id parameter']);
        exit;
    }

    $pdo = db();

    // Match by sku OR slug — so old `lap-002` still resolves if you kept the SKU
    $stmt = $pdo->prepare(
        'SELECT * FROM products WHERE (sku = ? OR slug = ?) AND published = 1 LIMIT 1'
    );
    $stmt->execute([$id, $id]);
    $r = $stmt->fetch();

    if (!$r) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Product not found']);
        exit;
    }

    // Images
    $stmt = $pdo->prepare(
        'SELECT file_path FROM product_images WHERE product_id = ? ORDER BY position ASC, id ASC'
    );
    $stmt->execute([(int) $r['id']]);
    $images = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Build the same shape as products.php
    $gen = '';
    if (!empty($r['cpu']) && preg_match('/\b(\d{1,2}(?:TH|ST|ND|RD))\b/i', (string) $r['cpu'], $m)) {
        $gen = strtoupper($m[1]);
    }

    $ssd = null;
    $hdd = null;
    if (!empty($r['storage_value'])) {
        if (($r['storage_type'] ?? '') === 'SSD' || ($r['storage_type'] ?? '') === 'NVMe') {
            $ssd = (int) $r['storage_value'];
        } elseif (($r['storage_type'] ?? '') === 'HDD') {
            $hdd = $r['storage_value'] . 'GB HDD';
        } else {
            $ssd = (int) $r['storage_value'];
        }
    }

    $features = [];
    if (!empty($r['features'])) {
        $decoded = json_decode((string) $r['features'], true);
        if (is_array($decoded)) $features = $decoded;
    }

    $product = [
        'id'     => (string) $r['sku'],
        'sku'    => (string) $r['sku'],
        'slug'   => (string) $r['slug'],

        'category'        => $r['category'],
        'brand'           => $r['brand'],
        'model'           => $r['model'],
        'condition_grade' => $r['condition_grade'],
        'condition'       => $r['condition_grade'],

        'processor' => $r['processor'],
        'cpu'       => $r['cpu'],
        'gen'       => $gen,
        'ram'       => $r['ram_gb'] !== null ? (int) $r['ram_gb'] : null,
        'ram_gb'    => $r['ram_gb'] !== null ? (int) $r['ram_gb'] : null,
        'ssd'       => $ssd,
        'hdd'       => $hdd,
        'storage_value' => $r['storage_value'] !== null ? (int) $r['storage_value'] : null,
        'storage_type'  => $r['storage_type'],
        'gpu'       => $r['gpu'],
        'screen'    => $r['screen'],
        'resolution'=> $r['resolution'],
        'battery'   => $r['battery'],
        'features'  => $features,

        'price'        => (float) $r['price'],
        'currency'     => $r['currency'],
        'stock_qty'    => (int) $r['stock_qty'],
        'stock_status' => $r['stock_status'],
        'warranty'     => $r['warranty'],

        'images' => $images,

        'published'  => (int) $r['published'],
        'created_at' => $r['created_at'],
    ];

    while (ob_get_level() > 0) ob_end_clean();
    echo json_encode(['ok' => true, 'product' => $product], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    while (ob_get_level() > 0) ob_end_clean();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}