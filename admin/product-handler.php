<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
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
        echo json_encode([
            'ok'      => false,
            'message' => 'Server error.',
            'detail'  => $err['message'] . ' @ ' . basename($err['file']) . ':' . $err['line'],
        ]);
    }
});

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/helpers.php';

auth_start();
auth_require();

$wantsJson = (
    (isset($_SERVER['HTTP_ACCEPT']) && str_contains(strtolower((string) $_SERVER['HTTP_ACCEPT']), 'application/json'))
    || (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest')
);

function respond(bool $ok, string $message, string $detail = '', array $extra = [], int $code = 200): void
{
    global $wantsJson;
    while (ob_get_level() > 0) ob_end_clean();
    if ($wantsJson) {
        if (!headers_sent()) {
            http_response_code($code);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode(array_merge(['ok' => $ok, 'message' => $message, 'detail' => $detail], $extra));
        exit;
    }
    flash_set($ok ? 'success' : 'danger', trim($message . ' ' . $detail));
    header('Location: products.php');
    exit;
}

set_error_handler(function (int $severity, string $msg, string $file, int $line) {
    if (!(error_reporting() & $severity)) return false;
    throw new ErrorException($msg, 0, $severity, $file, $line);
});

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(false, 'Method not allowed', '', [], 405);
    }
    if (!csrf_check($_POST['_csrf'] ?? null)) {
        respond(false, 'Security check failed.', 'Refresh and try again.', [], 419);
    }

    $action = (string) ($_POST['action'] ?? '');
    $pdo    = db();

    $uploadDir = __DIR__ . '/../uploads/products/';
    if (!is_dir($uploadDir)) @mkdir($uploadDir, 0755, true);
    if (!is_dir($uploadDir) || !is_writable($uploadDir)) {
        respond(false, 'Upload folder not writable.', 'Create /uploads/products/ and set permissions.', [], 500);
    }

    $MAX_BYTES  = 5 * 1024 * 1024;
    $MAX_IMAGES = 3;

    $ALLOWED_MIME = [
        'image/jpeg'  => 'jpg',
        'image/jpg'   => 'jpg',
        'image/pjpeg' => 'jpg',
        'image/png'   => 'png',
        'image/x-png' => 'png',
        'image/webp'  => 'webp',
    ];
    $ALLOWED_EXT = ['jpg' => 'jpg', 'jpeg' => 'jpg', 'png' => 'png', 'webp' => 'webp'];

    $handle_one_upload = function (array $file, string $dir, string $sku) use ($MAX_BYTES, $ALLOWED_MIME, $ALLOWED_EXT): ?string {
        $err = $file['error'] ?? UPLOAD_ERR_NO_FILE;
        if ($err === UPLOAD_ERR_NO_FILE) return null;
        if ($err !== UPLOAD_ERR_OK) throw new RuntimeException('Upload failed (code ' . $err . ').');

        if (($file['size'] ?? 0) > $MAX_BYTES) {
            $sizeMb = round(($file['size'] ?? 0) / (1024 * 1024), 1);
            throw new RuntimeException(
                'File "' . ($file['name'] ?? 'unknown') . '" is ' . $sizeMb . ' MB. Max 5 MB.'
            );
        }

        $tmp = $file['tmp_name'] ?? '';
        if (!is_uploaded_file($tmp)) throw new RuntimeException('Invalid upload.');

        $mime = @mime_content_type($tmp) ?: '';
        $ext = $ALLOWED_MIME[$mime] ?? null;
        if ($ext === null) {
            $name = (string) ($file['name'] ?? '');
            $checkExt = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            if (isset($ALLOWED_EXT[$checkExt])) $ext = $ALLOWED_EXT[$checkExt];
        }
        if ($ext === null) {
            $fname = $file['name'] ?? 'unknown';
            throw new RuntimeException(
                'File "' . $fname . '" was rejected. ' .
                'Detected type: ' . ($mime ?: 'unknown') . '. ' .
                'Allowed: JPG, JPEG, PNG, WebP.'
            );
        }

        $base = preg_replace('/[^a-zA-Z0-9-]/', '', $sku) ?: 'img';
        $name = $base . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
        $dest = rtrim($dir, '/') . '/' . $name;
        if (!move_uploaded_file($tmp, $dest)) throw new RuntimeException('Failed to save image.');
        return 'uploads/products/' . $name;
    };

    // ── DELETE ──
    if ($action === 'delete') {
        $id = (int) ($_POST['id'] ?? 0);
        if ($id <= 0) respond(false, 'Invalid product.', '', [], 400);
        $stmt = $pdo->prepare('SELECT file_path FROM product_images WHERE product_id = ?');
        $stmt->execute([$id]);
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $rel) {
            $abs = __DIR__ . '/../' . $rel;
            if (is_file($abs)) @unlink($abs);
        }
        $pdo->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
        respond(true, 'Product deleted.');
    }

    // ── CREATE / UPDATE ──
    $isEdit = ($action === 'update');
    $id     = $isEdit ? (int) ($_POST['id'] ?? 0) : 0;

    $brand     = trim((string) ($_POST['brand'] ?? ''));
    $model     = trim((string) ($_POST['model'] ?? ''));
    $category  = (string) ($_POST['category'] ?? '');
    $condG     = (string) ($_POST['condition_grade'] ?? '');
    $processor = trim((string) ($_POST['processor'] ?? ''));
    $cpu       = trim((string) ($_POST['cpu'] ?? ''));
    $ramGb     = ($_POST['ram_gb'] ?? '') !== '' ? (int) $_POST['ram_gb'] : null;
    $gpu       = trim((string) ($_POST['gpu'] ?? ''));
    $stVal     = ($_POST['storage_value'] ?? '') !== '' ? (int) $_POST['storage_value'] : null;
    $stType    = (string) ($_POST['storage_type'] ?? '');
    $screen    = trim((string) ($_POST['screen'] ?? ''));
    $resol     = trim((string) ($_POST['resolution'] ?? ''));
    $battery   = trim((string) ($_POST['battery'] ?? ''));
    $featText  = trim((string) ($_POST['features'] ?? ''));
    $price     = (string) ($_POST['price'] ?? '');
    $currency  = (string) ($_POST['currency'] ?? 'PKR');
    $stockQty  = (int) ($_POST['stock_qty'] ?? 0);
    $stockOn   = isset($_POST['stock_status']) && $_POST['stock_status'] === 'in_stock';
    $published = isset($_POST['published']) ? 1 : 0;
    $warranty  = trim((string) ($_POST['warranty'] ?? ''));

    // warranty fallback — never NULL
    $warrantyValue = $warranty !== '' ? $warranty : '30-day performance warranty';

    $removeIds  = array_map('intval', (array) ($_POST['remove_image_ids'] ?? []));
    $imageOrder = array_map('strval', (array) ($_POST['image_order'] ?? []));

    $errors = [];
    if ($brand === '' || mb_strlen($brand) > 60) $errors[] = 'Brand is required.';
    if ($model === '' || mb_strlen($model) > 120) $errors[] = 'Model is required.';
    if (!in_array($category, ['laptop','desktop','monitor'], true)) $errors[] = 'Category is invalid.';
    if (!in_array($condG, ['A','B','C','D'], true)) $errors[] = 'Condition is invalid.';
    if ($price === '' || !is_numeric($price) || (float) $price < 0) $errors[] = 'Price is required.';
    if (!in_array($currency, ['PKR','USD'], true)) $errors[] = 'Currency is invalid.';
    if ($stType !== '' && !in_array($stType, ['SSD','HDD','NVMe'], true)) $errors[] = 'Storage type is invalid.';

    if ($isEdit) {
        $stmt = $pdo->prepare('SELECT sku FROM products WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $sku = (string) ($stmt->fetchColumn() ?: suggest_sku($category, $brand));
    } else {
        $sku = suggest_sku($category, $brand);
    }

    $slug = unique_slug(slugify($brand . ' ' . $model), $isEdit ? $id : null);

    $features = [];
    if ($featText !== '') {
        foreach (preg_split('/\r?\n/', $featText) ?: [] as $line) {
            $line = trim($line);
            if ($line !== '') $features[] = $line;
        }
    }
    $featuresJson = $features ? json_encode($features, JSON_UNESCAPED_UNICODE) : null;

    if ($errors) {
        respond(false, 'Please fix the form.', implode(' · ', $errors), ['errors' => $errors], 422);
    }

    // Existing images
    $existingImages = [];
    if ($isEdit) {
        $stmt = $pdo->prepare('SELECT id, file_path, position FROM product_images WHERE product_id = ? ORDER BY position ASC, id ASC');
        $stmt->execute([$id]);
        $existingImages = $stmt->fetchAll();
    }

    if (!empty($removeIds) && $isEdit) {
        $in  = implode(',', array_fill(0, count($removeIds), '?'));
        $del = $pdo->prepare("SELECT id, file_path FROM product_images WHERE product_id = ? AND id IN ($in)");
        $del->execute(array_merge([$id], $removeIds));
        foreach ($del->fetchAll() as $row) {
            $pdo->prepare('DELETE FROM product_images WHERE id = ?')->execute([$row['id']]);
            $abs = __DIR__ . '/../' . $row['file_path'];
            if (is_file($abs)) @unlink($abs);
        }
        $stmt = $pdo->prepare('SELECT id, file_path, position FROM product_images WHERE product_id = ? ORDER BY position ASC, id ASC');
        $stmt->execute([$id]);
        $existingImages = $stmt->fetchAll();
    }

    // New uploads
    $uploadedPaths = [];
    $uploadedSlot  = [];
    try {
        for ($slot = 0; $slot < $MAX_IMAGES; $slot++) {
            if (!isset($_FILES['images']['name'][$slot])) continue;
            $file = [
                'name'     => $_FILES['images']['name'][$slot],
                'type'     => $_FILES['images']['type'][$slot] ?? '',
                'tmp_name' => $_FILES['images']['tmp_name'][$slot] ?? '',
                'error'    => $_FILES['images']['error'][$slot] ?? UPLOAD_ERR_NO_FILE,
                'size'     => $_FILES['images']['size'][$slot] ?? 0,
            ];
            $path = $handle_one_upload($file, $uploadDir, $sku);
            if ($path !== null) {
                $uploadedSlot[$slot] = $path;
                $uploadedPaths[]     = $path;
            }
        }
    } catch (Throwable $e) {
        foreach ($uploadedPaths as $rel) { $abs = __DIR__ . '/../' . $rel; if (is_file($abs)) @unlink($abs); }
        respond(false, 'Image upload failed.', $e->getMessage(), [], 422);
    }

    $totalImages = count($existingImages) + count($uploadedPaths);
    if ($totalImages < 1) {
        foreach ($uploadedPaths as $rel) { $abs = __DIR__ . '/../' . $rel; if (is_file($abs)) @unlink($abs); }
        respond(false, 'At least one image is required.', 'Add a photo in the Images section.', [], 422);
    }
    if ($totalImages > $MAX_IMAGES) {
        foreach ($uploadedPaths as $rel) { $abs = __DIR__ . '/../' . $rel; if (is_file($abs)) @unlink($abs); }
        respond(false, 'Too many images.', 'Maximum 3 images per product.', [], 422);
    }

    if ($isEdit) {
        $stmt = $pdo->prepare(
            'UPDATE products SET
                slug=?, category=?, brand=?, model=?, condition_grade=?,
                processor=?, cpu=?, ram_gb=?, storage_value=?, storage_type=?, gpu=?,
                screen=?, resolution=?, features=?,
                price=?, currency=?, stock_qty=?, stock_status=?,
                warranty=?, battery=?, published=?
              WHERE id=?'
        );
        $stmt->execute([
            $slug, $category, $brand, $model, $condG,
            $processor ?: null, $cpu ?: null, $ramGb, $stVal, $stType ?: null, $gpu ?: null,
            $screen ?: null, $resol ?: null, $featuresJson,
            $price, $currency, $stockQty, $stockOn ? 'in_stock' : 'out_of_stock',
            $warrantyValue, $battery ?: null, $published, $id
        ]);
        $productId = $id;
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO products
                (sku, slug, category, brand, model, condition_grade,
                 processor, cpu, ram_gb, storage_value, storage_type, gpu,
                 screen, resolution, features,
                 price, currency, stock_qty, stock_status, warranty, battery, published)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        );
        $stmt->execute([
            $sku, $slug, $category, $brand, $model, $condG,
            $processor ?: null, $cpu ?: null, $ramGb, $stVal, $stType ?: null, $gpu ?: null,
            $screen ?: null, $resol ?: null, $featuresJson,
            $price, $currency, $stockQty, $stockOn ? 'in_stock' : 'out_of_stock',
            $warrantyValue, $battery ?: null, $published
        ]);
        $productId = (int) $pdo->lastInsertId();
    }

    // Insert new uploads with temp positions above 900
    $newImageIds = [];
    foreach ($uploadedSlot as $slotIdx => $rel) {
        $pdo->prepare('INSERT INTO product_images (product_id, file_path, position) VALUES (?,?,?)')
            ->execute([$productId, $rel, 900 + $slotIdx]);
        $newImageIds[$slotIdx] = (int) $pdo->lastInsertId();
    }

    // Token map for reorder
    $idByToken = [];
    foreach ($existingImages as $r) {
        $idByToken['e:' . (int) $r['id']] = (int) $r['id'];
    }
    foreach ($newImageIds as $slotIdx => $imgId) {
        $idByToken['n:' . $slotIdx] = $imgId;
    }

    // Build ordered list from tokens
    $orderedIds = [];
    foreach ($imageOrder as $tok) {
        if (isset($idByToken[$tok])) $orderedIds[] = $idByToken[$tok];
    }
    foreach ($idByToken as $imgId) {
        if (!in_array($imgId, $orderedIds, true)) $orderedIds[] = $imgId;
    }

    // Renumber positions 0..N-1
    foreach ($orderedIds as $pos => $imgId) {
        $pdo->prepare('UPDATE product_images SET position = ? WHERE id = ?')->execute([$pos, $imgId]);
    }

    respond(
        true,
        $isEdit ? 'Product updated successfully.' : 'Product created successfully.',
        $brand . ' ' . $model . ' · ' . $sku
    );

} catch (Throwable $e) {
    while (ob_get_level() > 0) ob_end_clean();
    respond(false, 'Unexpected error.', $e->getMessage(), [], 500);
}