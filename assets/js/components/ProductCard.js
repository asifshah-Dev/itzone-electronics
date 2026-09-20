// assets/js/components/ProductCard.js
/* ─────────────────────────────────────────────────────────
   Product card.
   Click-through + WhatsApp "Order" button.
   Bulletproof: safe template strings, defensive fallbacks.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const NS = (window.ITZone = window.ITZone || {});

  console.info('[IT Zone] ProductCard: booting...');

  function isInPagesDir() {
    return /\/pages\//.test(window.location.pathname);
  }

  function r(href) {
    if (/^https?:/.test(href)) return href;
    if (isInPagesDir()) {
      return href.indexOf('pages/') === 0 ? href.replace('pages/', '') : '../' + href;
    }
    return href;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fallbackWaUrl(item) {
    const lines = [
      'Hi IT Zone! I want to order:',
      '',
      '\u2022 ' + item.brand + ' ' + item.model,
      '\u2022 Price: PKR ' + new Intl.NumberFormat('en-PK').format(item.price),
      '',
      'Please confirm availability and delivery.',
    ];
    return 'https://wa.me/923265974741?text=' + encodeURIComponent(lines.join('\n'));
  }

  function waUrl(item) {
    try {
      if (NS.WhatsApp && typeof NS.WhatsApp.productUrl === 'function') {
        return NS.WhatsApp.productUrl(item);
      }
    } catch (e) {
      console.warn('[IT Zone] ProductCard: WhatsApp helper threw.', e);
    }
    return fallbackWaUrl(item);
  }

  function specs(item) {
    const rows = [];
    if (item.cpu && item.gen)  rows.push({ icon: 'cpu',           text: item.cpu + ' ' + item.gen + ' Gen' });
    else if (item.cpu)         rows.push({ icon: 'cpu',           text: item.cpu });
    if (item.ram)              rows.push({ icon: 'memory-stick',  text: item.ram + 'GB RAM' });
    if (item.ssd)              rows.push({ icon: 'hard-drive',    text: item.ssd + 'GB SSD' });
    if (item.hdd)              rows.push({ icon: 'hard-drive',    text: item.hdd });
    if (item.gpu)              rows.push({ icon: 'zap',           text: item.gpu });
    if (item.resolution)       rows.push({ icon: 'monitor',       text: item.resolution });
    if (item.size)             rows.push({ icon: 'maximize',      text: item.size });
    if (item.extras)           rows.push({ icon: 'zap',           text: item.extras });
    return rows;
  }

  function categoryIcon(item) {
    if (item._subtype === 'monitor' || item.resolution) return 'monitor';
    if (item._subtype === 'tiny')    return 'box';
    if (item._subtype === 'desktop') return 'cpu';
    return 'laptop';
  }

  function imageBlock(item) {
    const src = item.image || '';
    if (src) {
      return '<div class="product-image">' +
        '<img src="' + esc(src) + '" alt="' + esc(item.brand + ' ' + item.model) + '" ' +
             'loading="lazy" decoding="async" width="400" height="300">' +
      '</div>';
    }
    return '<div class="product-image product-image--placeholder" aria-hidden="true">' +
      '<i data-lucide="' + categoryIcon(item) + '"></i>' +
    '</div>';
  }

  function productUrl(item) {
    const id = encodeURIComponent(item.id);
    const from = item._subtype === 'laptop' || !item._subtype ? 'laptops' : 'pcs';
    return r('pages/product.html') + '?id=' + id + '&from=' + from;
  }

  function template(item) {
    const specRows = specs(item).map(function (s) {
      return '<li><i data-lucide="' + s.icon + '"></i><span>' + esc(s.text) + '</span></li>';
    }).join('');

    const url = productUrl(item);
    const wa = waUrl(item);
    const brandSafe = esc(item.brand);
    const modelSafe = esc(item.model);
    const priceFormatted = new Intl.NumberFormat('en-PK').format(item.price);
    const from = item._subtype === 'laptop' || !item._subtype ? 'laptops' : 'pcs';

    return (
      '<article class="product-card" data-id="' + esc(item.id) + '" role="listitem">' +

        '<a class="product-link" href="' + url + '" ' +
           'data-cursor="View" ' +
           'data-product-id="' + esc(item.id) + '" ' +
           'data-product-from="' + from + '" ' +
           'aria-label="View ' + brandSafe + ' ' + modelSafe + '">' +

          imageBlock(item) +

          '<div class="product-card-body">' +
            '<header class="product-card-head">' +
              '<span class="product-brand">' + brandSafe + '</span>' +
              '<h3 class="product-model">' + modelSafe + '</h3>' +
            '</header>' +
            '<ul class="product-specs">' + specRows + '</ul>' +
          '</div>' +
        '</a>' +

        '<footer class="product-card-foot">' +
          '<div class="product-price">' +
            '<span class="product-price-label">PKR</span>' +
            '<span class="product-price-value">' + priceFormatted + '</span>' +
          '</div>' +
          '<a class="product-order-wa" ' +
             'href="' + wa + '" ' +
             'data-cursor="Order" ' +
             'target="_blank" rel="noopener noreferrer" ' +
             'aria-label="Order ' + brandSafe + ' ' + modelSafe + ' on WhatsApp">' +
            '<i data-lucide="message-circle"></i>' +
            '<span>Order</span>' +
          '</a>' +
        '</footer>' +

      '</article>'
    );
  }

  function render(item) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template(item).trim();
    return wrapper.firstElementChild;
  }

  /* Stash id on click for detail page recovery */
  document.addEventListener('click', function (e) {
    const link = e.target.closest && e.target.closest('.product-link');
    if (!link) return;
    const id = link.dataset.productId;
    const from = link.dataset.productFrom;
    if (!id) return;
    try {
      sessionStorage.setItem('itz.pendingProductId', id);
      sessionStorage.setItem('itz.pendingProductFrom', from || 'laptops');
      sessionStorage.setItem('itz.pendingProductAt', String(Date.now()));
    } catch (err) { /* ignore */ }
  }, true);

  NS.ProductCard = {
    render: render,
    formatPKR: function (n) { return 'PKR ' + new Intl.NumberFormat('en-PK').format(n); }
  };

  console.info('[IT Zone] ProductCard: loaded ✓ | WhatsApp helper:',
    (NS.WhatsApp && typeof NS.WhatsApp.productUrl === 'function') ? '✓' : '✗ (fallback)');
})();