// assets/js/components/ProductCard.js
/* ─────────────────────────────────────────────────────────
   Product card — with image slot.
   Pure template function. No DOM side-effects.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const NS = (window.ITZone = window.ITZone || {});

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

  /* ── Category → icon (for the placeholder) ────────────── */
  function categoryIcon(item) {
    if (item._category === 'monitor') return 'monitor';
    if (item._category === 'tiny')    return 'box';
    if (item._category === 'desktop') return 'cpu';
    return 'laptop';
  }

  /* ── Image block: <img> if image, else inline SVG icon ── */
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

  function template(item) {
    const specRows = specs(item).map(function (s) {
      return '<li><i data-lucide="' + s.icon + '"></i><span>' + s.text + '</span></li>';
    }).join('');

    return (
      '<article class="product-card"' +
      ' data-id="' + item.id + '"' +
      ' data-brand="' + item.brand + '"' +
      ' data-model="' + (item.model || '').toLowerCase() + '"' +
      ' data-gen="' + ((item.gen || '').toLowerCase()) + '"' +
      ' data-ram="' + item.ram + '"' +
      ' data-ssd="' + item.ssd + '"' +
      ' data-price="' + item.price + '"' +
      ' role="listitem">' +

        imageBlock(item) +

        '<div class="product-card-body">' +

          '<header class="product-card-head">' +
            '<span class="product-brand">' + item.brand + '</span>' +
            '<h3 class="product-model">' + item.model + '</h3>' +
          '</header>' +

          '<ul class="product-specs">' + specRows + '</ul>' +

          '<footer class="product-card-foot">' +
            '<div class="product-price">' +
              '<span class="product-price-label">PKR</span>' +
              '<span class="product-price-value">' + new Intl.NumberFormat('en-PK').format(item.price) + '</span>' +
            '</div>' +
            '<button type="button" class="product-add" data-action="add-to-cart" ' +
              'aria-label="Add ' + item.brand + ' ' + item.model + ' to cart">' +
              '<i data-lucide="shopping-bag"></i><span>Add</span>' +
            '</button>' +
          '</footer>' +

        '</div>' +
      '</article>'
    );
  }

  function render(item) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template(item).trim();
    return wrapper.firstElementChild;
  }

  NS.ProductCard = {
    render: render,
    formatPKR: formatPKR
  };
})();