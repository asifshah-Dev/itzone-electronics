// assets/js/pages/product.page.js
/* ─────────────────────────────────────────────────────────
   Product detail page.
   Shows image gallery (3 images + thumbnails),
   full spec table, and a features badges section.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const PHONE_DISPLAY = '03265974741';
  const PHONE_TEL     = 'tel:+923265974741';

  function whatsappSvg(size) {
    const s = size || 18;
    return (
      '<svg class="wa-glyph" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
        '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />' +
      '</svg>'
    );
  }

  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function r(href) {
    if (href.startsWith('#')) return isInPagesDir() ? `../index.html${href}` : href;
    if (/^https?:|^tel:|^mailto:/.test(href)) return href;
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
        }
      } catch (e) { /* ignore */ }
    }

    return { id: id, from: from || 'laptops' };
  }

  function findItem(id, from, laptops, pcs) {
    if (!id) return null;
    if (from === 'pcs') {
      const all = []
        .concat(pcs && pcs.desktops || [])
        .concat(pcs && pcs.tiny     || [])
        .concat(pcs && pcs.monitors || []);
      return all.find(function (x) { return String(x.id) === String(id); }) || null;
    }
    return (laptops || []).find(function (x) { return String(x.id) === String(id); }) || null;
  }

  function findRelated(item, laptops, pcs) {
    if (!item) return [];
    const fromPC = /^(pc-|mon-)/.test(item.id);
    const pool = fromPC
      ? [].concat(pcs && pcs.desktops || [], pcs && pcs.tiny || [], pcs && pcs.monitors || [])
      : (laptops || []).slice();

    const price = Number(item.price) || 0;
    return pool
      .filter(function (x) { return String(x.id) !== String(item.id); })
      .sort(function (a, b) {
        const aBrand = a.brand === item.brand ? 1 : 0;
        const bBrand = b.brand === item.brand ? 1 : 0;
        if (aBrand !== bBrand) return bBrand - aBrand;
        return Math.abs(Number(a.price) - price) - Math.abs(Number(b.price) - price);
      })
      .slice(0, 4);
  }

  /* ✅ Get all images (array or single) */
  function imagesOf(item) {
    if (Array.isArray(item.images) && item.images.length) {
      return item.images.map(r);
    }
    if (item.image) return [r(item.image)];
    return [];
  }

  /* ✅ Gallery with main image + thumbnails */
  function imageGallery(item) {
    const imgs = imagesOf(item);
    const icon = item.resolution ? 'monitor'
               : item.hdd ? 'cpu'
               : 'laptop';

    if (!imgs.length) {
      return '<div class="product-detail-image"><i data-lucide="' + icon + '"></i></div>';
    }

    const main = imgs[0];

    const thumbs = imgs.length > 1
      ? '<div class="pd-thumbs" role="tablist">' +
          imgs.map(function (src, i) {
            return '<button type="button" class="pd-thumb' + (i === 0 ? ' is-active' : '') + '"' +
                     ' data-src="' + esc(src) + '"' +
                     ' aria-label="Image ' + (i + 1) + ' of ' + imgs.length + '">' +
                     '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async">' +
                   '</button>';
          }).join('') +
        '</div>'
      : '';

    return (
      '<div class="product-detail-image-wrap">' +
        '<div class="product-detail-image">' +
          '<img id="pd-main-img" src="' + esc(main) + '" alt="' +
            esc(item.brand + ' ' + item.model) + '" ' +
            'loading="eager" decoding="async">' +
        '</div>' +
        thumbs +
      '</div>'
    );
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
    if (item.screen)     rows.push(['Screen size', item.screen]);
    if (item.resolution) rows.push(['Resolution', item.resolution]);
    if (item.size)       rows.push(['Size', item.size]);
    if (item.extras)     rows.push(['Notes', item.extras]);
    rows.push(['Condition', 'Certified refurbished \u00b7 Tested']);
    rows.push(['Warranty', '1 year']);
    rows.push(['Delivery', 'Nationwide (2\u20134 business days)']);

    return rows.map(function (row) {
      return '<div class="spec-row">' +
        '<span class="spec-key">' + esc(row[0]) + '</span>' +
        '<span class="spec-value">' + esc(row[1]) + '</span>' +
      '</div>';
    }).join('');
  }

  function quickPills(item) {
    const pills = [];
    if (item.cpu && item.gen) pills.push({ icon: 'cpu',          text: item.cpu + ' ' + item.gen + ' Gen' });
    else if (item.cpu)        pills.push({ icon: 'cpu',          text: item.cpu });
    if (item.ram)             pills.push({ icon: 'memory-stick', text: item.ram + 'GB RAM' });
    if (item.ssd)             pills.push({ icon: 'hard-drive',   text: item.ssd + 'GB SSD' });
    if (item.hdd)             pills.push({ icon: 'hard-drive',   text: item.hdd });
    if (item.gpu)             pills.push({ icon: 'zap',          text: item.gpu });
    if (item.screen)          pills.push({ icon: 'monitor',      text: item.screen });
    if (item.resolution)      pills.push({ icon: 'monitor',      text: item.resolution });
    if (item.size)            pills.push({ icon: 'maximize',     text: item.size });

    return pills.map(function (p) {
      return '<span class="product-pill"><i data-lucide="' + p.icon + '"></i>' + esc(p.text) + '</span>';
    }).join('');
  }

  /* ✅ Feature badges with icons */
  function featureBadges(item) {
    if (!Array.isArray(item.features) || !item.features.length) return '';

    const iconFor = function (feature) {
      const f = feature.toLowerCase();
      if (f.indexOf('face unlock') !== -1)     return 'scan-face';
      if (f.indexOf('fingerprint') !== -1)     return 'fingerprint';
      if (f.indexOf('backlight') !== -1)       return 'lightbulb';
      if (f.indexOf('type-c') !== -1)          return 'plug';
      if (f.indexOf('numeric') !== -1)         return 'calculator';
      if (f.indexOf('light weight') !== -1)    return 'feather';
      if (f.indexOf('4k') !== -1)              return 'monitor-play';
      if (f.indexOf('workstation') !== -1)     return 'cpu';
      if (f.indexOf('graphics') !== -1)        return 'zap';
      if (f.indexOf('warranty') !== -1)        return 'shield-check';
      return 'check-circle';
    };

    return (
      '<div class="product-features">' +
        '<h2 class="product-features-title">Features</h2>' +
        '<ul class="product-features-list">' +
          item.features.map(function (f) {
            return '<li class="product-feature">' +
              '<i data-lucide="' + iconFor(f) + '"></i>' +
              '<span>' + esc(f) + '</span>' +
            '</li>';
          }).join('') +
        '</ul>' +
      '</div>'
    );
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
        '<span class="current">' + esc(item.brand) + ' ' + esc(item.model) + '</span>' +
      '</nav>'
    );
  }

  function buildPage(item, related, from) {
    const fragment = document.createDocumentFragment();

    const bc = document.createElement('div');
    bc.innerHTML = breadcrumb(item, from);
    fragment.appendChild(bc.firstElementChild);

    const priceFormatted = new Intl.NumberFormat('en-PK').format(item.price);
    const waUrl = NS.WhatsApp.productDetailUrl(item);

    const grid = document.createElement('div');
    grid.className = 'product-detail-grid';
    grid.innerHTML =
      imageGallery(item) +
      '<div class="product-detail-info">' +
        '<span class="product-detail-brand">' + esc(item.brand) + '</span>' +
        '<h1 class="product-detail-title">' + esc(item.model) + '</h1>' +
        '<div class="product-detail-price">' +
          '<span class="product-detail-price-label">PKR</span>' +
          '<span class="product-detail-price-value">' + priceFormatted + '</span>' +
        '</div>' +
        '<div class="product-detail-quick">' + quickPills(item) + '</div>' +
        featureBadges(item) +
        '<div class="product-detail-ctas">' +
          '<a href="' + waUrl + '" ' +
             'data-cursor="Order" ' +
             'target="_blank" rel="noopener noreferrer" ' +
             'class="btn btn-whatsapp">' +
            whatsappSvg(18) +
            '<span>Order on WhatsApp</span>' +
          '</a>' +
          '<a href="' + PHONE_TEL + '" ' +
             'data-cursor="Call" ' +
             'class="btn btn-accent">' +
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

    const specs = document.createElement('section');
    specs.className = 'product-detail-specs';
    specs.setAttribute('aria-labelledby', 'specs-heading');
    specs.innerHTML =
      '<h2 id="specs-heading">Full specification</h2>' +
      '<div class="spec-table">' + specRows(item) + '</div>';
    fragment.appendChild(specs);

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

    const params = readParams();
    const id = params.id;
    const from = params.from;

    try {
      sessionStorage.removeItem('itz.pendingProductId');
      sessionStorage.removeItem('itz.pendingProductFrom');
      sessionStorage.removeItem('itz.pendingProductAt');
    } catch (e) { /* ignore */ }

    let laptops = [];
    let pcs = {};
    try {
      const results = await Promise.all([
        NS.Data.laptops().catch(function () { return []; }),
        NS.Data.pcs().catch(function () { return {}; }),
      ]);
      laptops = results[0];
      pcs = results[1];
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

    /* ✅ Thumbnail click → swap main image */
    host.addEventListener('click', function (e) {
      const thumb = e.target.closest('.pd-thumb');
      if (!thumb) return;
      const main = host.querySelector('#pd-main-img');
      if (!main) return;
      main.src = thumb.dataset.src;
      host.querySelectorAll('.pd-thumb').forEach(function (t) {
        t.classList.toggle('is-active', t === thumb);
      });
    });

    console.info('[IT Zone] Product loaded:', item.brand, item.model,
                 '| Images:', imagesOf(item).length,
                 '| Related:', related.length);
  }

  NS.productPage = { init: init };
})();