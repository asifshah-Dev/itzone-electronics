// assets/js/pages/pcs.page.js
/* ─────────────────────────────────────────────────────────
   PCs & Monitors page.
   Fetches /data/pcs.json (desktops, tiny, monitors),
   flattens, adds a category tag, filters, renders.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const CATEGORIES = [
    { id: 'all',      label: 'All' },
    { id: 'desktop',  label: 'Desktops' },
    { id: 'tiny',     label: 'Tiny PCs' },
    { id: 'monitor',  label: 'Monitors' },
  ];

  let allItems = [];

  /* ── Flatten the nested JSON into one array ───────────── */
  function flatten(data) {
    const out = [];

    (data.desktops || []).forEach(function (item) {
      out.push(Object.assign({}, item, { _category: 'desktop' }));
    });
    (data.tiny || []).forEach(function (item) {
      out.push(Object.assign({}, item, { _category: 'tiny' }));
    });
    (data.monitors || []).forEach(function (item) {
      out.push(Object.assign({}, item, { _category: 'monitor' }));
    });

    return out;
  }

  /* ── Filter by category ───────────────────────────────── */
  function applyFilters(state) {
    const cat = state.category || 'all';
    if (cat === 'all') return allItems;
    return allItems.filter(function (item) { return item._category === cat; });
  }

  /* ── Count display ────────────────────────────────────── */
  function updateCount(visible, total) {
    const el = document.getElementById('pcs-count');
    if (!el) return;
    el.textContent = visible === total
      ? total + ' machines · tested, warranted, priced fairly'
      : visible + ' of ' + total + ' machines shown';
  }

  /* ── Category tabs ────────────────────────────────────── */
  function renderTabs(host, state, onChange) {
    host.innerHTML = CATEGORIES.map(function (c) {
      const active = state.category === c.id;
      return (
        '<button type="button" class="filter-btn' + (active ? ' is-active' : '') + '"' +
        ' data-filter="' + c.id + '"' +
        ' aria-pressed="' + (active ? 'true' : 'false') + '">' +
        c.label +
        '</button>'
      );
    }).join('');

    host.addEventListener('click', function (e) {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      host.querySelectorAll('.filter-btn').forEach(function (b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      onChange(btn.dataset.filter);
    });
  }

  /* ── Init ─────────────────────────────────────────────── */
  async function init() {
    const gridHost = document.getElementById('pcs-grid');
    const tabsHost = document.getElementById('pcs-tabs');

    if (!gridHost) return;

    /* Loading state */
    gridHost.innerHTML =
      '<div class="product-loading" role="status" aria-live="polite">' +
        '<i data-lucide="loader-2"></i>' +
        '<span>Loading PCs and monitors…</span>' +
      '</div>';
    NS.renderIcons?.(gridHost);

    /* Fetch */
    try {
      const data = await NS.Data.pcs();
      allItems = flatten(data);
    } catch (err) {
      console.error('[IT Zone] Failed to load PCs:', err);
      gridHost.innerHTML =
        '<div class="product-empty" role="alert">' +
          '<i data-lucide="alert-circle"></i>' +
          '<p>Could not load PCs &amp; monitors. Please refresh.</p>' +
        '</div>';
      NS.renderIcons?.(gridHost);
      return;
    }

    /* State */
    const state = { category: 'all' };

    /* Grid + tabs */
    const grid = NS.ProductGrid.mount(gridHost);

    function render() {
      const visible = applyFilters(state);
      grid.render(visible);
      updateCount(visible.length, allItems.length);
    }

    if (tabsHost) {
      renderTabs(tabsHost, state, function (cat) {
        state.category = cat;
        render();
      });
    }

    /* Add to cart — event delegation */
    gridHost.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action="add-to-cart"]');
      if (!btn) return;
      const card = btn.closest('[data-id]');
      if (!card) return;
      document.dispatchEvent(new CustomEvent('cart:add', {
        detail: { id: card.dataset.id }
      }));
    });

    /* First render */
    render();
    console.info('[IT Zone] Loaded ' + allItems.length + ' PCs & monitors.');
  }

  NS.pcsPage = { init: init };
})();