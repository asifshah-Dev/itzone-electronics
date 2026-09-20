// assets/js/components/ProductGrid.js
/* ─────────────────────────────────────────────────────────
   Product grid.
   Renders a list of items via ProductCard.
   Defensive: logs a clear error if ProductCard isn't loaded.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const NS = (window.ITZone = window.ITZone || {});

  function emptyState(message) {
    return (
      '<div class="product-empty" role="status">' +
        '<i data-lucide="search-x"></i>' +
        '<p>' + message + '</p>' +
        '<button type="button" class="btn btn-outline-brand" id="empty-reset">' +
          'Clear filters' +
        '</button>' +
      '</div>'
    );
  }

  function mount(host) {
    if (!host) {
      console.error('[IT Zone] ProductGrid: no host element.');
      return null;
    }

    return {
      render: function (items) {
        /* ── Guard: is ProductCard loaded? ─────────────── */
        if (!NS.ProductCard || typeof NS.ProductCard.render !== 'function') {
          console.error(
            '[IT Zone] ProductGrid: NS.ProductCard is missing.\n' +
            '  - Check that assets/js/components/ProductCard.js loaded\n' +
            '    WITHOUT errors before ProductGrid.js in the HTML.\n' +
            '  - Look above in the console for a syntax error in ProductCard.js.'
          );
          host.innerHTML = emptyState('Product card module failed to load.');
          NS.renderIcons?.(host);
          return;
        }

        if (!items || items.length === 0) {
          host.innerHTML = emptyState('No products match your filters.');
          NS.renderIcons?.(host);
          return;
        }

        try {
          const cards = items.map(function (item) {
            return NS.ProductCard.render(item);
          });
          host.replaceChildren.apply(host, cards);
          NS.renderIcons?.(host);
        } catch (err) {
          console.error('[IT Zone] ProductGrid: render failed.', err);
          host.innerHTML = emptyState('Could not render products.');
          NS.renderIcons?.(host);
        }
      },

      on: function (eventName, handler) {
        host.addEventListener(eventName, handler);
      }
    };
  }

  NS.ProductGrid = { mount: mount };
  console.info('[IT Zone] ProductGrid: loaded ✓');
})();