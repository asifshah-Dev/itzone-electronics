// assets/js/pages/home.js
/* ─────────────────────────────────────────────────────────
   Home page.
   Mounts hero + featured products (8 items).
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const FEATURED_COUNT = 8;

  function tagItem(item, subtype) {
    return Object.assign({}, item, {
      _type: subtype === 'laptop' ? 'laptop' : 'pc',
      _subtype: subtype,
    });
  }

  function pickFeatured(laptops, pcs) {
    const L = (laptops || []).map(i => tagItem(i, 'laptop'));
    const D = (pcs?.desktops || []).map(i => tagItem(i, 'desktop'));
    const T = (pcs?.tiny     || []).map(i => tagItem(i, 'tiny'));
    const M = (pcs?.monitors || []).map(i => tagItem(i, 'monitor'));

    const pick = [];
    pick.push(...L.slice(0, 5));
    if (D[0]) pick.push(D[0]);
    if (T[0]) pick.push(T[0]);
    if (M[0]) pick.push(M[0]);
    let i = 5;
    while (pick.length < FEATURED_COUNT && i < L.length) pick.push(L[i++]);
    return pick.slice(0, FEATURED_COUNT);
  }

  async function init() {
    NS.Hero?.mount();

    const gridHost = document.getElementById('featured-grid');
    if (!gridHost) return;

    gridHost.innerHTML =
      '<div class="product-loading" role="status" aria-live="polite">' +
        '<i data-lucide="loader-2"></i><span>Loading featured products\u2026</span>' +
      '</div>';
    NS.renderIcons?.(gridHost);

    if (!NS.ProductCard || typeof NS.ProductCard.render !== 'function') {
      console.error('[IT Zone] Home: ProductCard module missing.');
      gridHost.innerHTML = '';
      return;
    }

    try {
      const [laptops, pcs] = await Promise.all([
        NS.Data.laptops().catch(() => []),
        NS.Data.pcs().catch(() => ({})),
      ]);

      const featured = pickFeatured(laptops, pcs);
      if (!featured.length) {
        gridHost.innerHTML =
          '<div class="product-empty" role="status">' +
            '<i data-lucide="inbox"></i>' +
            '<p>No products available.</p>' +
          '</div>';
        NS.renderIcons?.(gridHost);
        return;
      }

      gridHost.replaceChildren(
        ...featured.map(item => {
          const wrap = document.createElement('div');
          wrap.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
          wrap.appendChild(NS.ProductCard.render(item));
          return wrap;
        })
      );
      NS.renderIcons?.(gridHost);
      console.info('[IT Zone] Rendered ' + featured.length + ' featured products.');
    } catch (err) {
      console.error('[IT Zone] Failed to load featured:', err);
      gridHost.innerHTML =
        '<div class="product-empty" role="alert">' +
          '<i data-lucide="alert-circle"></i>' +
          '<p>Could not load featured products.</p>' +
        '</div>';
      NS.renderIcons?.(gridHost);
    }
  }

  NS.homePage = { init };
})();