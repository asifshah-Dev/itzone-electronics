// assets/js/components/ProductCard.js
/* ─────────────────────────────────────────────────────────
   Product card.
   Click-through to detail page.
   "Order" button opens WhatsApp with prefilled message.
   Defensive: falls back to a plain wa.me link if WhatsApp
   helper module hasn't loaded.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const NS = (window.ITZone = window.ITZone || {});

  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function r(href) {
    if (/^https?:/.test(href)) return href;
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  /* Fallback WhatsApp URL builder in case whatsapp.js isn't loaded */
  function fallbackWaUrl(item) {
    const msg = 'Hi IT Zone! I want to order:\n\n' +
                '\u2022 ' + item.brand + ' ' + item.model + '\n' +
                '\u2022 Price: PKR ' + new Intl.NumberFormat('en-PK').format(item.price) + '\n\n' +
                'Please confirm availability and delivery.';
    return 'https://wa.me/923265974741?text=' + encodeURIComponent(msg);
  }

  function waUrl(item) {
    if (NS.WhatsApp && typeof NS.WhatsApp.productUrl === 'function') {
      return NS.WhatsApp.productUrl(item);
    }
    if (!NS.__warnedMissingWhatsApp) {
      console.warn('[IT Zone] ProductCard: WhatsApp helper missing — using fallback URL. ' +
                   'Add assets/js/core/whatsapp.js before ProductCard.js in your HTML.');
      NS.__warnedMissingWhatsApp = true;
    }
    return fallbackWaUrl(item);
  }

  function formatPKR(n) {
    return 'PKR ' + new Intl.NumberFormat('en-PK').format(n);
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
    if (item._subtype === 'tiny') return 'box';
    if (item._subtype === 'desktop') return 'cpu';
    return 'laptop';
  }

  function imageBlock(item) {
    const src = item.image || '';
    if (src) {
      return (
        '<div class="product-image">' +
          '<img src="' + src + '" alt="' + item.brand + ' ' + item.model + '" ' +
               'loading="lazy" decoding="async" width="400" height="300">' +
        '</div>'
      );
    }
    return (
      '<div class="product-image product-image--placeholder" aria-hidden="true">' +
        '<i data-lucide="' + categoryIcon(item) + '"></i>' +
      '</div>'
    );
  }

  function productUrl(item) {
    const id = encodeURIComponent(item.id);
    const from = item._subtype === 'laptop' || !item._subtype ? 'laptops' : 'pcs';
    return r('pages/product.html') + '?id=' + id + '&from=' + from;
  }

  function template(item) {
    const specRows = specs(item).map(function (s) {
      return '<li><i data-lucide="' + s.icon + '"></i><span>' + s.text + '</span></li>';
    }).join('');

    const url = productUrl(item);
    const wa = waUrl(item);

    return (
      '<article class="product-card" data-id="' + item.id + '" role="listitem">' +

        '<a class="product-link" href="' + url + '" ' +
           'data-product-id="' + item.id + '" ' +
           'data-product-from="' +
             (item._subtype === 'laptop' || !item._subtype ? 'laptops' : 'pcs') + '" ' +
           'aria-label="View ' + item.brand + ' ' + item.model + '">' +

          imageBlock(item) +

          '<div class="product-card-body">' +
            '<header class="product-card-head">' +
              '<span class="product-brand">' + item.brand + '</span>' +
              '<h3 class="product-model">' + item.model + '</h3>' +
            '</header>' +
            '<ul class="product-specs">' + specRows + '</ul>' +
          '</div>' +
        '</a>' +

        '<footer class="product-card-foot">' +
          '<div class="product-price">' +
            '<span class="product-price-label">PKR</span>' +
            '<span class="product-price-value">' +
              new Intl.NumberFormat('en-PK').format(item.price) +
            '</span>' +
          '</div>' +
          '<a class="product-order-wa" ' +
             'href="' + wa + '" ' +
             'target="_blank" ' +
             'rel="noopener noreferrer" ' +
             'aria-label="Order ' + item.brand + ' ' + item.model + ' on WhatsApp">' +
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

  /* Stash id when a `.product-link` is clicked */
  document.addEventListener('click', function (e) {
    const link = e.target.closest('.product-link');
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
    formatPKR: formatPKR
  };

  console.info('[IT Zone] ProductCard loaded. WhatsApp helper:',
    (NS.WhatsApp && typeof NS.WhatsApp.productUrl === 'function') ? '✓' : '✗ (will use fallback)');
})();