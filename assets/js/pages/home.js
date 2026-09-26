// assets/js/pages/home.js
/* ─────────────────────────────────────────────────────────
   Home page controller.
   - Mounts hero
   - Fetches all laptops + PCs
   - Type tabs + sort + view toggle live in ONE bar
   - Full-width grid, 4 cards per row
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  let allItems = [];

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

  const TABS = [
    { id: 'all',    label: 'All' },
    { id: 'laptop', label: 'Laptops' },
    { id: 'pc',     label: 'PCs & Monitors' }
  ];

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

  function updateCount(visible, total) {
    const el = document.getElementById('home-count');
    if (el) {
      el.textContent = visible === total
        ? total + ' items · laptops, desktops, tiny PCs, monitors'
        : visible + ' of ' + total + ' items shown';
    }
    NS.SortBar?.setCount?.(visible);
  }

    function render(state, gridHost) {
    /* Apply view classes FIRST — so CSS is active before cards render */
    gridHost.classList.toggle('is-list', state.view === 'list');
    gridHost.classList.toggle('is-grid', state.view === 'grid');

    /* Filter by type */
    let items = allItems.slice();
    if (state.type === 'laptop') items = items.filter(function (i) { return i._type === 'laptop'; });
    if (state.type === 'pc')     items = items.filter(function (i) { return i._type === 'pc'; });

    /* Sort */
    items = applySort(items, state.sort);

    /* Render */
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

    updateCount(items.length, allItems.length);
  }

    async function init() {
    NS.Hero?.mount();

    const gridHost = document.getElementById('home-grid');
    const sortHost = document.getElementById('home-sort');

    if (!gridHost) return;

    if (!NS.ProductCard || typeof NS.ProductCard.render !== 'function') {
      console.error('[IT Zone] Home: ProductCard module missing.');
      return;
    }

    gridHost.innerHTML =
      '<div class="product-loading" role="status" aria-live="polite">' +
        '<i data-lucide="loader-2"></i>' +
        '<span>Loading products\u2026</span>' +
      '</div>';
    NS.renderIcons?.(gridHost);

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

    /* Detect mobile */
    const isMobile = window.matchMedia('(max-width: 576px)').matches;

    /* On mobile: ALWAYS start in list view — ignore localStorage */
    const state = {
      type: 'all',
      sort: (NS.SortBar && NS.SortBar.getStoredSort) ? NS.SortBar.getStoredSort() : 'featured',
      view: isMobile
        ? 'list'
        : ((NS.SortBar && NS.SortBar.getStoredView) ? NS.SortBar.getStoredView() : 'grid')
    };

    /* Apply the initial view state immediately to the grid element,
       before the first render, so CSS picks it up right away */
    gridHost.classList.toggle('is-list', state.view === 'list');
    gridHost.classList.toggle('is-grid', state.view === 'grid');

    function refresh() {
      render(state, gridHost);
    }

    /* Mount SortBar with tabs inside and pass initial view */
    if (sortHost && NS.SortBar && typeof NS.SortBar.mount === 'function') {
      /* Clear any cached view on mobile so the toggle starts on "list" */
      if (isMobile) {
        try { localStorage.setItem('itz.view', 'list'); } catch (e) {}
      }

      NS.SortBar.mount(sortHost, {
        initialView: state.view,
        tabs: TABS,
        activeTab: state.type,
        onTabChange: function (type) {
          state.type = type;
          refresh();
        }
      });

      document.addEventListener('sort:change', function (e) {
        state.sort = e.detail.sort;
        refresh();
      });

      document.addEventListener('view:change', function (e) {
        state.view = e.detail.view;
        refresh();
      });
    }

    /* WhatsApp order tracking */
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

    refresh();

    console.info('[IT Zone] Home: rendered ' + allItems.length + ' products. View: ' + state.view);
  }

  NS.homePage = { init: init };
})();