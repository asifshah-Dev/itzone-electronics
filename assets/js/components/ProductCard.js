// assets/js/components/ProductCard.js
/* ─────────────────────────────────────────────────────────
   Product card — reads images[] array.
   Falls back to placeholder icon if no images.
   Equal-size cards: every image box has the same shape.
   Photos whose shape is close to the box shape are shown with
   object-fit: cover (no side white space); all others use
   contain (never cropped). See .is-fill in _product-card.css.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const NS = (window.ITZone = window.ITZone || {});

  /* How close (as a ratio) the photo shape must be to the box shape
     to use "cover". 0.15 = within 15%  →  crop is at most ~13%. */
  const FILL_TOLERANCE = 0.15;

  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function r(href) {
    if (/^https?:/.test(href)) return href;
    if (isInPagesDir()) {
      return href.indexOf('pages/') === 0 ? href.replace('pages/', '') : '../' + href;
    }
    return href;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Typical photo shape: measured from the real images, so every card
     image box (all the same size) matches most of your photos. */
  const seen = {};              // src -> width/height
  let boxRatio = 0;

  function median(list) {
    const a = list.slice().sort(function (x, y) { return x - y; });
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  function updateBoxRatio() {
    const list = Object.keys(seen).map(function (k) { return seen[k]; });
    if (!list.length) return;
    let m = median(list);
    m = Math.min(1.6, Math.max(0.75, m));     // keep cards sensible
    m = Math.round(m * 100) / 100;
    if (Math.abs(m - boxRatio) < 0.02) return;
    boxRatio = m;
    document.documentElement.style.setProperty('--pi-ratio', String(m));
    requestAnimationFrame(function () {
      document.querySelectorAll('.product-image img').forEach(function (img) { fit(img, true); });
    });
  }

  /* Decide cover vs contain for one <img> */
  function fit(img, skipMeasure) {
    try {
      if (!img || !img.naturalWidth || !img.naturalHeight) return;
      const box = img.parentNode;
      if (!box) return;
      const imgRatio = img.naturalWidth / img.naturalHeight;

      if (!skipMeasure && img.classList.contains('pi-primary')) {
        const key = img.currentSrc || img.src;
        if (!(key in seen)) { seen[key] = imgRatio; updateBoxRatio(); }
      }

      const bw = box.clientWidth, bh = box.clientHeight;
      if (!bw || !bh) return;
      const diff = Math.abs(imgRatio / (bw / bh) - 1);
      img.classList.toggle('is-fill', diff <= FILL_TOLERANCE);
    } catch (e) { /* ignore */ }
  }

  function whatsappSvg(size) {
    const s = size || 16;
    return (
      '<svg class="wa-glyph" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
        '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />' +
      '</svg>'
    );
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

  function imagesOf(item) {
    if (Array.isArray(item.images) && item.images.length) {
      return item.images.map(r);
    }
    if (item.image) return [r(item.image)];
    return [];
  }

  function imageBlock(item) {
    const imgs = imagesOf(item);
    const icon = categoryIcon(item);
    const alt = esc(item.brand + ' ' + item.model);

    let subtypeClass = ' product-image--laptop';
    if (item._subtype === 'tiny')    subtypeClass = ' product-image--tiny';
    if (item._subtype === 'desktop') subtypeClass = ' product-image--desktop';
    if (item._subtype === 'monitor' || item.resolution) subtypeClass = ' product-image--monitor';

    if (!imgs.length) {
      return '<div class="product-image product-image--placeholder' + subtypeClass + '" aria-hidden="true">' +
        '<i data-lucide="' + icon + '"></i>' +
      '</div>';
    }

    const primary = imgs[0];
    const hover = imgs[1] || '';

    const onload = 'onload="if(window.ITZone&amp;&amp;ITZone.ProductCard)ITZone.ProductCard.fit(this);" ';

    const primaryImg =
      '<img class="pi-primary" src="' + esc(primary) + '" alt="' + alt + '" ' +
           'loading="lazy" decoding="async" ' + onload +
           'onerror="this.onerror=null;this.parentNode.classList.add(\'product-image--placeholder\');this.parentNode.innerHTML=\'<i data-lucide=&quot;' + icon + '&quot;></i>\';if(window.lucide)window.lucide.createIcons();">';

    const hoverImg = hover
      ? '<img class="pi-hover" src="' + esc(hover) + '" alt="" ' +
             'loading="lazy" decoding="async" ' + onload +
             'onerror="this.style.display=\'none\';">'
      : '';

    return '<div class="product-image' + subtypeClass + (hover ? ' has-hover' : '') + '">' +
      primaryImg + hoverImg +
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
            whatsappSvg(16) +
            '<span>Order</span>' +
          '</a>' +
        '</footer>' +

      '</article>'
    );
  }

  function render(item) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template(item).trim();
    const el = wrapper.firstElementChild;
    /* Cached images may finish loading before onload is attached */
    el.querySelectorAll('.product-image img').forEach(function (img) {
      if (img.complete) fit(img);
    });
    return el;
  }

  /* Re-check on resize (box size can change between breakpoints) */
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      document.querySelectorAll('.product-image img').forEach(function (img) { fit(img, true); });
    }, 150);
  });

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
    fit: fit,
    formatPKR: function (n) { return 'PKR ' + new Intl.NumberFormat('en-PK').format(n); }
  };
})();