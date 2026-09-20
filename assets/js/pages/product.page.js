// assets/js/pages/product.page.js
/* ─────────────────────────────────────────────────────────
   Product detail page.
   URL: /pages/product.html?id=<id>&from=laptops|pcs
   Primary CTA: Order on WhatsApp.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const PHONE_DISPLAY = '03265974741';
  const PHONE_TEL     = 'tel:+923265974741';

  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function r(href) {
    if (href.startsWith('#')) return isInPagesDir() ? `../index.html${href}` : href;
    if (/^https?:|^tel:|^mailto:/.test(href)) return href;
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  function readParams() {
    const p = new URLSearchParams(window.location.search);
    let id   = (p.get('id')   || '').trim();
    let from = (p.get('from') || '').trim();

    if (!id) {
      try {
        const pendingId = sessionStorage.getItem('itz.pendingProductId');
        const pendingFrom = sessionStorage.getItem('itz.pendingProductFrom');
        const at = Number(sessionStorage.getItem('itz.pendingProductAt') || 0);
        if (pendingId && (Date.now() - at) < 15000) {
          id   = pendingId;
          from = from || pendingFrom || 'laptops';
          const url = new URL(window.location.href);
          url.searchParams.set('id', id);
          url.searchParams.set('from', from);
          window.history.replaceState({}, '', url);
          console.info('[IT Zone] Recovered product from sessionStorage:', id, '|', from);
        }
      } catch (e) { /* ignore */ }
    }

    return { id, from: from || 'laptops' };
  }

  function findItem(id, from, laptops, pcs) {
    if (!id) return null;
    if (from === 'pcs') {
      const all = []
        .concat(pcs?.desktops || [])
        .concat(pcs?.tiny     || [])
        .concat(pcs?.monitors || []);
      return all.find(x => String(x.id) === String(id)) || null;
    }
    return (laptops || []).find(x => String(x.id) === String(id)) || null;
  }

  function findRelated(item, laptops, pcs) {
    if (!item) return [];
    const fromPC = /^(pc-|mon-)/.test(item.id);
    const pool = fromPC
      ? [].concat(pcs?.desktops || [], pcs?.tiny || [], pcs?.monitors || [])
      : (laptops || []).slice();

    const price = Number(item.price) || 0;
    return pool
      .filter(x => String(x.id) !== String(item.id))
      .sort((a, b) => {
        const aBrand = a.brand === item.brand ? 1 : 0;
        const bBrand = b.brand === item.brand ? 1 : 0;
        if (aBrand !== bBrand) return bBrand - aBrand;
        return Math.abs(Number(a.price) - price) - Math.abs(Number(b.price) - price);
      })
      .slice(0, 4);
  }

  function imageBlock(item) {
    const src = item.image || '';
    const icon = item.resolution ? 'monitor'
               : item.hdd ? 'cpu'
               : 'laptop';
    if (src) {
      return '<img src="' + src + '" alt="' + item.brand + ' ' + item.model + '" ' +
             'loading="eager" decoding="async">';
    }
    return '<i data-lucide="' + icon + '"></i>';
  }

  function specRows(item) {
    const rows = [];
    if (item.brand)      rows.push(['Brand', item.brand]);
    if (item.model)      rows.push(['Model', item.model]);
    if (item.cpu)        rows.push(['Processor', item.cpu + (item.gen ? ' ' + item.gen + ' Gen' : '')]);
    else if (item.gen)   rows.push(['Generation', item.gen]);
    if (item.ram)        rows.push(['RAM', item.ram + ' GB']);
    if (item.ssd)        rows.push(['Storage (SSD)', item.ssd + ' GB SSD']);
    if (item.hdd)        rows.push(['Storage', item.hdd]);
    if (item.gpu)        rows.push(['Graphics', item.gpu]);
    if (item.resolution) rows.push(['Resolution', item.resolution]);
    if (item.size)       rows.push(['Size', item.size]);
    if (item.extras)     rows.push(['Notes', item.extras]);
    rows.push(['Condition', 'Certified refurbished \u00b7 Tested']);
    rows.push(['Warranty', '1 year']);
    rows.push(['Delivery', 'Nationwide (2\u20134 business days)']);

    return rows.map(r =>
      '<div class="spec-row">' +
        '<span class="spec-key">' + r[0] + '</span>' +
        '<span class="spec-value">' + r[1] + '</span>' +
      '</div>'
    ).join('');
  }

  function quickPills(item) {
    const pills = [];
    if (item.cpu && item.gen) pills.push({ icon: 'cpu',          text: item.cpu + ' ' + item.gen + ' Gen' });
    else if (item.cpu)        pills.push({ icon: 'cpu',          text: item.cpu });
    if (item.ram)             pills.push({ icon: 'memory-stick', text: item.ram + 'GB RAM' });
    if (item.ssd)             pills.push({ icon: 'hard-drive',   text: item.ssd + 'GB SSD' });
    if (item.hdd)             pills.push({ icon: 'hard-drive',   text: item.hdd });
    if (item.gpu)             pills.push({ icon: 'zap',          text: item.gpu });
    if (item.resolution)      pills.push({ icon: 'monitor',      text: item.resolution });
    if (item.size)            pills.push({ icon: 'maximize',     text: item.size });
    return pills.map(p =>
      '<span class="product-pill"><i data-lucide="' + p.icon + '"></i>' + p.text + '</span>'
    ).join('');
  }

  function breadcrumb(item, from) {
    const listLabel = from === 'pcs' ? 'PCs & Monitors' : 'Laptops';
    const listHref  = from === 'pcs' ? r('pages/pcs.html') : r('pages/inventory.html');
    return (
      '<nav class="product-breadcrumb" aria-label="Breadcrumb">' +
        '<a href="' + r('index.html') + '">Home</a>' +
        '<span class="sep">/</span>' +
        '<a href="' + listHref + '">' + listLabel + '</a>' +
        '<span class="sep">/</span>' +
        '<span class="current">' + item.brand + ' ' + item.model + '</span>' +
      '</nav>'
    );
  }

  function buildPage(item, related, from) {
    const fragment = document.createDocumentFragment();

    /* Breadcrumb */
    const bc = document.createElement('div');
    bc.innerHTML = breadcrumb(item, from);
    fragment.appendChild(bc.firstElementChild);

    /* Top grid: image + info */
    const priceFormatted = new Intl.NumberFormat('en-PK').format(item.price);
    const waUrl = NS.WhatsApp.productDetailUrl(item);

    const grid = document.createElement('div');
    grid.className = 'product-detail-grid';
    grid.innerHTML =
      '<div class="product-detail-image">' + imageBlock(item) + '</div>' +
      '<div class="product-detail-info">' +
        '<span class="product-detail-brand">' + item.brand + '</span>' +
        '<h1 class="product-detail-title">' + item.model + '</h1>' +
        '<div class="product-detail-price">' +
          '<span class="product-detail-price-label">PKR</span>' +
          '<span class="product-detail-price-value">' + priceFormatted + '</span>' +
        '</div>' +
        '<div class="product-detail-quick">' + quickPills(item) + '</div>' +
        '<div class="product-detail-ctas">' +
          '<a href="' + waUrl + '" ' +
             'target="_blank" rel="noopener noreferrer" ' +
             'class="btn btn-whatsapp">' +
            '<i data-lucide="message-circle"></i><span>Order on WhatsApp</span>' +
          '</a>' +
          '<a href="' + PHONE_TEL + '" class="btn btn-accent">' +
            '<i data-lucide="phone"></i><span>Call ' + PHONE_DISPLAY + '</span>' +
          '</a>' +
        '</div>' +
        '<ul class="product-detail-trust">' +
          '<li><i data-lucide="shield-check"></i><span>1-year warranty</span></li>' +
          '<li><i data-lucide="truck"></i><span>Nationwide delivery</span></li>' +
          '<li><i data-lucide="badge-check"></i><span>Tested before shipping</span></li>' +
        '</ul>' +
      '</div>';
    fragment.appendChild(grid);

    /* Full specs section */
    const specs = document.createElement('section');
    specs.className = 'product-detail-specs';
    specs.setAttribute('aria-labelledby', 'specs-heading');
    specs.innerHTML =
      '<h2 id="specs-heading">Full specification</h2>' +
      '<div class="spec-table">' + specRows(item) + '</div>';
    fragment.appendChild(specs);

    /* Related section — DOM-built, not innerHTML */
    if (related.length) {
      const relSection = document.createElement('section');
      relSection.className = 'related-section';
      relSection.setAttribute('aria-labelledby', 'related-heading');

      const h2 = document.createElement('h2');
      h2.className = 'related-title';
      h2.id = 'related-heading';
      h2.textContent = 'Related products';
      relSection.appendChild(h2);

      const row = document.createElement('div');
      row.className = 'row g-4';
      row.setAttribute('role', 'list');

      related.forEach(function (rel) {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
        col.appendChild(NS.ProductCard.render(rel));
        row.appendChild(col);
      });

      relSection.appendChild(row);
      fragment.appendChild(relSection);
    }

    return fragment;
  }

  function notFound() {
    return (
      '<div class="product-not-found">' +
        '<i data-lucide="package-x"></i>' +
        '<h1>Product not found</h1>' +
        '<p>The item you requested doesn\'t exist or was removed.</p>' +
        '<a href="' + r('pages/inventory.html') + '" class="btn btn-brand">' +
          '<i data-lucide="arrow-left"></i><span>Back to inventory</span>' +
        '</a>' +
      '</div>'
    );
  }

  async function init() {
    const host = document.getElementById('product-detail');
    if (!host) return;

    host.innerHTML =
      '<div class="product-loading" role="status" aria-live="polite">' +
        '<i data-lucide="loader-2"></i><span>Loading product\u2026</span>' +
      '</div>';
    NS.renderIcons?.(host);

    const { id, from } = readParams();

    try {
      sessionStorage.removeItem('itz.pendingProductId');
      sessionStorage.removeItem('itz.pendingProductFrom');
      sessionStorage.removeItem('itz.pendingProductAt');
    } catch (e) { /* ignore */ }

    let laptops = [];
    let pcs = {};
    try {
      [laptops, pcs] = await Promise.all([
        NS.Data.laptops().catch(() => []),
        NS.Data.pcs().catch(() => ({})),
      ]);
    } catch (err) {
      console.error('[IT Zone] Failed to load data:', err);
      host.innerHTML = notFound();
      NS.renderIcons?.(host);
      return;
    }

    const item = findItem(id, from, laptops, pcs);
    if (!item) {
      host.innerHTML = notFound();
      NS.renderIcons?.(host);
      document.title = 'Product not found \u2014 IT Zone Electronics';
      return;
    }

    document.title = item.brand + ' ' + item.model + ' \u2014 IT Zone Electronics';

    const related = findRelated(item, laptops, pcs);

    host.replaceChildren();
    host.appendChild(buildPage(item, related, from));
    NS.renderIcons?.(host);

    console.info('[IT Zone] Product loaded:', item.brand, item.model, '| Related:', related.length);
  }

  NS.productPage = { init: init };
})();