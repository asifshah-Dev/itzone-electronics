<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/helpers.php';
auth_start();
auth_require();

$user = auth_user();
$pdo  = db();

$categoryFilter = trim((string) ($_GET['category'] ?? ''));
$search         = trim((string) ($_GET['q'] ?? ''));
$filter         = trim((string) ($_GET['filter'] ?? ''));

$sql    = 'SELECT id, sku, slug, category, brand, model, condition_grade, price, currency,
                  stock_qty, stock_status, published, created_at
             FROM products
            WHERE 1=1';
$params = [];

if ($categoryFilter !== '' && in_array($categoryFilter, ['laptop','desktop','monitor'], true)) {
    $sql .= ' AND category = ?';
    $params[] = $categoryFilter;
}
if ($search !== '') {
    $sql .= ' AND (brand LIKE ? OR model LIKE ? OR sku LIKE ?)';
    $like = '%' . $search . '%';
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
}
if ($filter === 'in_stock') {
    $sql .= " AND stock_status = 'in_stock' AND published = 1";
} elseif ($filter === 'hidden') {
    $sql .= " AND published = 0";
}
$sql .= ' ORDER BY created_at DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

$flash        = flash_take();
$totalCount   = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
$inStockCount = (int) $pdo->query("SELECT COUNT(*) FROM products WHERE stock_status = 'in_stock' AND published = 1")->fetchColumn();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<meta name="robots" content="noindex,nofollow">
<title>Products — IT Zone Electronics Admin</title>
<link rel="stylesheet" href="../assets/css/main.css">
<style>
:root {
  --sb-bg:#fff; --sb-bg-2:#f1f7e8; --sb-text:#1f2937; --sb-muted:#64748b;
  --sb-active:#8dc63f; --sb-accent:#4a7a1e; --sb-on-active:#0a0f0d;
  --sb-hover:rgba(141,198,63,0.16); --sb-border:#e2e8f0; --content-bg:#f7faf8;
  --green:#8dc63f; --green-dark:#6faa2e; --green-ink:#4a7a1e; --red:#ed1c24;
  --ink:#0a0f0d; --muted:#64748b; --line:#e2e8f0;
  --sb-w:260px;
  --sb-w-collapsed:76px;
}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;max-width:100%;font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-text-size-adjust:100%}

.shell{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr);height:100vh;height:100dvh;overflow:hidden;background:var(--content-bg);transition:grid-template-columns 200ms ease}
@media(min-width:992px){
  .shell{grid-template-columns:var(--sb-w) minmax(0,1fr)}
  .shell.is-collapsed{grid-template-columns:var(--sb-w-collapsed) minmax(0,1fr)}
}

/* Sidebar */
.sb{
  background:linear-gradient(180deg,var(--sb-bg) 0%,var(--sb-bg-2) 100%);
  border-right:1px solid var(--sb-border);color:var(--sb-text);
  display:flex;flex-direction:column;
  padding:max(1.25rem,env(safe-area-inset-top,0px)) .9rem max(1.25rem,env(safe-area-inset-bottom,0px));
  position:fixed;top:0;bottom:0;left:0;width:280px;max-width:82vw;z-index:50;
  transform:translateX(-100%);transition:transform 220ms cubic-bezier(0.22,1,0.36,1),width 200ms ease;
  overflow-y:auto;
}
.sb.is-open{transform:translateX(0);box-shadow:0 30px 60px -10px rgba(10,15,13,.35)}
@media(min-width:992px){
  .sb{position:relative;height:100%;width:auto;max-width:none;transform:none;box-shadow:none;overflow-y:auto}
  .shell.is-collapsed .sb{padding-left:.5rem;padding-right:.5rem}
}
.sb-logo{
  display:flex;align-items:center;justify-content:center;
  padding:1rem .5rem 1.5rem;border-bottom:1px solid var(--sb-border);margin-bottom:1rem;
  text-decoration:none;
}
.sb-logo img{
  height:96px;width:auto;max-width:100%;object-fit:contain;
  transition:height 200ms ease;
}
@media(min-width:992px){
  .shell.is-collapsed .sb-logo{padding:.5rem 0 1rem}
  .shell.is-collapsed .sb-logo img{height:40px}
}
@media(max-width:991.98px){ .sb-logo img{height:110px} }

.sb-section{
  font-size:.65rem;text-transform:uppercase;letter-spacing:.14em;
  color:var(--sb-muted);padding:.5rem .75rem;margin-top:.75rem;
  white-space:nowrap;overflow:hidden;
}
@media(min-width:992px){
  .shell.is-collapsed .sb-section{opacity:0;pointer-events:none;height:0;padding:0;margin:0}
}

.sb-nav{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px}
.sb-nav a{
  display:flex;align-items:center;gap:.75rem;
  padding:.7rem .75rem;border-radius:10px;
  color:var(--sb-text);text-decoration:none;font-size:.9rem;font-weight:500;
  transition:background 120ms ease,color 120ms ease;
  white-space:nowrap;overflow:hidden;
}
.sb-nav a:hover{background:var(--sb-hover);color:var(--ink)}
.sb-nav a[aria-current="page"]{background:var(--sb-active);color:var(--sb-on-active);font-weight:600}
.sb-nav a[aria-current="page"] svg,.sb-nav a[aria-current="page"] svg *{color:var(--sb-on-active)!important;stroke:var(--sb-on-active)!important}
.sb-nav svg{width:18px;height:18px;flex:0 0 auto;stroke:currentColor}
.sb-nav a span{transition:opacity 160ms ease}
@media(min-width:992px){
  .shell.is-collapsed .sb-nav a{justify-content:center;padding:.7rem .5rem}
  .shell.is-collapsed .sb-nav a span{display:none}
}

.sb-overlay{position:fixed;inset:0;background:rgba(10,15,13,.55);z-index:40;opacity:0;pointer-events:none;transition:opacity 200ms ease}
.sb-overlay.is-open{opacity:1;pointer-events:auto}
@media(min-width:992px){.sb-overlay{display:none}}

/* Main */
.main{display:flex;flex-direction:column;min-width:0;min-height:0;height:100%}
.topbar{
  flex:none;z-index:30;
  display:flex;align-items:center;gap:.75rem;
  padding:.6rem 1.25rem;padding-top:max(.6rem,env(safe-area-inset-top,0px));
  background:rgba(247,250,248,.9);
  backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);
  border-bottom:1px solid rgba(10,15,13,.06);min-height:60px;
}
.topbar>div:not(.topbar-right){min-width:0}
.topbar-toggle{
  display:inline-flex;align-items:center;justify-content:center;
  width:40px;height:40px;border-radius:10px;
  background:transparent;border:1px solid rgba(10,15,13,.1);
  color:var(--ink);cursor:pointer;flex:0 0 auto;transition:background 120ms ease;
}
.topbar-toggle:hover{background:rgba(10,15,13,.05)}
.topbar-toggle svg{width:20px;height:20px;color:currentColor}

.topbar-brand{display:flex;align-items:center;gap:.6rem;min-width:0}
.topbar-brand-title{
  font-size:1.05rem;font-weight:700;letter-spacing:-.01em;color:var(--ink);
  margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.topbar-badge{
  display:inline-flex;align-items:center;gap:.25rem;
  background:var(--green);color:var(--ink);
  padding:.2rem .55rem;border-radius:999px;
  font-size:.7rem;font-weight:700;letter-spacing:.02em;
  text-transform:uppercase;
  box-shadow:0 2px 6px -2px rgba(141,198,63,.5);
  white-space:nowrap;flex:0 0 auto;
}
.topbar-badge svg{width:11px;height:11px;color:var(--ink)}
.topbar-right{margin-left:auto;display:flex;align-items:center;gap:.6rem}

.btn-logout{
  display:inline-flex;align-items:center;justify-content:center;gap:.45rem;
  background:var(--red);color:#fff;
  padding:.55rem 1rem;border-radius:10px;
  font-weight:600;font-size:.85rem;border:0;cursor:pointer;
  text-decoration:none;
  transition:background 120ms ease,transform 80ms ease;
  box-shadow:0 4px 12px -4px rgba(237,28,36,.55);
  min-height:40px;white-space:nowrap;
}
.btn-logout:hover{background:#ff2b34;color:#fff}
.btn-logout:active{transform:translateY(1px)}
.btn-logout svg{width:15px;height:15px;color:#fff}
@media(max-width:640px){
  .btn-logout .btn-label{display:none}
  .btn-logout{padding:.55rem;width:40px;height:40px}
}

.content{
  flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;
  padding:1.5rem 1.25rem 3rem;
  width:100%;
  max-width:1240px;
  margin-inline:0 auto;
}
@media(min-width:768px){.content{padding:2rem 2rem 4rem}}
@media(min-width:1200px){.content{padding:2.5rem 2.5rem 4rem}}

.btn-primary{display:inline-flex;align-items:center;gap:.5rem;background:var(--green);color:var(--ink);padding:.7rem 1.15rem;border-radius:10px;font-weight:600;font-size:.9rem;border:0;cursor:pointer;text-decoration:none;transition:background 120ms ease,transform 80ms ease;box-shadow:0 4px 12px -4px rgba(141,198,63,.5);white-space:nowrap}
.btn-primary:hover{background:#9bd44c;color:var(--ink);text-decoration:none}
.btn-primary:active{transform:translateY(1px)}
.btn-primary svg{width:16px;height:16px;color:currentColor}
.btn-ghost{display:inline-flex;align-items:center;gap:.4rem;background:#fff;color:var(--sb-text);padding:.5rem .75rem;border-radius:8px;font-weight:500;font-size:.82rem;border:1px solid var(--line);cursor:pointer;text-decoration:none;transition:background 120ms ease,border-color 120ms ease,color 120ms ease}
.btn-ghost:hover{background:#f1f5f9;color:var(--ink);text-decoration:none}
.btn-ghost svg{width:14px;height:14px}
.btn-ghost.is-danger{color:#b3151b;border-color:#f7c6c8}
.btn-ghost.is-danger:hover{background:#fdecec;border-color:#f5a3a8;color:#7a0e13}

.toolbar{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-bottom:1rem}
.toolbar .field-inline{display:inline-flex;align-items:center;gap:.4rem;background:#fff;border:1px solid var(--line);border-radius:10px;padding:.35rem .65rem;font-size:.85rem}
.toolbar .field-inline svg{width:14px;height:14px;color:var(--muted)}
.toolbar input[type="text"],.toolbar select{border:0;outline:0;background:transparent;padding:.35rem 0;font-family:inherit;font-size:.85rem;color:var(--ink);min-width:0}
.toolbar input[type="text"]{width:220px;max-width:100%}
.toolbar select{cursor:pointer;padding-right:.75rem}
.toolbar button[type="submit"]{background:var(--green);color:var(--ink);border:0;padding:.5rem .9rem;border-radius:8px;font-weight:600;font-size:.82rem;cursor:pointer}
.toolbar a.clear{font-size:.8rem;color:var(--muted);margin-left:.25rem}

.flash{padding:.75rem 1rem;border-radius:10px;font-size:.88rem;margin-bottom:1rem;display:flex;align-items:flex-start;gap:.5rem}
.flash--success{background:#eef7e0;border:1px solid #a3d956;color:#4a7a1e}
.flash--danger{background:#fdecec;border:1px solid #f7c6c8;color:#b3151b}
.flash svg{flex:0 0 auto;margin-top:1px}

.card{background:#fff;border:1px solid rgba(10,15,13,.06);border-radius:16px;box-shadow:0 1px 2px rgba(10,15,13,.04);overflow:hidden}
.card-head{padding:1.15rem 1.35rem;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;justify-content:space-between}
.card-head h2{font-size:1rem;font-weight:600;margin:0;color:var(--ink)}
.card-head .meta{font-size:.8rem;color:var(--muted)}

.table-wrap{overflow-x:auto}
.table{width:100%;border-collapse:collapse;font-size:.875rem;min-width:720px}
.table th,.table td{text-align:left;padding:.75rem 1rem;border-bottom:1px solid var(--line);vertical-align:middle}
.table th{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:600;background:#f9fbf7}
.table tbody tr:hover{background:#fbfdf8}

.prod-cell{display:flex;align-items:center;gap:.75rem;min-width:0}
.thumb{width:40px;height:40px;border-radius:8px;flex:0 0 auto;background:#f1f5f9;border:1px solid var(--line);object-fit:cover;display:grid;place-items:center;color:var(--muted)}
.thumb svg{width:18px;height:18px}
.prod-name{display:flex;flex-direction:column;min-width:0}
.prod-name strong{font-weight:600;color:var(--ink);font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prod-name span{color:var(--muted);font-size:.75rem;font-family:var(--font-mono,ui-monospace,monospace)}
.price-cell{font-weight:600;color:var(--ink);white-space:nowrap}
.price-cell small{color:var(--muted);font-weight:400;margin-right:.25rem;font-size:.72rem}
.badge{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .55rem;border-radius:999px;font-size:.7rem;font-weight:600;letter-spacing:.02em;white-space:nowrap}
.badge--green{background:#eef7e0;color:#4a7a1e}
.badge--rose{background:#fdecec;color:#b3151b}
.badge--muted{background:#f1f5f9;color:var(--muted)}
.cond-letter{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:8px;background:#f1f5f9;color:var(--ink);font-weight:700;font-size:.8rem}
.cond-A{background:#eef7e0;color:#4a7a1e}
.cond-B{background:#e8f1fb;color:#1e5a99}
.cond-C{background:#fdf3df;color:#8a5608}
.cond-D{background:#fdecec;color:#b3151b}
.row-actions{display:flex;gap:.4rem;justify-content:flex-end;flex-wrap:wrap}
.row-actions form{margin:0;display:inline}

.empty{padding:3rem 1.5rem;text-align:center;color:var(--muted)}
.empty svg{width:48px;height:48px;color:#cbd5e1;margin-bottom:.75rem}
.empty h3{font-size:1rem;margin:0 0 .35rem;color:var(--ink);font-weight:600}
.empty p{margin:0 0 1.25rem;font-size:.88rem}

@media(max-width:767.98px){
  .content{padding:1rem .9rem 2.5rem}
  .topbar{padding-left:.9rem;padding-right:.9rem;gap:.5rem}
  .topbar-brand-title{font-size:.95rem}
  .topbar-badge{font-size:.62rem;padding:.15rem .5rem}
  .btn-primary{padding:.55rem .85rem;font-size:.82rem}
  .btn-primary .btn-label{display:none}
  .toolbar input[type="text"]{width:100%}
  .toolbar .field-inline{flex:1 1 100%}
}
@media(max-width:420px){
  .card-head{padding:1rem}
  .table{font-size:.82rem;min-width:640px}
  .table th,.table td{padding:.6rem .75rem}
}
@media(prefers-reduced-motion:reduce){
  .sb,.sb-overlay,.topbar-toggle,.btn-logout{transition:none!important}
}
</style>
</head>
<body>

<div class="shell" id="appShell">

  <div class="sb-overlay" data-sb-overlay></div>

  <aside class="sb" data-sb aria-label="Admin navigation">
    <a class="sb-logo" href="index.php" aria-label="IT Zone Electronics Admin">
      <img src="../assets/img/logo.png" alt="IT Zone Electronics">
    </a>

    <div class="sb-section">Workspace</div>
    <ul class="sb-nav">
      <li>
        <a href="index.php" title="Dashboard">
          <i data-lucide="layout-dashboard"></i>
          <span>Dashboard</span>
        </a>
      </li>
      <li>
        <a href="products.php" aria-current="page" title="Products">
          <i data-lucide="package"></i>
          <span>Products</span>
        </a>
      </li>
      <li>
        <a href="#" aria-disabled="true" style="opacity:.5;cursor:not-allowed" title="Orders (coming soon)">
          <i data-lucide="shopping-cart"></i>
          <span>Orders</span>
        </a>
      </li>
    </ul>
  </aside>

  <div class="main">
    <header class="topbar">
      <button type="button" class="topbar-toggle" data-sb-toggle aria-label="Toggle menu">
        <i data-lucide="menu"></i>
      </button>

      <div class="topbar-brand">
        <h1 class="topbar-brand-title">IT Zone Electronics</h1>
        <span class="topbar-badge">
          <i data-lucide="shield-check"></i>
          Admin
        </span>
      </div>

      <div class="topbar-right">
        <form method="post" action="logout.php" style="margin:0">
          <?= csrf_field() ?>
          <button class="btn-logout" type="submit" aria-label="Logout">
            <i data-lucide="log-out"></i>
            <span class="btn-label">Logout</span>
          </button>
        </form>
      </div>
    </header>

    <main class="content">
      <?php if ($flash): ?>
        <div class="flash flash--<?= $flash['type'] === 'success' ? 'success' : 'danger' ?>" role="status">
          <i data-lucide="<?= $flash['type'] === 'success' ? 'check-circle' : 'alert-circle' ?>" width="18" height="18"></i>
          <div><?= e($flash['message']) ?></div>
        </div>
      <?php endif; ?>

      <form method="get" class="toolbar">
        <label class="field-inline">
          <i data-lucide="search"></i>
          <input type="text" name="q" value="<?= e($search) ?>" placeholder="Search brand or model">
        </label>
        <label class="field-inline">
          <i data-lucide="filter"></i>
          <select name="category">
            <option value="">All categories</option>
            <option value="laptop"  <?= $categoryFilter === 'laptop'  ? 'selected' : '' ?>>Laptops</option>
            <option value="desktop" <?= $categoryFilter === 'desktop' ? 'selected' : '' ?>>Desktops</option>
            <option value="monitor" <?= $categoryFilter === 'monitor' ? 'selected' : '' ?>>Monitors</option>
          </select>
        </label>
        <?php if ($filter !== ''): ?>
          <input type="hidden" name="filter" value="<?= e($filter) ?>">
        <?php endif; ?>
        <button type="submit">Filter</button>
        <?php if ($search !== '' || $categoryFilter !== '' || $filter !== ''): ?>
          <a class="clear" href="products.php">Clear</a>
        <?php endif; ?>
      </form>

      <div class="card">
        <div class="card-head">
          <h2>All products</h2>
          <div style="display:flex;align-items:center;gap:.75rem">
            <span class="meta"><?= count($products) ?> shown</span>
            <a href="product-form.php" class="btn-primary">
              <i data-lucide="plus"></i><span class="btn-label">Add product</span>
            </a>
          </div>
        </div>

        <?php if (empty($products)): ?>
          <div class="empty">
            <i data-lucide="package-search"></i>
            <h3>No products yet</h3>
            <p>Add your first product to start building the catalog.</p>
            <a href="product-form.php" class="btn-primary" style="margin-top:.5rem">
              <i data-lucide="plus"></i><span>Add product</span>
            </a>
          </div>
        <?php else: ?>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Grade</th><th>Price</th>
                  <th>Stock</th><th>Status</th><th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($products as $p):
                  $imgPath = primary_image_path((int) $p['id']);
                  $catIcon = match ($p['category']) {
                    'laptop'  => 'laptop',
                    'desktop' => 'cpu',
                    'monitor' => 'monitor',
                    default   => 'package',
                  };
                ?>
                  <tr>
                    <td>
                      <div class="prod-cell">
                        <?php if ($imgPath): ?>
                          <img class="thumb" src="../<?= e($imgPath) ?>" alt="" loading="lazy">
                        <?php else: ?>
                          <span class="thumb"><i data-lucide="<?= $catIcon ?>"></i></span>
                        <?php endif; ?>
                        <div class="prod-name">
                          <strong><?= e($p['brand'] . ' ' . $p['model']) ?></strong>
                          <span><?= e(ucfirst($p['category'])) ?> · Grade <?= e($p['condition_grade']) ?></span>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge badge--muted" style="text-transform:capitalize"><?= e($p['category']) ?></span></td>
                    <td><span class="cond-letter cond-<?= e($p['condition_grade']) ?>"><?= e($p['condition_grade']) ?></span></td>
                    <td class="price-cell"><small><?= e($p['currency']) ?></small><?= e(format_pkr($p['price'])) ?></td>
                    <td><?= (int) $p['stock_qty'] ?></td>
                    <td>
                      <?php if (!$p['published']): ?>
                        <span class="badge badge--muted"><i data-lucide="eye-off" width="12" height="12"></i> Hidden</span>
                      <?php elseif ($p['stock_status'] === 'in_stock'): ?>
                        <span class="badge badge--green"><i data-lucide="check" width="12" height="12"></i> In stock</span>
                      <?php else: ?>
                        <span class="badge badge--rose"><i data-lucide="x" width="12" height="12"></i> Out of stock</span>
                      <?php endif; ?>
                    </td>
                    <td>
                      <div class="row-actions">
                        <a class="btn-ghost" href="product-form.php?id=<?= (int) $p['id'] ?>">
                          <i data-lucide="pencil"></i> Edit
                        </a>
                        <form method="post" action="product-handler.php"
                              onsubmit="return confirm('Delete <?= e(addslashes($p['brand'] . ' ' . $p['model'])) ?>?');">
                          <?= csrf_field() ?>
                          <input type="hidden" name="action" value="delete">
                          <input type="hidden" name="id" value="<?= (int) $p['id'] ?>">
                          <button type="submit" class="btn-ghost is-danger">
                            <i data-lucide="trash-2"></i> Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        <?php endif; ?>
      </div>
    </main>
  </div>
</div>

<script src="../assets/js/vendors/lucide.min.js"></script>
<script>
(function () {
  'use strict';

  function renderLucide() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }
  renderLucide();

  var shell   = document.getElementById('appShell');
  var sb      = document.querySelector('[data-sb]');
  var overlay = document.querySelector('[data-sb-overlay]');
  var toggle  = document.querySelector('[data-sb-toggle]');

  var desktopMQ = window.matchMedia('(min-width: 992px)');
  var COLLAPSE_KEY = 'itz.admin.sb.collapsed';

  function isCollapsed() { return shell.classList.contains('is-collapsed'); }
  function setCollapsed(v) {
    if (!desktopMQ.matches) return;
    shell.classList.toggle('is-collapsed', !!v);
    try { localStorage.setItem(COLLAPSE_KEY, v ? '1' : '0'); } catch (e) {}
  }
  function openDrawer() {
    sb && sb.classList.add('is-open');
    overlay && overlay.classList.add('is-open');
  }
  function closeDrawer() {
    sb && sb.classList.remove('is-open');
    overlay && overlay.classList.remove('is-open');
  }

  if (desktopMQ.matches) {
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === '1') shell.classList.add('is-collapsed');
    } catch (e) {}
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      if (desktopMQ.matches) setCollapsed(!isCollapsed());
      else if (sb && sb.classList.contains('is-open')) closeDrawer();
      else openDrawer();
    });
  }
  if (overlay) overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

  function handleMQChange() {
    if (desktopMQ.matches) closeDrawer();
    else shell.classList.remove('is-collapsed');
  }
  if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', handleMQChange);
  else if (desktopMQ.addListener) desktopMQ.addListener(handleMQChange);
})();
</script>
</body>
</html>