<?php
declare(strict_types=1);

/**
 * Small helpers used across admin pages.
 */

require_once __DIR__ . '/../config/db.php';

function slugify(string $text): string
{
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
    $text = trim($text, '-');
    $text = preg_replace('/-+/', '-', $text) ?? '';
    if ($text === '') {
        $text = 'item';
    }
    return substr($text, 0, 150);
}

function unique_slug(string $base, ?int $ignoreId = null): string
{
    $pdo  = db();
    $base = slugify($base);
    $slug = $base;
    $n    = 2;

    while (true) {
        if ($ignoreId === null) {
            $stmt = $pdo->prepare('SELECT 1 FROM products WHERE slug = ? LIMIT 1');
            $stmt->execute([$slug]);
        } else {
            $stmt = $pdo->prepare('SELECT 1 FROM products WHERE slug = ? AND id != ? LIMIT 1');
            $stmt->execute([$slug, $ignoreId]);
        }
        if (!$stmt->fetchColumn()) {
            return $slug;
        }
        $slug = $base . '-' . $n;
        $n++;
    }
}

function suggest_sku(string $category, string $brand = ''): string
{
    $pdo = db();
    $prefix = match (strtolower($category)) {
        'laptop'  => 'LAP',
        'desktop' => 'PC',
        'monitor' => 'MON',
        default   => 'ITM',
    };

    $stmt = $pdo->prepare('SELECT sku FROM products WHERE sku LIKE ?');
    $stmt->execute([$prefix . '-%']);
    $existing = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $max = 0;
    foreach ($existing as $sku) {
        if (preg_match('/^' . $prefix . '-(\d{4,})$/', $sku, $m)) {
            $max = max($max, (int) $m[1]);
        }
    }
    return sprintf('%s-%04d', $prefix, $max + 1);
}

function format_pkr(float|int|string|null $value): string
{
    if ($value === null || $value === '') {
        return '—';
    }
    return number_format((float) $value);
}

function sku_exists(string $sku, ?int $ignoreId = null): bool
{
    $pdo = db();
    if ($ignoreId === null) {
        $stmt = $pdo->prepare('SELECT 1 FROM products WHERE sku = ? LIMIT 1');
        $stmt->execute([$sku]);
    } else {
        $stmt = $pdo->prepare('SELECT 1 FROM products WHERE sku = ? AND id != ? LIMIT 1');
        $stmt->execute([$sku, $ignoreId]);
    }
    return (bool) $stmt->fetchColumn();
}

function primary_image_path(int $productId): ?string
{
    $pdo = db();
    $stmt = $pdo->prepare(
        'SELECT file_path FROM product_images
          WHERE product_id = ?
       ORDER BY position ASC, id ASC
          LIMIT 1'
    );
    $stmt->execute([$productId]);
    $path = $stmt->fetchColumn();
    return $path !== false ? (string) $path : null;
}

function flash_set(string $type, string $message): void
{
    auth_start();
    $_SESSION['_flash'] = ['type' => $type, 'message' => $message];
}

function flash_take(): ?array
{
    auth_start();
    if (empty($_SESSION['_flash'])) {
        return null;
    }
    $flash = $_SESSION['_flash'];
    unset($_SESSION['_flash']);
    return is_array($flash) ? $flash : null;
}