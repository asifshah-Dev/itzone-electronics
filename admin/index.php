<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/helpers.php';
auth_start();
auth_require();

$user = auth_user();
$pdo  = db();

// Real counts for the stat cards
$totalProducts   = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
$inStockProducts = (int) $pdo->query("SELECT COUNT(*) FROM products WHERE stock_status = 'in_stock' AND published = 1")->fetchColumn();
$hiddenProducts  = (int) $pdo->query("SELECT COUNT(*) FROM products WHERE published = 0")->fetchColumn();
$categoryCount   = (int) $pdo->query("SELECT COUNT(DISTINCT category) FROM products WHERE published = 1")->fetchColumn();

// Last login timestamp for this admin
$stmt = $pdo->prepare('SELECT last_login_at FROM admins WHERE id = ? LIMIT 1');
$stmt->execute([(int) $user['id']]);
$lastLogin = (string) ($stmt->fetchColumn() ?: '');

// Recent products (last 5) for the "recent" card later
$recent = $pdo->query(
    'SELECT id, brand, model, sku, price, currency, stock_status, published, created_at
       FROM products
   ORDER BY created_at DESC
      LIMIT 5'
)->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<meta name="robots" content="noindex,nofollow">
<title>Dashboard — IT Zone Electronics Admin</title>
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

.topbar-brand{
  display:flex;align-items:center;gap:.6rem;min-width:0;
}
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
  white-space:nowrap;
  flex:0 0 auto;
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

/* Content */
.content{
  flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;
  padding:1.5rem 1.25rem 3rem;
  width:100%;
  max-width:1240px;
  margin-inline:0 auto;   /* left-aligned, auto only on the right */
}
@media(min-width:768px){.content{padding:2rem 2rem 4rem}}
@media(min-width:1200px){.content{padding:2.5rem 2.5rem 4rem}}

/* Stat cards — clickable */
.stats{display:grid;gap:1rem;grid-template-columns:repeat(2,minmax(0,1fr))}
@media(min-width:1100px){.stats{grid-template-columns:repeat(4,minmax(0,1fr))}}

.stat{
  --tint-bg:#ffffff;
  --tint-border:rgba(10,15,13,.06);
  --tint-dot:rgba(141,198,63,.12);
  --tint-ink:#4a7a1e;
  background:var(--tint-bg);
  border:1px solid var(--tint-border);
  border-radius:14px;
  padding:1.1rem 1.25rem;
  display:flex;flex-direction:column;gap:.4rem;
  text-decoration:none;color:inherit;
  position:relative;
  transition:transform 140ms ease,box-shadow 140ms ease,border-color 140ms ease;
}
a.stat{cursor:pointer}
a.stat:hover{
  transform:translateY(-2px);
  box-shadow:0 12px 24px -12px rgba(10,15,13,.18),0 4px 8px -4px rgba(10,15,13,.08);
  text-decoration:none;
  border-color:var(--tint-dot);
}
a.stat:focus-visible{outline:3px solid rgba(141,198,63,.4);outline-offset:3px}
.stat__arrow{
  position:absolute;top:.8rem;right:.8rem;
  opacity:0;transition:opacity 140ms ease,transform 140ms ease;
  color:var(--tint-ink);
}
.stat__arrow svg{width:14px;height:14px;color:var(--tint-ink)}
a.stat:hover .stat__arrow{opacity:1;transform:translate(2px,-2px)}

.stat--green{--tint-bg:#eef7e0;--tint-border:#d3ebab;--tint-dot:#d9efb5;--tint-ink:#4a7a1e}
.stat--blue {--tint-bg:#e8f1fb;--tint-border:#c7dcf3;--tint-dot:#cfe2f7;--tint-ink:#1e5a99}
.stat--amber{--tint-bg:#fdf3df;--tint-border:#f6e0a8;--tint-dot:#f8e6b4;--tint-ink:#8a5608}
.stat--rose {--tint-bg:#fdecec;--tint-border:#f7c6c8;--tint-dot:#f9d0d2;--tint-ink:#b3151b}

.stat-head{
  display:flex;align-items:center;justify-content:space-between;
  color:var(--tint-ink);
  font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;font-weight:600;
}
.stat-head .dot{
  width:32px;height:32px;border-radius:10px;
  display:grid;place-items:center;
  background:var(--tint-dot);color:var(--tint-ink);
}
.stat-head .dot svg{width:16px;height:16px;color:var(--tint-ink)}
.stat-value{font-size:1.65rem;font-weight:700;letter-spacing:-.02em;color:var(--ink);line-height:1}
.stat-meta{font-size:.75rem;color:#5b6b7e;overflow-wrap:anywhere}
.stat-value--sm{font-size:1.15rem}

/* Recent products */
.panel{background:#fff;border:1px solid rgba(10,15,13,.06);border-radius:16px;box-shadow:0 1px 2px rgba(10,15,13,.04);margin-top:1.5rem;overflow:hidden}
.panel-head{
  display:flex;align-items:center;justify-content:space-between;gap:.5rem;
  padding:1rem 1.35rem;border-bottom:1px solid var(--line);
}
.panel-head h2{margin:0;font-size:.95rem;font-weight:600;color:var(--ink);display:inline-flex;align-items:center;gap:.45rem}
.panel-head h2 svg{width:16px;height:16px;color:var(--green-dark)}
.panel-head a{font-size:.8rem;color:var(--green-ink);font-weight:600;text-decoration:none}
.panel-head a:hover{text-decoration:underline}

.recent-list{list-style:none;margin:0;padding:0}
.recent-item{display:flex;align-items:center;gap:.75rem;padding:.85rem 1.35rem;border-bottom:1px solid var(--line)}
.recent-item:last-child{border-bottom:0}
.recent-item:hover{background:#fbfdf8}
.recent-thumb{
  width:36px;height:36px;border-radius:8px;flex:0 0 auto;
  background:#f1f5f9;border:1px solid var(--line);
  display:grid;place-items:center;color:var(--muted);overflow:hidden;
}
.recent-thumb img{width:100%;height:100%;object-fit:cover}
.recent-thumb svg{width:16px;height:16px;color:var(--muted)}
.recent-info{min-width:0;flex:1}
.recent-info strong{display:block;color:var(--ink);font-size:.88rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.recent-info span{color:var(--muted);font-size:.75rem}
.recent-price{font-weight:600;color:var(--ink);font-size:.85rem;white-space:nowrap}
.recent-price small{color:var(--muted);font-weight:400;margin-right:.2rem;font-size:.7rem}
.recent-empty{padding:2.5rem 1.5rem;text-align:center;color:var(--muted);font-size:.88rem}
.recent-empty svg{width:40px;height:40px;color:#cbd5e1;margin-bottom:.5rem}
.recent-empty a{display:inline-flex;align-items:center;gap:.35rem;margin-top:.75rem;color:var(--green-ink);font-weight:600;font-size:.85rem;text-decoration:none}
.recent-empty a:hover{text-decoration:underline}

@media(max-width:767.98px){
  .topbar{padding-left:.9rem;padding-right:.9rem;gap:.5rem}
  .topbar-brand-title{font-size:.95rem}
  .topbar-badge{font-size:.62rem;padding:.15rem .5rem}
  .content{padding:1rem .9rem 2.5rem}
  .stats{gap:.65rem}
  .stat{padding:.8rem .85rem;gap:.3rem;border-radius:12px}
  .stat-head{font-size:.64rem;letter-spacing:.05em}
  .stat-head .dot{width:26px;height:26px;border-radius:8px}
  .stat-head .dot svg{width:14px;height:14px}
  .stat-value{font-size:1.35rem}
  .stat-value--sm{font-size:1rem}
  .stat-meta{font-size:.68rem;line-height:1.3}
}
@media(prefers-reduced-motion:reduce){
  .sb,.sb-overlay,.stat,a.stat,.topbar-toggle,.btn-logout{transition:none!important}
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
        <a href="index.php" aria-current="page" title="Dashboard">
          <i data-lucide="layout-dashboard"></i>
          <span>Dashboard</span>
        </a>
      </li>
      <li>
        <a href="products.php" title="Products">
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

      <div class="stats">

        <a class="stat stat--green" href="products.php" title="View all products">
          <span class="stat__arrow"><i data-lucide="arrow-up-right"></i></span>
          <div class="stat-head">
            <span>Products</span>
            <span class="dot"><i data-lucide="package"></i></span>
          </div>
          <div class="stat-value"><?= (int) $totalProducts ?></div>
          <div class="stat-meta"><?= $totalProducts === 0 ? 'No products yet' : 'Total in catalog' ?></div>
        </a>

        <a class="stat stat--blue" href="products.php?filter=in_stock" title="In-stock products">
          <span class="stat__arrow"><i data-lucide="arrow-up-right"></i></span>
          <div class="stat-head">
            <span>In stock</span>
            <span class="dot"><i data-lucide="check-circle"></i></span>
          </div>
          <div class="stat-value"><?= (int) $inStockProducts ?></div>
          <div class="stat-meta"><?= $hiddenProducts > 0 ? ($hiddenProducts . ' hidden') : 'Published products' ?></div>
        </a>

        <a class="stat stat--amber" href="products.php" title="Categories">
          <span class="stat__arrow"><i data-lucide="arrow-up-right"></i></span>
          <div class="stat-head">
            <span>Categories</span>
            <span class="dot"><i data-lucide="layers"></i></span>
          </div>
          <div class="stat-value"><?= (int) $categoryCount ?></div>
          <div class="stat-meta">Laptop · Desktop · Monitor</div>
        </a>

        <a class="stat stat--rose" href="#" onclick="return false" title="Session info">
          <div class="stat-head">
            <span>Last login</span>
            <span class="dot"><i data-lucide="clock"></i></span>
          </div>
          <div class="stat-value stat-value--sm">
            <?php if ($lastLogin): ?>
              <?= e(date('d M', strtotime($lastLogin))) ?>
            <?php else: ?>
              Just now
            <?php endif; ?>
          </div>
          <div class="stat-meta">
            <?= $lastLogin ? e(date('H:i', strtotime($lastLogin))) : 'Session active' ?>
          </div>
        </a>

      </div>

      <section class="panel">
        <div class="panel-head">
          <h2><i data-lucide="clock"></i> Recent products</h2>
          <a href="products.php">View all →</a>
        </div>

        <?php if (empty($recent)): ?>
          <div class="recent-empty">
            <i data-lucide="package-search"></i>
            <div>No products yet.</div>
            <a href="product-form.php">
              <i data-lucide="plus"></i> Add your first product
            </a>
          </div>
        <?php else: ?>
          <ul class="recent-list">
            <?php foreach ($recent as $p): ?>
              <li class="recent-item">
                <div class="recent-thumb">
                  <?php
                    // Try to fetch primary image path for this product
                    $imgPath = primary_image_path((int) $p['id']);
                  ?>
                  <?php if ($imgPath): ?>
                    <img src="../<?= e($imgPath) ?>" alt="">
                  <?php else: ?>
                    <i data-lucide="package"></i>
                  <?php endif; ?>
                </div>
                <div class="recent-info">
                  <strong><?= e($p['brand'] . ' ' . $p['model']) ?></strong>
                  <span><?= e($p['sku']) ?> · <?= e(date('d M Y', strtotime($p['created_at']))) ?></span>
                </div>
                <div class="recent-price">
                  <small><?= e($p['currency']) ?></small><?= e(format_pkr($p['price'])) ?>
                </div>
              </li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>
      </section>

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

  function isCollapsed() {
    return shell.classList.contains('is-collapsed');
  }
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

  // Restore collapsed state on desktop
  if (desktopMQ.matches) {
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === '1') {
        shell.classList.add('is-collapsed');
      }
    } catch (e) {}
  }

  // Toggle: on desktop => collapse; on mobile => drawer
  if (toggle) {
    toggle.addEventListener('click', function () {
      if (desktopMQ.matches) {
        setCollapsed(!isCollapsed());
      } else {
        if (sb && sb.classList.contains('is-open')) closeDrawer();
        else openDrawer();
      }
    });
  }

  if (overlay) overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  // On viewport change, clear drawer state
  function handleMQChange() {
    if (desktopMQ.matches) {
      closeDrawer();
    } else {
      shell.classList.remove('is-collapsed');
    }
  }
  if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', handleMQChange);
  else if (desktopMQ.addListener) desktopMQ.addListener(handleMQChange);
})();
</script>
</body>
</html>