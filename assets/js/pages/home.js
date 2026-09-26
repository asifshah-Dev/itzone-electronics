// assets/js/pages/home.js
/* ─────────────────────────────────────────────────────────
   Home page controller.
   - Mounts hero
   - Fetches laptops + PCs
   - Shows ALL products in a grid
   - Type tabs: All / Laptops / PCs & Monitors
   - Sort + view toggle (same as inventory page)
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  let allItems = [];

  /* ── Tag items with subtype ─────────────────────────────── */
  function mergeAll(laptops, pcs) {
    const out = [];
    (laptops || []).forEach(function (i) {
      out.push(Object.assign({}, i, { _type: 'laptop', _subtype: 'laptop' }));
    });
    (pcs && pcs.desktops || []).forEach(function (i) {
      out.push(Object.assign({}, i, { _type: 'pc', _subtype: 'desktop' }));
    });
    (pcs && pcs.tiny || []).forEach(function (i) {
      out.push(Object.assign({}, i, { _type: 'pc', _subtype: 'tiny' }));
    });
    (pcs && pcs.monitors || []).forEach(function (i) {
      out.push(Object.assign({}, i, { _type: 'pc', _subtype: 'monitor' }));
    });
    return out;
  }

  /* ── Type tabs (same as inventory page) ─────────────────── */
  const TABS = [
    { id: 'all',    label: 'All' },
    { id: 'laptop', label: 'Laptops' },
    { id: 'pc',     label: 'PCs & Monitors' }
  ];

  function mountTabs(host, state, onChange) {
    if (!host) return;
    host.innerHTML = TABS.map(function (t) {
      const active = state.type === t.id;
      return '<button type="button" class="filter-btn' + (active ? ' is-active' : '') + '"' +
             ' data-filter="' + t.id + '"' +
             ' aria-pressed="' + (active ? 'true' : 'false') + '">' +
             t.label + '</button>';
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

  /* ── Sort ──────────────────────────────────────────────── */
  function applySort(items, sort) {
    const copy = items.slice();
    switch (sort) {
      case 'price-asc':   return copy.sort(function (a, b) { return Number(a.price) - Number(b.price); });
      case 'price-desc':  return copy.sort(function (a, b) { return Number(b.price) - Number(a.price); });
      case 'model-asc':   return copy.sort(function (a, b) { return String(a.model || '').localeCompare(String(b.model || '')); });
      case 'ram-desc':    return copy.sort(function (a, b) { return (Number(b.ram) || 0) - (Number(a.ram) || 0); });
      case 'ssd-desc':    return copy.sort(function (a, b) { return (Number(b.ssd) || 0) - (Number(a.ssd) || 0); });
      case 'featured':
      default:            return copy;
    }
  }

  /* ── Count display ─────────────────────────────────────── */
  function updateCount(visible, total) {
    const el = document.getElementById('home-count');
    if (el) {
      el.textContent = visible === total
        ? total + ' items · laptops, desktops, tiny PCs, monitors'
        : visible + ' of ' + total + ' items shown';
    }
    NS.SortBar?.setCount?.(visible);
  }

  /* ── Render loop ───────────────────────────────────────── */
  function render(grid, state, gridHost) {
    /* Filter by type */
    let items = allItems.slice();
    if (state.type === 'laptop') items = items.filter(function (i) { return i._type === 'laptop'; });
    if (state.type === 'pc')     items = items.filter(function (i) { return i._type === 'pc'; });

    /* Sort */
    items = applySort(items, state.sort);

    /* Render cards inside Bootstrap columns */
    if (!items.length) {
      gridHost.innerHTML =
        '<div class="product-empty" role="status">' +
          '<i data-lucide="search-x"></i>' +
          '<p>No products match this filter.</p>' +
        '</div>';
      NS.renderIcons?.(gridHost);
    } else {
      gridHost.replaceChildren.apply(gridHost, items.map(function (item) {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
        col.appendChild(NS.ProductCard.render(item));
        return col;
      }));
      NS.renderIcons?.(gridHost);
    }

    /* Apply list/grid view class to the row container */
    gridHost.classList.toggle('is-list', state.view === 'list');

    updateCount(items.length, allItems.length);
  }

  /* ── Init ──────────────────────────────────────────────── */
  async function init() {
    /* 1. Hero */
    NS.Hero?.mount();

    /* 2. Products */
    const gridHost = document.getElementById('home-grid');
    const tabsHost = document.getElementById('home-filters');
    const sortHost = document.getElementById('home-sort');

    if (!gridHost) return;

    /* Check that ProductCard loaded */
    if (!NS.ProductCard || typeof NS.ProductCard.render !== 'function') {
      console.error('[IT Zone] Home: ProductCard module missing.');
      gridHost.innerHTML = '<div class="product-empty">Product card module not loaded.</div>';
      return;
    }

    /* Loading state */
    gridHost.innerHTML =
      '<div class="product-loading" role="status" aria-live="polite">' +
        '<i data-lucide="loader-2"></i>' +
        '<span>Loading products\u2026</span>' +
      '</div>';
    NS.renderIcons?.(gridHost);

    /* Fetch data */
    try {
      const results = await Promise.all([
        NS.Data.laptops().catch(function () { return []; }),
        NS.Data.pcs().catch(function () { return {}; })
      ]);
      allItems = mergeAll(results[0], results[1]);
    } catch (err) {
      console.error('[IT Zone] Home: failed to load products.', err);
      gridHost.innerHTML =
        '<div class="product-empty" role="alert">' +
          '<i data-lucide="alert-circle"></i>' +
          '<p>Could not load products. Please refresh.</p>' +
        '</div>';
      NS.renderIcons?.(gridHost);
      return;
    }

    /* State */
    const state = {
      type: 'all',
      sort: (NS.SortBar && NS.SortBar.getStoredSort) ? NS.SortBar.getStoredSort() : 'featured',
      view: (NS.SortBar && NS.SortBar.getStoredView) ? NS.SortBar.getStoredView() : 'grid'
    };

    /* Fake grid object — the home page doesn't use ProductGrid.js */
    const grid = { render: function () { /* no-op */ } };

    function refresh() {
      render(grid, state, gridHost);
    }

    /* Mount type tabs */
    mountTabs(tabsHost, state, function (type) {
      state.type = type;
      refresh();
    });

    /* Mount sort bar */
    if (sortHost && NS.SortBar && typeof NS.SortBar.mount === 'function') {
      NS.SortBar.mount(sortHost, state.view);

      document.addEventListener('sort:change', function (e) {
        state.sort = e.detail.sort;
        refresh();
      });

      document.addEventListener('view:change', function (e) {
        state.view = e.detail.view;
        refresh();
      });
    }

    /* WhatsApp order tracking via delegation */
    if (gridHost.dataset.bound !== 'true') {
      gridHost.dataset.bound = 'true';
      gridHost.addEventListener('click', function (e) {
        const wa = e.target.closest('.product-order-wa');
        if (!wa) return;
        const card = wa.closest('[data-id]');
        const id = card ? card.dataset.id : 'unknown';
        console.info('[IT Zone] WhatsApp order intent for:', id);
      });
    }

    /* First render */
    refresh();

    console.info('[IT Zone] Home: rendered ' + allItems.length + ' products.');
  }

  NS.homePage = { init: init };
})();