// assets/js/pages/home.js
/* ─────────────────────────────────────────────────────────
   Home page.
   Mounts the hero + fetches laptops + PCs and renders the
   first N as "featured products" in #featured-grid.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const FEATURED_COUNT = 8;

  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function r(href) {
    if (href.startsWith('#')) return isInPagesDir() ? `../index.html${href}` : href;
    if (/^https?:|^tel:|^mailto:/.test(href)) return href;
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  function tagItem(item, subtype) {
    return Object.assign({}, item, {
      _type: subtype === 'laptop' ? 'laptop' : 'pc',
      _subtype: subtype
    });
  }

  function pickFeatured(laptops, pcs) {
    const taggedLaptops = (laptops || []).map(i => tagItem(i, 'laptop'));
    const taggedDesktops = (pcs?.desktops || []).map(i => tagItem(i, 'desktop'));
    const taggedTiny = (pcs?.tiny || []).map(i => tagItem(i, 'tiny'));
    const taggedMonitors = (pcs?.monitors || []).map(i => tagItem(i, 'monitor'));

    /* Hand-pick: 5 laptops + 1 desktop + 1 tiny + 1 monitor = 8 items */
    const pick = [];
    pick.push(...taggedLaptops.slice(0, 5));
    if (taggedDesktops[0]) pick.push(taggedDesktops[0]);
    if (taggedTiny[0])     pick.push(taggedTiny[0]);
    if (taggedMonitors[0]) pick.push(taggedMonitors[0]);

    /* If fewer than 8, pad with more laptops */
    let i = 5;
    while (pick.length < FEATURED_COUNT && i < taggedLaptops.length) {
      pick.push(taggedLaptops[i++]);
    }

    return pick.slice(0, FEATURED_COUNT);
  }

  async function init() {
    /* 1. Hero */
    NS.Hero?.mount();

    /* 2. Featured products */
    const gridHost = document.getElementById('featured-grid');
    if (!gridHost) {
      console.warn('[IT Zone] Home: no #featured-grid.');
      return;
    }

    gridHost.innerHTML =
      '<div class="product-loading" role="status" aria-live="polite">' +
        '<i data-lucide="loader-2"></i><span>Loading featured products…</span>' +
      '</div>';
    NS.renderIcons?.(gridHost);

    if (!NS.ProductCard || typeof NS.ProductCard.render !== 'function') {
      console.error('[IT Zone] Home: ProductCard module not loaded.');
      gridHost.innerHTML = '';
      return;
    }

    try {
      const [laptops, pcs] = await Promise.all([
        NS.Data.laptops().catch(() => []),
        NS.Data.pcs().catch(() => ({})),
      ]);
      console.log('[IT Zone] Home data — laptops:', laptops.length, '| pcs:', {
        desktops: (pcs?.desktops || []).length,
        tiny: (pcs?.tiny || []).length,
        monitors: (pcs?.monitors || []).length,
      });

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

      /* Add-to-cart delegation */
      if (gridHost.dataset.bound !== 'true') {
        gridHost.dataset.bound = 'true';
        gridHost.addEventListener('click', e => {
          const btn = e.target.closest('[data-action="add-to-cart"]');
          if (!btn) return;
          const card = btn.closest('[data-id]');
          if (!card) return;
          document.dispatchEvent(new CustomEvent('cart:add', {
            detail: { id: card.dataset.id }
          }));
        });
      }

      console.info('[IT Zone] Rendered ' + featured.length + ' featured products.');
    } catch (err) {
      console.error('[IT Zone] Failed to load featured products:', err);
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