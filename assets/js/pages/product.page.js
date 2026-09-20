// assets/js/pages/product.page.js
/* ─────────────────────────────────────────────────────────
   Product detail page.
   URL: /pages/product.html?id=<id>&from=laptops|pcs
   Fallback: sessionStorage (survives query string loss).
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const PHONE_DISPLAY = '03265974741';
  const PHONE_TEL     = 'tel:+923265974741';
  const WHATSAPP_TEL  = 'https://wa.me/923265974741';

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

    /* Fallback: recover from sessionStorage if URL has no id */
    if (!id) {
      try {
        const pendingId = sessionStorage.getItem('itz.pendingProductId');
        const pendingFrom = sessionStorage.getItem('itz.pendingProductFrom');
        const at = Number(sessionStorage.getItem('itz.pendingProductAt') || 0);
        if (pendingId && (Date.now() - at) < 15000) {
          id   = pendingId;
          from = from || pendingFrom || 'laptops';
          console.info('[IT Zone] Recovered product from sessionStorage:', id, '|', from);
          /* Restore into URL */
          const url = new URL(window.location.href);
          url.searchParams.set('id', id);
          url.searchParams.set('from', from);
          window.history.replaceState({}, '', url);
        }
      } catch (e) { /* ignore */ }
    }

    return {
      id,
      from: from || 'laptops',
    };
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
    const fromPC = item.id.startsWith('pc-') || item.id.startsWith('mon-');
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
    if (item.brand)       rows.push(['Brand', item.brand]);
    if (item.model)       rows.push(['Model', item.model]);
    if (item.cpu)         rows.push(['Processor', item.cpu + (item.gen ? ' ' + item.gen + ' Gen' : '')]);
    else if (item.gen)    rows.push(['Generation', item.gen]);
    if (item.ram)         rows.push(['RAM', item.ram + ' GB']);
    if (item.ssd)         rows.push(['Storage (SSD)', item.ssd + ' GB SSD']);
    if (item.hdd)         rows.push(['Storage', item.hdd]);
    if (item.gpu)         rows.push(['Graphics', item.gpu]);
    if (item.resolution)  rows.push(['Resolution', item.resolution]);
    if (item.size)        rows.push(['Size', item.size]);
    if (item.extras)      rows.push(['Notes', item.extras]);
    rows.push(['Condition', 'Certified refurbished · Tested']);
    rows.push(['Warranty', '1 year']);
    rows.push(['Delivery', 'Nationwide (2–4 business days)']);
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

  function template(item, related, from) {
    const priceFormatted = new Intl.NumberFormat('en-PK').format(item.price);
    const relatedCards = related.map(r => {
      const wrapper = document.createElement('div');
      wrapper.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
      wrapper.innerHTML = NS.ProductCard.render(r);
      return wrapper.outerHTML;
    }).join('');

    return (
      breadcrumb(item, from) +

      '<div class="product-detail-grid">' +

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
            '<button type="button" class="btn btn-brand" id="detail-add-to-cart" ' +
                    'data-id="' + item.id + '">' +
              '<i data-lucide="shopping-bag"></i><span>Add to cart</span>' +
            '</button>' +
            '<a href="' + PHONE_TEL + '" class="btn btn-accent">' +
              '<i data-lucide="phone"></i><span>Call ' + PHONE_DISPLAY + '</span>' +
            '</a>' +
            '<a href="' + WHATSAPP_TEL + '" target="_blank" rel="noopener noreferrer" class="btn btn-outline-brand">' +
              '<i data-lucide="message-circle"></i><span>WhatsApp</span>' +
            '</a>' +
          '</div>' +

          '<ul class="product-detail-trust">' +
            '<li><i data-lucide="shield-check"></i><span>1-year warranty</span></li>' +
            '<li><i data-lucide="truck"></i><span>Nationwide delivery</span></li>' +
            '<li><i data-lucide="badge-check"></i><span>Tested before shipping</span></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +

      '<section class="product-detail-specs" aria-labelledby="specs-heading">' +
        '<h2 id="specs-heading">Full specification</h2>' +
        '<div class="spec-table">' + specRows(item) + '</div>' +
      '</section>' +

      (related.length
        ? '<section class="related-section" aria-labelledby="related-heading">' +
            '<h2 class="related-title" id="related-heading">Related products</h2>' +
            '<div class="row g-4" role="list">' + relatedCards + '</div>' +
          '</section>'
        : '')
    );
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
        '<i data-lucide="loader-2"></i><span>Loading product…</span>' +
      '</div>';
    NS.renderIcons?.(host);

    const { id, from } = readParams();

    console.group('[IT Zone] Product page boot');
    console.log('URL:', window.location.href);
    console.log('search:', window.location.search);
    console.log('id:', JSON.stringify(id));
    console.log('from:', JSON.stringify(from));

    /* Clear pending state so it doesn't leak to next navigation */
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
      console.log('Data loaded — laptops:', laptops.length, '| pcs keys:', Object.keys(pcs));
    } catch (err) {
      console.error('[IT Zone] Failed to load data:', err);
      host.innerHTML = notFound();
      NS.renderIcons?.(host);
      console.groupEnd();
      return;
    }

    const item = findItem(id, from, laptops, pcs);
    console.log('Item found:', item ? (item.brand + ' ' + item.model) : 'NONE');
    console.groupEnd();

    if (!item) {
      host.innerHTML = notFound();
      NS.renderIcons?.(host);
      document.title = 'Product not found — IT Zone Electronics';
      return;
    }

    document.title = item.brand + ' ' + item.model + ' — IT Zone Electronics';

    const related = findRelated(item, laptops, pcs);
    host.innerHTML = template(item, related, from);
    NS.renderIcons?.(host);

    host.addEventListener('click', e => {
      const btn = e.target.closest('#detail-add-to-cart');
      if (!btn) return;
      document.dispatchEvent(new CustomEvent('cart:add', {
        detail: { id: btn.dataset.id }
      }));
    });

    host.addEventListener('click', e => {
      const btn = e.target.closest('[data-action="add-to-cart"]');
      if (!btn) return;
      const card = btn.closest('[data-id]');
      if (!card) return;
      document.dispatchEvent(new CustomEvent('cart:add', {
        detail: { id: card.dataset.id }
      }));
    });

    console.info('[IT Zone] Product loaded:', item.brand, item.model, '| Related:', related.length);
  }

  NS.productPage = { init };
})();