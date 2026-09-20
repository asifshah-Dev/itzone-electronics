// assets/js/components/ProductGrid.js
/* ─────────────────────────────────────────────────────────
   Product grid.
   Renders a list of items, handles "add to cart" via
   event delegation, shows an empty state.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  function emptyState(message) {
    return `
      <div class="product-empty" role="status">
        <i data-lucide="search-x"></i>
        <p>${message}</p>
        <button type="button" class="btn btn-outline-brand" id="empty-reset">
          Clear filters
        </button>
      </div>
    `;
  }

  function mount(host) {
    if (!host) return null;

    /* ── Public API ─────────────────────────────────────── */
    return {
      render(items) {
        if (!items || items.length === 0) {
          host.innerHTML = emptyState('No laptops match your filters.');
          NS.renderIcons?.(host);
          return;
        }

        host.replaceChildren(
          ...items.map(item => NS.ProductCard.render(item))
        );
        NS.renderIcons?.(host);
      },

      on(eventName, handler) {
        host.addEventListener(eventName, handler);
      }
    };
  }

  NS.ProductGrid = { mount };
})();