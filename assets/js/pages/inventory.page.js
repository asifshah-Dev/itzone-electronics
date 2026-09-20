 
// assets/js/pages/inventory.page.js
/* ─────────────────────────────────────────────────────────
   Laptops page controller.
   Fetches /data/laptops.json, holds filter + query state,
   renders grid, wires filters and search.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  let allItems = [];

  /* ── Apply filter + search ────────────────────────────── */
  function applyFilters(state) {
    const q = (state.query || '').trim().toLowerCase();
    const brand = state.brand || 'all';

    return allItems.filter(item => {
      if (brand !== 'all' && item.brand !== brand) return false;
      if (!q) return true;

      const haystack = [
        item.brand,
        item.model,
        item.cpu,
        item.gen,
        item.extras,
        `${item.ram}GB`,
        `${item.ssd}GB`,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }

  /* ── Count display ────────────────────────────────────── */
  function updateCount(visible, total) {
    const el = document.getElementById('inventory-count');
    if (!el) return;
    el.textContent = visible === total
      ? `${total} machines · tested, warranted, priced fairly`
      : `${visible} of ${total} machines match`;
  }

  async function init() {
    const gridHost   = document.getElementById('product-grid');
    const filtersHost = document.getElementById('product-filters');
    const searchHost  = document.getElementById('product-search');

    if (!gridHost) return;

    // Loading state
    gridHost.innerHTML = `
      <div class="product-loading" role="status" aria-live="polite">
        <i data-lucide="loader-2"></i>
        <span>Loading inventory…</span>
      </div>
    `;
    NS.renderIcons?.(gridHost);

    /* ── Fetch data ─────────────────────────────────────── */
    try {
      allItems = await NS.Data.laptops();
    } catch (err) {
      console.error('[IT Zone] Failed to load laptops:', err);
      gridHost.innerHTML = `
        <div class="product-empty" role="alert">
          <i data-lucide="alert-circle"></i>
          <p>Could not load inventory. Please refresh the page.</p>
        </div>
      `;
      NS.renderIcons?.(gridHost);
      return;
    }

    /* ── State ──────────────────────────────────────────── */
    const state = {
      brand: 'all',
      query: NS.SearchBar.readQueryFromURL(),
    };

    /* ── Grid ───────────────────────────────────────────── */
    const grid = NS.ProductGrid.mount(gridHost);

    /* ── Render pipeline ────────────────────────────────── */
    function render() {
      const visible = applyFilters(state);
      grid.render(visible);
      updateCount(visible.length, allItems.length);
    }

    /* ── Filters ────────────────────────────────────────── */
    NS.Filters.mount(filtersHost);
    document.addEventListener('filter:change', (e) => {
      state.brand = e.detail.brand;
      render();
    });

    /* ── Search ─────────────────────────────────────────── */
    NS.SearchBar.mount(searchHost, state.query);
    document.addEventListener('search:change', (e) => {
      state.query = e.detail.query;
      render();
    });

    /* ── Empty-state reset ──────────────────────────────── */
    gridHost.addEventListener('click', (e) => {
      if (e.target.closest('#empty-reset')) {
        state.brand = 'all';
        state.query = '';
        document.querySelectorAll('.filter-btn').forEach(b => {
          const isAll = b.dataset.filter === 'all';
          b.classList.toggle('is-active', isAll);
          b.setAttribute('aria-pressed', isAll ? 'true' : 'false');
        });
        const searchInput = document.getElementById('page-search');
        if (searchInput) searchInput.value = '';
        const navInput = document.getElementById('nav-search-input');
        if (navInput) navInput.value = '';
        render();
      }
    });

    /* ── Add to cart — event delegation ─────────────────── */
    gridHost.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="add-to-cart"]');
      if (!btn) return;
      const card = btn.closest('[data-id]');
      if (!card) return;
      document.dispatchEvent(new CustomEvent('cart:add', {
        detail: { id: card.dataset.id }
      }));
    });

    /* ── First render ───────────────────────────────────── */
    render();
    console.info(`[IT Zone] Loaded ${allItems.length} laptops.`);
  }

  NS.inventoryPage = { init };
})();