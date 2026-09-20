// assets/js/pages/home.js
/* ─────────────────────────────────────────────────────────
   Home page.
   Mounts the hero, then fetches laptops and renders the
   first 4 featured items in #featured-grid.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const FEATURED_COUNT = 4;

  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }
  function r(href) {
    if (href.startsWith('#')) return isInPagesDir() ? `../index.html${href}` : href;
    if (/^https?:|^tel:|^mailto:/.test(href)) return href;
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  async function init() {
    // 1. Hero
    NS.Hero?.mount();

    // 2. Featured products
    const gridHost = document.getElementById('featured-grid');
    if (!gridHost) return;

    gridHost.innerHTML =
      '<div class="product-loading" role="status" aria-live="polite">' +
        '<i data-lucide="loader-2"></i>' +
        '<span>Loading featured laptops…</span>' +
      '</div>';
    NS.renderIcons?.(gridHost);

    try {
      const all = await NS.Data.laptops();
      const featured = all.slice(0, FEATURED_COUNT);

      if (!NS.ProductCard || typeof NS.ProductCard.render !== 'function') {
        console.error('[IT Zone] Home: ProductCard module missing.');
        gridHost.innerHTML = '';
        return;
      }

      gridHost.replaceChildren(
        ...featured.map(item => NS.ProductCard.render(item))
      );
      NS.renderIcons?.(gridHost);

      // 3. Add-to-cart delegation on the featured grid
      gridHost.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="add-to-cart"]');
        if (!btn) return;
        const card = btn.closest('[data-id]');
        if (!card) return;
        document.dispatchEvent(new CustomEvent('cart:add', {
          detail: { id: card.dataset.id }
        }));
      });

      console.info(`[IT Zone] Rendered ${featured.length} featured laptops.`);
    } catch (err) {
      console.error('[IT Zone] Failed to load featured laptops:', err);
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