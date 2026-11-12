<?php
declare(strict_types=1);

/**
 * GET /api/products.php
 *   ?category=laptop|desktop|monitor   (optional — omit for all)
 *   ?grouped=1                          (optional — return grouped object like /data/pcs.json)
 *
 * Returns JSON:
 *   - Default: flat array of product objects
 *   - With grouped=1: { "desktops": [...], "tiny": [...], "monitors": [...] }
 *     (desktops = desktop category, tiny = desktop w/ CPU <= 8th gen, monitors = monitor category)
 *   - With category=laptop: flat array (matches /data/laptops.json)
 *   - With category=monitor: flat array
 *
 * Only PUBLISHED products are returned. Stock status is included per product.
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
header('Cache-Control: public, max-age=60'); // 1-min cache — frontend feels instant, DB stays quiet
header('Access-Control-Allow-Origin: *');

try {
    $pdo = db();

    $category = trim((string) ($_GET['category'] ?? ''));
    $grouped  = isset($_GET['grouped']) && $_GET['grouped'] === '1';
    $brand    = trim((string) ($_GET['brand'] ?? ''));
    $stock    = trim((string) ($_GET['stock'] ?? ''));   // 'in_stock' | 'out_of_stock'

    $sql    = "SELECT id, sku, slug, category, brand, model, condition_grade,
                      processor, cpu, ram_gb, storage_value, storage_type, gpu,
                      screen, resolution, features, price, currency,
                      stock_qty, stock_status, warranty, battery, published, created_at
                 FROM products
                WHERE published = 1";
    $params = [];

    if ($category !== '' && in_array($category, ['laptop', 'desktop', 'monitor'], true)) {
        $sql .= ' AND category = ?';
        $params[] = $category;
    }
    if ($brand !== '') {
        $sql .= ' AND brand = ?';
        $params[] = $brand;
    }
    if ($stock === 'in_stock' || $stock === 'out_of_stock') {
        $sql .= ' AND stock_status = ?';
        $params[] = $stock;
    }
    $sql .= ' ORDER BY created_at DESC, id DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Attach images (up to 3 per product) in position order
    if (!empty($rows)) {
        $ids = array_column($rows, 'id');
        $in  = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare(
            "SELECT product_id, file_path, position
               FROM product_images
              WHERE product_id IN ($in)
           ORDER BY product_id ASC, position ASC, id ASC"
        );
        $stmt->execute($ids);
        $imagesByProduct = [];
        foreach ($stmt->fetchAll() as $img) {
            $imagesByProduct[(int) $img['product_id']][] = $img['file_path'];
        }
    } else {
        $imagesByProduct = [];
    }

    // Map each row to the shape the frontend expects
    // Your current JSON has: id, brand, model, cpu, gen, ram, ssd, hdd, gpu, screen,
    //                        resolution, size, features, price, images, ...
    // We produce a superset that includes both old and new field names so nothing breaks.
    $out = [];
    foreach ($rows as $r) {
        $images = $imagesByProduct[(int) $r['id']] ?? [];

        // "gen" was a separate field on laptops in your JSON (e.g. "11TH")
        // Extract from cpu if present (e.g. "I7 11TH" -> "11TH") — best-effort
        $gen = '';
        if (!empty($r['cpu']) && preg_match('/\b(\d{1,2}(?:TH|ST|ND|RD))\b/i', (string) $r['cpu'], $m)) {
            $gen = strtoupper($m[1]);
        }

        // Storage: your JSON used `ssd` (int GB) and sometimes `hdd` (string). Rebuild both.
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

        $out[] = [
            // identity
            'id'     => (string) $r['sku'],       // ← frontend uses `id` as `?id=lap-002`, matches SKU
            'sku'    => (string) $r['sku'],
            'slug'   => (string) $r['slug'],

            // classification
            'category'        => $r['category'],
            'brand'           => $r['brand'],
            'model'           => $r['model'],
            'condition_grade' => $r['condition_grade'],
            'condition'       => $r['condition_grade'], // alias, both work

            // specs — old field names for compatibility
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

            // features — frontend expects array of strings
            'features' => $features,

            // pricing & stock
            'price'        => (float) $r['price'],
            'currency'     => $r['currency'],
            'stock_qty'    => (int) $r['stock_qty'],
            'stock_status' => $r['stock_status'],
            'warranty'     => $r['warranty'],

            // images — frontend expects array of paths like "assets/img/products/lap-001-1.jpg"
            // We prepend "../" or base path depending on where frontend calls from.
            // Your old JSON had paths relative to site root: "assets/img/products/lap-001-1.jpg"
            // The API returns the DB path as-is: "uploads/products/LAP-0001-xxxx.jpg".
            // Frontend will resolve; if you want them under /assets/img/products/, adjust here.
            'images' => $images,

            // meta
            'published'  => (int) $r['published'],
            'created_at' => $r['created_at'],
        ];
    }

    // If grouped=1, split into the { desktops, tiny, monitors } shape your pcs.page.js expects
    if ($grouped) {
        $groupedOut = ['desktops' => [], 'tiny' => [], 'monitors' => []];

        foreach ($out as $p) {
            if ($p['category'] === 'monitor') {
                $groupedOut['monitors'][] = $p;
            } elseif ($p['category'] === 'desktop') {
                // Split desktops into "desktops" vs "tiny" by heuristic:
                // tiny = CPU string ends with 4TH/5TH/6TH/7TH/8TH gen (older/smaller units)
                $isTiny = false;
                if (!empty($p['gen'])) {
                    $genNum = (int) preg_replace('/\D/', '', $p['gen']);
                    if ($genNum > 0 && $genNum <= 8) $isTiny = true;
                }
                if ($isTiny) $groupedOut['tiny'][] = $p;
                else         $groupedOut['desktops'][] = $p;
            }
        }

        while (ob_get_level() > 0) ob_end_clean();
        echo json_encode($groupedOut, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Default: flat array (matches your laptops.json shape)
    while (ob_get_level() > 0) ob_end_clean();
    echo json_encode($out, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    while (ob_get_level() > 0) ob_end_clean();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}