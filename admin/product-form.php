<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/helpers.php';
auth_start();
auth_require();

$pdo  = db();
$user = auth_user();

$id     = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$isEdit = $id > 0;
$product = null;
$images  = [];

if ($isEdit) {
    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    if (!$product) {
        flash_set('danger', 'Product not found.');
        header('Location: products.php');
        exit;
    }
    $stmt = $pdo->prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY position ASC, id ASC');
    $stmt->execute([$id]);
    $images = $stmt->fetchAll();
}

$defaults = [
    'sku' => '', 'category' => 'laptop', 'brand' => '', 'model' => '',
    'condition_grade' => 'A', 'processor' => '', 'cpu' => '', 'ram_gb' => '',
    'storage_value' => '', 'storage_type' => 'SSD', 'gpu' => '', 'screen' => '',
    'resolution' => '', 'features' => '', 'price' => '', 'currency' => 'PKR',
    'stock_qty' => '1', 'stock_status' => 'in_stock',
    'warranty' => '30-day performance warranty', 'battery' => '',
    'published' => '1',
];
$v = $product ?? $defaults;

$featuresText = '';
if (!empty($v['features'])) {
    $decoded = json_decode((string) $v['features'], true);
    if (is_array($decoded)) $featuresText = implode("\n", $decoded);
}

$imageByPos = [];
foreach ($images as $img) $imageByPos[(int) $img['position']] = $img;

$pageTitle = $isEdit ? 'Edit product' : 'Add product';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<meta name="robots" content="noindex,nofollow">
<title><?= e($pageTitle) ?> — IT Zone Electronics Admin</title>
<link rel="stylesheet" href="../assets/css/main.css">
<style>
:root {
  --sb-bg:#fff; --sb-bg-2:#f1f7e8; --sb-text:#1f2937; --sb-muted:#64748b;
  --sb-active:#8dc63f; --sb-accent:#4a7a1e; --sb-on-active:#0a0f0d;
  --sb-hover:rgba(141,198,63,0.16); --sb-border:#e2e8f0; --content-bg:#f7faf8;
  --green:#8dc63f; --green-dark:#6faa2e; --green-ink:#4a7a1e; --red:#ed1c24;
  --ink:#0a0f0d; --muted:#64748b; --line:#e2e8f0;
}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;max-width:100%;font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-text-size-adjust:100%}

.shell{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr);height:100vh;height:100dvh;overflow:hidden;background:var(--content-bg)}
@media(min-width:992px){.shell{grid-template-columns:260px minmax(0,1fr)}}

.sb{background:linear-gradient(180deg,var(--sb-bg) 0%,var(--sb-bg-2) 100%);border-right:1px solid var(--sb-border);color:var(--sb-text);display:flex;flex-direction:column;padding:max(1.25rem,env(safe-area-inset-top,0px)) .9rem max(1.25rem,env(safe-area-inset-bottom,0px));position:fixed;top:0;bottom:0;left:0;width:280px;max-width:82vw;z-index:50;transform:translateX(-100%);transition:transform 220ms cubic-bezier(0.22,1,0.36,1);overflow-y:auto}
.sb.is-open{transform:translateX(0);box-shadow:0 30px 60px -10px rgba(10,15,13,.35)}
@media(min-width:992px){.sb{position:relative;height:100%;width:auto;max-width:none;transform:none;box-shadow:none}}
.sb-brand{display:flex;align-items:center;gap:.75rem;padding:.5rem .75rem 1.25rem;border-bottom:1px solid var(--sb-border);margin-bottom:1rem;text-decoration:none;color:var(--sb-text)}
.sb-brand img{height:36px;width:auto}
.sb-brand-text{display:flex;flex-direction:column;line-height:1.1}
.sb-brand-text strong{font-size:.95rem;font-weight:700;letter-spacing:-.01em}
.sb-brand-text span{font-size:.65rem;text-transform:uppercase;letter-spacing:.14em;color:var(--sb-accent);margin-top:3px;font-weight:600}
.sb-section{font-size:.65rem;text-transform:uppercase;letter-spacing:.14em;color:var(--sb-muted);padding:.5rem .75rem;margin-top:.75rem}
.sb-nav{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px}
.sb-nav a{display:flex;align-items:center;gap:.75rem;padding:.7rem .75rem;border-radius:10px;color:var(--sb-text);text-decoration:none;font-size:.9rem;font-weight:500;transition:background 120ms ease,color 120ms ease}
.sb-nav a:hover{background:var(--sb-hover);color:var(--ink)}
.sb-nav a[aria-current="page"]{background:var(--sb-active);color:var(--sb-on-active);font-weight:600}
.sb-nav a[aria-current="page"] svg,.sb-nav a[aria-current="page"] svg *{color:var(--sb-on-active)!important;stroke:var(--sb-on-active)!important}
.sb-nav svg{width:18px;height:18px;flex:0 0 auto;stroke:currentColor}
.sb-footer{margin-top:auto;padding-top:1rem;border-top:1px solid var(--sb-border)}
.sb-user{display:flex;align-items:center;gap:.7rem;padding:.5rem;border-radius:10px}
.sb-avatar{width:36px;height:36px;border-radius:50%;background:var(--sb-active);color:var(--sb-on-active);display:grid;place-items:center;font-weight:700;font-size:.85rem}
.sb-userinfo{display:flex;flex-direction:column;line-height:1.15;min-width:0}
.sb-userinfo strong{font-size:.85rem;color:var(--ink);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-userinfo span{font-size:.7rem;color:var(--sb-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-logout{display:flex;align-items:center;gap:.5rem;width:100%;margin-top:.75rem;padding:.6rem .75rem;background:transparent;border:1px solid #cbd5e1;color:var(--sb-text);border-radius:10px;font-size:.85rem;font-weight:500;cursor:pointer;transition:background 120ms ease,border-color 120ms ease}
.sb-logout:hover{background:#fdecec;border-color:#f7c6c8;color:#b3151b}
.sb-logout svg{width:16px;height:16px;color:currentColor}
.sb-overlay{position:fixed;inset:0;background:rgba(10,15,13,.55);z-index:40;opacity:0;pointer-events:none;transition:opacity 200ms ease}
.sb-overlay.is-open{opacity:1;pointer-events:auto}
@media(min-width:992px){.sb-overlay{display:none}}

.main{display:flex;flex-direction:column;min-width:0;min-height:0;height:100%}
.topbar{flex:none;z-index:30;display:flex;align-items:center;gap:.75rem;padding:.6rem 1.25rem;padding-top:max(.6rem,env(safe-area-inset-top,0px));background:rgba(247,250,248,.9);backdrop-filter:saturate(140%) blur(8px);-webkit-backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid rgba(10,15,13,.06);min-height:60px}
.topbar>div:not(.topbar-right){min-width:0}
.topbar-menu{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;background:transparent;border:1px solid rgba(10,15,13,.1);color:var(--ink);cursor:pointer;flex:0 0 auto}
.topbar-menu:hover{background:rgba(10,15,13,.05)}
.topbar-menu svg{width:20px;height:20px;color:currentColor}
@media(min-width:992px){.topbar-menu{display:none}}
.topbar-title{font-size:1.05rem;font-weight:600;letter-spacing:-.01em;color:var(--ink);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.topbar-sub{font-size:.8rem;color:var(--muted);margin:2px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.topbar-right{margin-left:auto;display:flex;align-items:center;gap:.6rem}

.content{flex:1;min-height:0;display:flex;flex-direction:column;width:100%;max-width:1500px;margin-inline:auto;padding:.7rem .9rem 0}
@media(min-width:992px){.content{padding:.9rem 1.5rem 0}}
#productForm{flex:1;min-height:0;display:flex;flex-direction:column}

.btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;background:var(--green);color:var(--ink);padding:.7rem 1.25rem;border-radius:10px;font-weight:600;font-size:.92rem;border:0;cursor:pointer;text-decoration:none;transition:background 120ms ease,transform 80ms ease;box-shadow:0 4px 12px -4px rgba(141,198,63,.5);white-space:nowrap;min-height:44px}
.btn-primary:hover{background:#9bd44c;color:var(--ink)}
.btn-primary:active{transform:translateY(1px)}
.btn-primary svg{width:16px;height:16px;color:currentColor}
.btn-primary[disabled]{opacity:.65;cursor:not-allowed}
.btn-primary.is-saving svg{animation:spin 800ms linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.btn-ghost{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;background:#fff;color:var(--sb-text);padding:.6rem .9rem;border-radius:10px;font-weight:500;font-size:.88rem;border:1px solid var(--line);cursor:pointer;text-decoration:none;transition:background 120ms ease,border-color 120ms ease;min-height:44px;white-space:nowrap}
.btn-ghost:hover{background:#f1f5f9;color:var(--ink);text-decoration:none}
.btn-ghost svg{width:15px;height:15px}

.form-grid{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;gap:.6rem;padding-bottom:.6rem}
.col{display:contents}

.card{background:#fff;border:1px solid rgba(10,15,13,.06);border-radius:16px;box-shadow:0 1px 2px rgba(10,15,13,.04);margin:0}
.acc-toggle{display:flex;align-items:center;gap:.5rem;width:100%;min-height:50px;padding:.8rem 1rem;background:none;border:0;border-radius:16px;font:inherit;color:var(--ink);text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent}
.acc.is-open .acc-toggle{border-bottom:1px solid var(--line);border-bottom-left-radius:0;border-bottom-right-radius:0}
.acc-title{display:inline-flex;align-items:center;gap:.5rem;font-size:.95rem;font-weight:600}
.acc-title svg{width:17px;height:17px;color:var(--green-dark)}
.acc-hint{margin-left:auto;font-size:.72rem;color:var(--muted)}
.acc-chev{width:18px;height:18px;color:var(--muted);flex:0 0 auto;transition:transform 160ms ease}
.acc.is-open .acc-chev{transform:rotate(180deg)}
.acc:not(.is-open) .card-body{display:none}
.card-body{display:flex;flex-direction:column;gap:.7rem;padding:.9rem 1rem 1rem}

.row{display:grid;gap:.65rem;grid-template-columns:repeat(2,minmax(0,1fr))}
.row-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.row>*{min-width:0}
@media(max-width:479.98px){.row-wide{grid-template-columns:1fr}}
@media(max-width:575.98px){.row-switch{grid-template-columns:1fr}}

.field label{display:block;font-size:.78rem;font-weight:600;color:#334155;margin-bottom:.3rem}
.field label .req{color:var(--red);margin-left:2px}
.hint{font-size:.72rem;color:var(--muted);margin:0}
.field input[type="text"],.field input[type="number"],.field select,.field textarea{
  display:block;width:100%;background:#f1f5f9;border:1.5px solid transparent;border-radius:12px;
  padding:.68rem .8rem;font-size:16px;line-height:1.3;color:var(--ink);font-family:inherit;
  transition:background 120ms ease,border-color 120ms ease,box-shadow 120ms ease;
  -webkit-appearance:none;appearance:none;
}
.field input:hover,.field select:hover,.field textarea:hover{background:#e9eef5}
.field input:focus,.field select:focus,.field textarea:focus{background:#fff;border-color:var(--green);box-shadow:0 0 0 4px rgba(141,198,63,.18);outline:none}
.field input::placeholder,.field textarea::placeholder{color:#94a3b8}
.field .is-invalid{border-color:var(--red)!important;background:#fdecec!important}
.field textarea{resize:none;min-height:76px}
.field select{
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat:no-repeat;background-position:right .8rem center;padding-right:2.2rem;
}

.switch-row{display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.65rem .85rem;background:#f1f5f9;border-radius:12px}
.switch-row .lbl{display:flex;flex-direction:column;line-height:1.2;min-width:0}
.switch-row .lbl strong{font-size:.86rem;font-weight:600;color:var(--ink)}
.switch-row .lbl small{font-size:.7rem;color:var(--muted);margin-top:2px}
.switch{position:relative;display:inline-block;width:46px;height:28px;flex:0 0 auto}
.switch input{opacity:0;width:0;height:0}
.switch .track{position:absolute;inset:0;background:#cbd5e1;border-radius:999px;transition:background 160ms ease;cursor:pointer}
.switch .track::before{content:"";position:absolute;left:3px;top:3px;width:22px;height:22px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform 160ms ease}
.switch input:checked + .track{background:var(--green)}
.switch input:checked + .track::before{transform:translateX(18px)}
.switch input:focus-visible + .track{box-shadow:0 0 0 3px rgba(141,198,63,.35)}

.images-grid{display:grid;gap:.6rem;grid-template-columns:repeat(3,minmax(0,1fr))}
.image-slot{position:relative;aspect-ratio:1/1;background:#f1f5f9;border:1.5px dashed #cbd5e1;border-radius:12px;overflow:hidden;transition:border-color 120ms ease,background 120ms ease}
.image-slot:hover{border-color:var(--green);background:#eef7e0}
.image-slot.drag-over{border-color:var(--green);background:#e0efc9;border-style:solid}
.image-slot.has-image{border-style:solid;border-color:var(--line)}
.image-slot input[type="file"]{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:3;font-size:16px}
.image-slot.has-image input[type="file"]{pointer-events:none}
.image-slot .slot-preview{position:absolute;inset:0;z-index:2;pointer-events:none}
.image-slot .slot-preview img{width:100%;height:100%;object-fit:cover;display:block}
.image-slot .slot-empty{position:absolute;inset:0;z-index:2;pointer-events:none;display:flex;align-items:center;justify-content:center;flex-direction:column;color:var(--muted);text-align:center;padding:.4rem;line-height:1.25;font-size:.7rem}
.image-slot .slot-empty svg{width:22px;height:22px;margin-bottom:.3rem;color:#94a3b8}
.image-slot.drag-over .slot-empty svg{color:var(--green-dark)}
.only-touch{display:none}
@media(hover:none){.only-fine{display:none}.only-touch{display:inline}}
.image-slot .position-badge{position:absolute;top:6px;left:6px;z-index:4;background:rgba(10,15,13,.75);color:#fff;font-size:.65rem;font-weight:600;padding:2px 7px;border-radius:999px;pointer-events:none}
.image-slot .remove-btn{position:absolute;top:5px;right:5px;z-index:5;width:28px;height:28px;border-radius:50%;border:0;background:rgba(237,28,36,.92);color:#fff;cursor:pointer;display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.image-slot .remove-btn:hover{background:var(--red)}
.image-slot .remove-btn svg{width:14px;height:14px;color:#fff}
#removeIdsBox{display:none}

/* Reorder controls — light pill style */
.image-slot .reorder-ctrls{
  position:absolute;
  left:6px;right:6px;bottom:6px;
  z-index:6;
  display:flex;justify-content:space-between;gap:6px;
  pointer-events:none;
}
.image-slot .reorder-btn{
  pointer-events:auto;
  width:30px;height:30px;
  border-radius:999px;
  border:1px solid var(--line);
  background:#ffffff;
  color:var(--ink);
  cursor:pointer;
  display:grid;place-items:center;
  box-shadow:0 2px 6px rgba(10,15,13,.10);
  transition:background 120ms ease,border-color 120ms ease,color 120ms ease,transform 80ms ease;
}
.image-slot .reorder-btn:hover{
  background:var(--green);
  border-color:var(--green);
  color:var(--ink);
}
.image-slot .reorder-btn:active{transform:scale(0.94)}
.image-slot .reorder-btn svg{width:16px;height:16px;color:currentColor}
#imageOrderBox{display:none}

.actions-bar{flex:none;display:flex;align-items:center;gap:.5rem;margin:0 -.9rem;padding:.6rem .9rem max(.6rem,env(safe-area-inset-bottom,0px));background:rgba(247,250,248,.95);border-top:1px solid var(--line)}
.actions-bar .spacer{flex:1}
.actions-bar .btn-primary{flex:1 1 auto;max-width:none}
@media(min-width:992px){.actions-bar{margin:0 -1.5rem;padding-inline:1.5rem}.actions-bar .btn-primary{flex:0 0 auto;min-width:170px}}
@media(max-width:991.98px){.actions-bar .spacer{display:none}}

.toast-wrap{position:fixed;top:max(1rem,env(safe-area-inset-top,0px));right:1rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;pointer-events:none;max-width:calc(100vw - 2rem)}
.toast{pointer-events:auto;background:#fff;border:1px solid var(--line);border-radius:12px;padding:.85rem 1rem;min-width:260px;max-width:380px;box-shadow:0 12px 30px -8px rgba(10,15,13,.25),0 4px 10px -2px rgba(10,15,13,.08);display:flex;align-items:flex-start;gap:.6rem;font-size:.88rem;line-height:1.35;animation:toastIn 260ms cubic-bezier(0.22,1,0.36,1)}
.toast--success{border-left:4px solid var(--green)}
.toast--danger{border-left:4px solid var(--red)}
.toast--success .toast-icon{color:var(--green-dark)}
.toast--danger .toast-icon{color:var(--red)}
.toast-icon{flex:0 0 auto;margin-top:1px}
.toast-body{flex:1;min-width:0}
.toast-body strong{display:block;color:var(--ink);font-weight:600;margin-bottom:2px;font-size:.88rem}
.toast-body div{color:var(--muted);font-size:.82rem}
.toast-close{flex:0 0 auto;background:transparent;border:0;color:var(--muted);cursor:pointer;padding:2px;border-radius:4px}
.toast-close:hover{background:#f1f5f9;color:var(--ink)}
.toast-close svg{width:14px;height:14px}
@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
.toast.is-leaving{animation:toastOut 220ms ease forwards}
@keyframes toastOut{from{opacity:1;transform:none}to{opacity:0;transform:translateX(20px)}}
@media(max-width:600px){.toast-wrap{right:.5rem;left:.5rem;max-width:none}.toast{max-width:none;width:100%}}

@media(max-width:767.98px){
  .topbar{padding-left:.9rem;padding-right:.9rem;gap:.6rem}
  .topbar-sub{display:none}
  .topbar-title{font-size:1rem}
}
@media(max-width:419.98px){.topbar .btn-label{display:none}.topbar .btn-ghost{padding:.6rem}}
@media(max-width:380px){.actions-bar .btn-ghost .btn-label{display:none}}

@media(min-width:1200px){
  .form-grid{display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:.75rem;padding-bottom:.75rem}
  .col{display:flex;flex-direction:column;gap:.75rem;min-height:0}
  .col .card:last-child{flex:1;display:flex;flex-direction:column}
  .col .card:last-child .card-body{flex:1}
  .acc .card-body{display:flex!important;gap:.6rem;padding:.85rem 1.1rem 1rem}
  .acc-toggle{pointer-events:none;cursor:default;min-height:0;padding:.7rem 1.1rem;border-bottom:1px solid var(--line);border-radius:16px 16px 0 0}
  .acc-chev{display:none}
  .field--grow{flex:1;display:flex;flex-direction:column}
  .field--grow textarea{flex:1;min-height:70px}
  .field label{margin-bottom:.22rem;font-size:.74rem}
  .row{gap:.6rem}
}
@media(min-width:1200px) and (hover:hover) and (pointer:fine){
  .field input[type="text"],.field input[type="number"],.field select,.field textarea{font-size:14px;padding:.55rem .75rem;border-radius:10px}
  .field select{padding-right:2.1rem}
  .btn-primary,.btn-ghost{min-height:40px}
}
@media(prefers-reduced-motion:reduce){.sb,.sb-overlay,.switch .track,.switch .track::before,.toast,.acc-chev{transition:none!important;animation:none!important}}
</style>
</head>
<body>

<div class="shell">
  <div class="sb-overlay" data-sb-overlay></div>
  <aside class="sb" data-sb aria-label="Admin navigation">
    <a class="sb-brand" href="index.php">
      <img src="../assets/img/logo.png" alt="">
      <span class="sb-brand-text"><strong>IT Zone</strong><span>Admin</span></span>
    </a>
    <div class="sb-section">Workspace</div>
    <ul class="sb-nav">
      <li><a href="index.php"><i data-lucide="layout-dashboard"></i><span>Dashboard</span></a></li>
      <li><a href="products.php" aria-current="page"><i data-lucide="package"></i><span>Products</span></a></li>
      <li><a href="#" aria-disabled="true" style="opacity:.5;cursor:not-allowed" title="Later"><i data-lucide="shopping-cart"></i><span>Orders</span></a></li>
    </ul>
    <div class="sb-footer">
      <div class="sb-user">
        <div class="sb-avatar"><?= e(strtoupper(substr($user['username'], 0, 1))) ?></div>
        <div class="sb-userinfo"><strong><?= e($user['name']) ?></strong><span>@<?= e($user['username']) ?></span></div>
      </div>
      <form method="post" action="logout.php" style="margin:0">
        <?= csrf_field() ?>
        <button class="sb-logout" type="submit"><i data-lucide="log-out"></i><span>Logout</span></button>
      </form>
    </div>
  </aside>

  <div class="main">
    <header class="topbar">
      <button type="button" class="topbar-menu" data-sb-toggle aria-label="Open menu"><i data-lucide="menu"></i></button>
      <div>
        <h1 class="topbar-title"><?= e($pageTitle) ?></h1>
        <p class="topbar-sub"><?= $isEdit ? 'Update existing product' : 'Add a new product to the catalog' ?></p>
      </div>
      <div class="topbar-right">
        <a href="products.php" class="btn-ghost" aria-label="Back to products"><i data-lucide="arrow-left"></i><span class="btn-label">Back</span></a>
      </div>
    </header>

    <main class="content">
      <form id="productForm" method="post" action="product-handler.php" enctype="multipart/form-data" novalidate>
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="<?= $isEdit ? 'update' : 'create' ?>">
        <?php if ($isEdit): ?>
          <input type="hidden" name="id" value="<?= (int) $v['id'] ?>">
        <?php endif; ?>

        <div class="form-grid">

          <div class="col">
            <section class="card acc is-open">
              <button type="button" class="acc-toggle" aria-expanded="true">
                <span class="acc-title"><i data-lucide="package"></i> Basic info</span>
                <i data-lucide="chevron-down" class="acc-chev"></i>
              </button>
              <div class="card-body">
                <div class="row">
                  <div class="field">
                    <label for="brand">Brand <span class="req">*</span></label>
                    <input type="text" id="brand" name="brand" value="<?= e((string) $v['brand']) ?>" required maxlength="60" placeholder="DELL, HP">
                  </div>
                  <div class="field">
                    <label for="model">Model <span class="req">*</span></label>
                    <input type="text" id="model" name="model" value="<?= e((string) $v['model']) ?>" required maxlength="120" placeholder="Latitude 3400">
                  </div>
                </div>
                <div class="row">
                  <div class="field">
                    <label for="category">Category <span class="req">*</span></label>
                    <select id="category" name="category" required>
                      <option value="laptop"  <?= $v['category'] === 'laptop'  ? 'selected' : '' ?>>Laptop</option>
                      <option value="desktop" <?= $v['category'] === 'desktop' ? 'selected' : '' ?>>Desktop</option>
                      <option value="monitor" <?= $v['category'] === 'monitor' ? 'selected' : '' ?>>Monitor</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="condition_grade">Condition <span class="req">*</span></label>
                    <select id="condition_grade" name="condition_grade" required>
                      <option value="A" <?= $v['condition_grade'] === 'A' ? 'selected' : '' ?>>A — Like new</option>
                      <option value="B" <?= $v['condition_grade'] === 'B' ? 'selected' : '' ?>>B — Good</option>
                      <option value="C" <?= $v['condition_grade'] === 'C' ? 'selected' : '' ?>>C — Fair</option>
                      <option value="D" <?= $v['condition_grade'] === 'D' ? 'selected' : '' ?>>D — Budget</option>
                    </select>
                  </div>
                </div>
                <div class="field field--grow">
                  <label for="features">Features</label>
                  <textarea id="features" name="features" placeholder="One per line — Backlight Keyboard, Face Unlock, Fingerprint sensor"><?= e($featuresText) ?></textarea>
                  <p class="hint" style="margin-top:.3rem">One feature per line. Shown as badges on the product page.</p>
                </div>
              </div>
            </section>
          </div>

          <div class="col">
            <section class="card acc">
              <button type="button" class="acc-toggle" aria-expanded="false">
                <span class="acc-title"><i data-lucide="cpu"></i> Specifications</span>
                <span class="acc-hint">Optional</span>
                <i data-lucide="chevron-down" class="acc-chev"></i>
              </button>
              <div class="card-body">
                <div class="row row-wide">
                  <div class="field">
                    <label for="processor">Processor</label>
                    <input type="text" id="processor" name="processor" value="<?= e((string) $v['processor']) ?>" maxlength="80" placeholder="Core i5-8th Gen 1.60GHz">
                  </div>
                  <div class="field">
                    <label for="cpu">CPU</label>
                    <input type="text" id="cpu" name="cpu" value="<?= e((string) $v['cpu']) ?>" maxlength="80" placeholder="Core (TM) i5-8265U 4 Cores 8 Threads">
                  </div>
                </div>
                <div class="row row-3">
                  <div class="field">
                    <label for="ram_gb">RAM (GB)</label>
                    <input type="number" id="ram_gb" name="ram_gb" value="<?= e((string) $v['ram_gb']) ?>" min="1" max="512" placeholder="8" inputmode="numeric">
                  </div>
                  <div class="field">
                    <label for="storage_value">Storage (GB)</label>
                    <input type="number" id="storage_value" name="storage_value" value="<?= e((string) $v['storage_value']) ?>" min="1" max="8192" placeholder="256" inputmode="numeric">
                  </div>
                  <div class="field">
                    <label for="storage_type">Type</label>
                    <select id="storage_type" name="storage_type">
                      <option value=""     <?= $v['storage_type'] === ''     ? 'selected' : '' ?>>—</option>
                      <option value="SSD"  <?= $v['storage_type'] === 'SSD'  ? 'selected' : '' ?>>SSD</option>
                      <option value="HDD"  <?= $v['storage_type'] === 'HDD'  ? 'selected' : '' ?>>HDD</option>
                      <option value="NVMe" <?= $v['storage_type'] === 'NVMe' ? 'selected' : '' ?>>NVMe</option>
                    </select>
                  </div>
                </div>
                <div class="row">
                  <div class="field">
                    <label for="gpu">GPU</label>
                    <input type="text" id="gpu" name="gpu" value="<?= e((string) $v['gpu']) ?>" maxlength="120" placeholder="Integrated">
                  </div>
                  <div class="field">
                    <label for="screen">Display</label>
                    <input type="text" id="screen" name="screen" value="<?= e((string) $v['screen']) ?>" maxlength="80" placeholder="14 Inch">
                  </div>
                </div>
                <div class="row">
                  <div class="field">
                    <label for="resolution">Resolution</label>
                    <input type="text" id="resolution" name="resolution" value="<?= e((string) $v['resolution']) ?>" maxlength="40" placeholder="1920x1080">
                  </div>
                  <div class="field">
                    <label for="battery">Battery</label>
                    <input type="text" id="battery" name="battery" value="<?= e((string) $v['battery']) ?>" maxlength="40" placeholder="Excellent">
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div class="col">
            <section class="card acc">
              <button type="button" class="acc-toggle" aria-expanded="false">
                <span class="acc-title"><i data-lucide="tag"></i> Pricing &amp; stock</span>
                <i data-lucide="chevron-down" class="acc-chev"></i>
              </button>
              <div class="card-body">
                <div class="row row-3">
                  <div class="field">
                    <label for="price">Price <span class="req">*</span></label>
                    <input type="number" id="price" name="price" value="<?= e((string) $v['price']) ?>" min="0" step="1" required placeholder="50000" inputmode="numeric">
                  </div>
                  <div class="field">
                    <label for="currency">Currency</label>
                    <select id="currency" name="currency">
                      <option value="PKR" <?= $v['currency'] === 'PKR' ? 'selected' : '' ?>>PKR</option>
                      <option value="USD" <?= $v['currency'] === 'USD' ? 'selected' : '' ?>>USD</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="stock_qty">Stock qty</label>
                    <input type="number" id="stock_qty" name="stock_qty" value="<?= e((string) $v['stock_qty']) ?>" min="0" max="99999" inputmode="numeric">
                  </div>
                </div>
                <div class="row row-switch">
                  <div class="switch-row">
                    <div class="lbl"><strong>In stock</strong><small>Off when sold out</small></div>
                    <label class="switch">
                      <input type="checkbox" name="stock_status" value="in_stock" <?= $v['stock_status'] === 'in_stock' ? 'checked' : '' ?>>
                      <span class="track"></span>
                    </label>
                  </div>
                  <div class="switch-row">
                    <div class="lbl"><strong>Published</strong><small>Off to hide it</small></div>
                    <label class="switch">
                      <input type="checkbox" name="published" value="1" <?= (int) $v['published'] === 1 ? 'checked' : '' ?>>
                      <span class="track"></span>
                    </label>
                  </div>
                </div>
                <div class="field">
                  <label for="warranty">Warranty</label>
                  <input type="text" id="warranty" name="warranty" value="<?= e((string) $v['warranty']) ?>" maxlength="160" placeholder="30-day performance warranty">
                </div>
              </div>
            </section>

            <section class="card acc">
              <button type="button" class="acc-toggle" aria-expanded="false">
                <span class="acc-title"><i data-lucide="image"></i> Images</span>
                <span class="acc-hint">Max 3 · min 1</span>
                <i data-lucide="chevron-down" class="acc-chev"></i>
              </button>
              <div class="card-body">
                <div class="images-grid" id="imagesGrid">
                  <?php for ($i = 0; $i < 3; $i++):
                    $existing = $imageByPos[$i] ?? null;
                    $token = $existing ? 'e:' . (int) $existing['id'] : 'n:' . $i;
                  ?>
                    <div class="image-slot <?= $existing ? 'has-image' : '' ?>" data-slot="<?= $i ?>" data-token="<?= e($token) ?>">
                      <input type="file" name="images[<?= $i ?>]" accept="image/jpeg,image/jpg,image/pjpeg,image/png,image/webp" aria-label="Image <?= $i + 1 ?>">
                      <?php if ($existing): ?>
                        <div class="slot-preview"><img src="../<?= e($existing['file_path']) ?>" alt=""></div>
                        <span class="position-badge"><?= $i + 1 ?></span>
                        <button type="button" class="remove-btn" data-remove-existing="<?= (int) $existing['id'] ?>" aria-label="Remove image">
                          <i data-lucide="x"></i>
                        </button>
                      <?php else: ?>
                        <div class="slot-empty">
                          <i data-lucide="upload-cloud"></i>
                          <span class="only-fine">Click or drop</span><span class="only-touch">Tap to add</span>
                        </div>
                        <span class="position-badge"><?= $i + 1 ?></span>
                      <?php endif; ?>
                      <div class="reorder-ctrls">
                        <button type="button" class="reorder-btn" data-move="prev" aria-label="Move left" title="Move left">
                          <i data-lucide="chevron-left"></i>
                        </button>
                        <button type="button" class="reorder-btn" data-move="next" aria-label="Move right" title="Move right">
                          <i data-lucide="chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  <?php endfor; ?>
                </div>
                <div id="removeIdsBox"></div>
                <div id="imageOrderBox"></div>
                <p class="hint">JPG, PNG or WebP · max 5 MB each · #1 is the main thumbnail. Use ◀ ▶ to reorder.</p>
              </div>
            </section>
          </div>

        </div>

        <div class="actions-bar">
          <a href="products.php" class="btn-ghost">Cancel</a>
          <?php if ($isEdit): ?>
            <a href="../pages/product.html?id=<?= e((string) $v['sku']) ?>&from=<?= $v['category'] === 'laptop' ? 'laptops' : 'pcs' ?>"
               target="_blank" rel="noopener" class="btn-ghost" aria-label="Preview live page">
              <i data-lucide="external-link"></i><span class="btn-label">Preview</span>
            </a>
          <?php endif; ?>
          <span class="spacer"></span>
          <button type="submit" class="btn-primary" id="submitBtn">
            <i data-lucide="save"></i>
            <span class="btn-label"><?= $isEdit ? 'Save changes' : 'Create product' ?></span>
          </button>
        </div>
      </form>
    </main>
  </div>
</div>

<div class="toast-wrap" id="toastWrap" aria-live="polite" aria-atomic="true"></div>

<script src="../assets/js/vendors/lucide.min.js"></script>
<script>
(function () {
  'use strict';

  function renderLucide() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }
  renderLucide();

  var sb=document.querySelector('[data-sb]'),ov=document.querySelector('[data-sb-overlay]'),tg=document.querySelector('[data-sb-toggle]');
  function openSB(){sb&&sb.classList.add('is-open');ov&&ov.classList.add('is-open');}
  function closeSB(){sb&&sb.classList.remove('is-open');ov&&ov.classList.remove('is-open');}
  tg&&tg.addEventListener('click',openSB);ov&&ov.addEventListener('click',closeSB);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeSB();});

  var desktop = window.matchMedia('(min-width: 1200px)');
  var accs = [].slice.call(document.querySelectorAll('.acc'));

  function setOpen(acc, open) {
    acc.classList.toggle('is-open', open);
    var b = acc.querySelector('.acc-toggle');
    if (b) b.setAttribute('aria-expanded', String(open));
  }
  function syncMode() {
    accs.forEach(function (a) {
      var b = a.querySelector('.acc-toggle');
      if (b) b.tabIndex = desktop.matches ? -1 : 0;
    });
    if (desktop.matches) {
      accs.forEach(function (a) { setOpen(a, true); });
    } else {
      var keep = null;
      accs.forEach(function (a) {
        if (a.classList.contains('is-open') && !keep) keep = a;
      });
      accs.forEach(function (a) { setOpen(a, a === (keep || accs[0])); });
    }
  }
  syncMode();
  if (desktop.addEventListener) desktop.addEventListener('change', syncMode);
  else if (desktop.addListener) desktop.addListener(syncMode);

  accs.forEach(function (acc) {
    var btn = acc.querySelector('.acc-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (desktop.matches) return;
      var willOpen = !acc.classList.contains('is-open');
      accs.forEach(function (a) { setOpen(a, a === acc && willOpen); });
      if (willOpen) acc.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  });

  function openSectionFor(el) {
    var acc = el.closest ? el.closest('.acc') : null;
    if (acc && !desktop.matches) accs.forEach(function (a) { setOpen(a, a === acc); });
  }

  var toastWrap = document.getElementById('toastWrap');
  function showToast(type, title, body, duration) {
    if (!toastWrap) return;
    var icon = type === 'success' ? 'check-circle' : 'alert-circle';
    var el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.innerHTML =
      '<span class="toast-icon"><i data-lucide="' + icon + '" width="18" height="18"></i></span>' +
      '<div class="toast-body"><strong>' + title + '</strong><div>' + body + '</div></div>' +
      '<button type="button" class="toast-close" aria-label="Dismiss"><i data-lucide="x"></i></button>';
    toastWrap.appendChild(el);
    renderLucide();
    var timeout = duration || 5000;
    var close = function () {
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 240);
    };
    el.querySelector('.toast-close').addEventListener('click', close);
    setTimeout(close, timeout);
  }

  function emptySlotHTML() {
    return '<div class="slot-empty">' +
             '<i data-lucide="upload-cloud"></i>' +
             '<span class="only-fine">Click or drop</span><span class="only-touch">Tap to add</span>' +
           '</div>';
  }

  function attachRemoveButton(slot, onRemove) {
    var old = slot.querySelector('.remove-btn');
    if (old) old.remove();
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'remove-btn';
    btn.setAttribute('aria-label', 'Remove image');
    btn.innerHTML = '<i data-lucide="x"></i>';
    btn.addEventListener('click', onRemove);
    slot.appendChild(btn);
    renderLucide();
  }

  document.querySelectorAll('.image-slot').forEach(function (slot) {
    var input = slot.querySelector('input[type="file"]');
    if (!input) return;

    function showNewPreview(file) {
      if (!file) return;

      var name = file.name || 'file';
      var type = (file.type || '').toLowerCase();

      // Empty MIME (some phones) — fall back to extension
      var ext = name.split('.').pop().toLowerCase();
      var okExt = ['jpg', 'jpeg', 'png', 'webp'];
      var okMime = /^image\/(jpeg|jpg|pjpeg|png|x-png|webp)$/;

      if (!okMime.test(type) && okExt.indexOf(ext) === -1) {
        showToast(
          'danger',
          'Cannot use "' + name + '"',
          'This file is ' + (type || 'unknown type') +
          '. Please use a JPG, PNG or WebP image.'
        );
        input.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        var sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        showToast('danger', 'Image too large', name + ' is ' + sizeMb + ' MB. Max 5 MB per image.');
        input.value = '';
        return;
      }
      slot.querySelectorAll('.slot-preview, .slot-empty, .remove-btn').forEach(function (el) { el.remove(); });
      var p = document.createElement('div');
      p.className = 'slot-preview';
      var img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = '';
      p.appendChild(img);
      slot.appendChild(p);
      slot.classList.add('has-image');

      attachRemoveButton(slot, function () {
        input.value = '';
        slot.querySelectorAll('.slot-preview, .remove-btn').forEach(function (el) { el.remove(); });
        slot.classList.remove('has-image');
        var e = document.createElement('div');
        e.innerHTML = emptySlotHTML();
        slot.appendChild(e.firstElementChild);
        renderLucide();
      });
    }

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (file) showNewPreview(file);
    });

    slot.addEventListener('dragenter', function (e) { e.preventDefault(); slot.classList.add('drag-over'); });
    slot.addEventListener('dragover',  function (e) { e.preventDefault(); slot.classList.add('drag-over'); });
    slot.addEventListener('dragleave', function (e) {
      if (!slot.contains(e.relatedTarget)) slot.classList.remove('drag-over');
    });
    slot.addEventListener('drop', function (e) {
      e.preventDefault();
      slot.classList.remove('drag-over');
      var dt = e.dataTransfer;
      if (!dt || !dt.files || !dt.files.length) return;
      var file = dt.files[0];
      try {
        var transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
      } catch (err) {
        showNewPreview(file);
        return;
      }
      showNewPreview(file);
    });

    var existingBtn = slot.querySelector('[data-remove-existing]');
    if (existingBtn) {
      attachRemoveButton(slot, function () {
        var id = existingBtn.getAttribute('data-remove-existing');
        if (!id) return;
        if (!confirm('Remove this image?')) return;
        var box = document.getElementById('removeIdsBox');
        if (box) {
          var h = document.createElement('input');
          h.type = 'hidden';
          h.name = 'remove_image_ids[]';
          h.value = id;
          box.appendChild(h);
        }
        slot.querySelectorAll('.slot-preview, .remove-btn').forEach(function (el) { el.remove(); });
        slot.classList.remove('has-image');
        var e = document.createElement('div');
        e.innerHTML = emptySlotHTML();
        slot.appendChild(e.firstElementChild);
        renderLucide();
      });
    }
  });

  // ── Image reorder (token-based) ──
  var imageGrid = document.getElementById('imagesGrid');
  var imageOrderBox = document.getElementById('imageOrderBox');

  function currentOrder() {
    if (!imageGrid) return [];
    return [].slice.call(imageGrid.querySelectorAll('.image-slot')).map(function (s) {
      return s.dataset.token;
    });
  }
  function updateBadges() {
    if (!imageGrid) return;
    imageGrid.querySelectorAll('.image-slot').forEach(function (slot, i) {
      var b = slot.querySelector('.position-badge');
      if (b) b.textContent = i + 1;
    });
  }
  function persistOrder() {
    if (!imageOrderBox) return;
    imageOrderBox.innerHTML = '';
    currentOrder().forEach(function (token) {
      var h = document.createElement('input');
      h.type = 'hidden';
      h.name = 'image_order[]';
      h.value = token;
      imageOrderBox.appendChild(h);
    });
  }
  function applyOrder(tokens) {
    if (!imageGrid) return;
    var byToken = {};
    imageGrid.querySelectorAll('.image-slot').forEach(function (s) { byToken[s.dataset.token] = s; });
    tokens.forEach(function (t) { if (byToken[t]) imageGrid.appendChild(byToken[t]); });
    updateBadges();
    persistOrder();
  }
  persistOrder();

  document.querySelectorAll('.image-slot .reorder-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var slot = btn.closest('.image-slot');
      if (!slot) return;
      var order = currentOrder();
      var pos = order.indexOf(slot.dataset.token);
      if (pos < 0) return;
      var target = btn.getAttribute('data-move') === 'prev' ? pos - 1 : pos + 1;
      if (target < 0 || target >= order.length) return;
      var tmp = order[pos]; order[pos] = order[target]; order[target] = tmp;
      applyOrder(order);
    });
  });

  // ── AJAX form submit ──
  var form = document.getElementById('productForm');
  var submitBtn = document.getElementById('submitBtn');

  form.addEventListener('input', function (e) {
    if (e.target && e.target.classList) e.target.classList.remove('is-invalid');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var missing = [];
    ['brand','model','category','condition_grade','price'].forEach(function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      if (el) {
        if (!el.value) { missing.push(el); el.classList.add('is-invalid'); }
        else el.classList.remove('is-invalid');
      }
    });
    if (missing.length) {
      showToast('danger', 'Missing required fields', 'Fill brand, model, category, condition and price.');
      openSectionFor(missing[0]);
      setTimeout(function () { missing[0].focus(); }, 60);
      return;
    }

    submitBtn.disabled = true;
    var original = submitBtn.innerHTML;
    submitBtn.classList.add('is-saving');
    submitBtn.innerHTML = '<i data-lucide="loader-2"></i><span class="btn-label">Saving…</span>';
    renderLucide();

    function restoreBtn() {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-saving');
      submitBtn.innerHTML = original;
      renderLucide();
    }

    var fd = new FormData(form);
    var actionUrl = form.getAttribute('action') || 'product-handler.php';
    fetch(actionUrl, {
      method: 'POST',
      body: fd,
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
    .then(function (result) {
      restoreBtn();
      var d = result.data || {};
      if (d.ok) {
        showToast('success', d.message || 'Saved', d.detail || '');
        form.reset();
        document.querySelectorAll('.image-slot').forEach(function (slot) {
          slot.querySelectorAll('.slot-preview, .remove-btn').forEach(function (el) { el.remove(); });
          slot.classList.remove('has-image');
          if (!slot.querySelector('.slot-empty')) {
            var e = document.createElement('div');
            e.innerHTML = emptySlotHTML();
            slot.appendChild(e.firstElementChild);
          }
        });
        var box = document.getElementById('removeIdsBox');
        if (box) box.innerHTML = '';
        if (!desktop.matches) accs.forEach(function (a, i) { setOpen(a, i === 0); });
        var grid = document.querySelector('.form-grid');
        if (grid) grid.scrollTop = 0;
        renderLucide();
      } else {
        showToast('danger', 'Could not save', d.message || 'Please check the form and try again.', 8000);
        if (Array.isArray(d.errors) && d.errors.length) {
          showToast('danger', 'Details', d.errors.join(' · '), 10000);
        }
      }
    })
    .catch(function (err) {
      restoreBtn();
      showToast('danger', 'Network error', String(err), 8000);
    });
  });
})();
</script>
</body>
</html>