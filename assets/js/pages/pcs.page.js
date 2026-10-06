// assets/js/pages/pcs.page.js
/* ─────────────────────────────────────────────────────────
   PCs & Monitors page.
   Category tabs + sort + view (persisted).
   Reads ?cat= query param AND #hash (e.g. #desktops, #tiny, #monitors)
   so navbar links land on the right tab.
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

  /* Map URL hash → category id */
  const HASH_TO_CAT = {
    '#desktops': 'desktop',
    '#desktop':  'desktop',
    '#tiny':     'tiny',
    '#tiny-pcs': 'tiny',
    '#monitors': 'monitor',
    '#monitor':  'monitor',
  };

  let allItems = [];

  function flatten(data) {
    const out = [];
    (data.desktops || []).forEach(i => out.push(Object.assign({}, i, { _type: 'pc', _subtype: 'desktop' })));
    (data.tiny     || []).forEach(i => out.push(Object.assign({}, i, { _type: 'pc', _subtype: 'tiny' })));
    (data.monitors || []).forEach(i => out.push(Object.assign({}, i, { _type: 'pc', _subtype: 'monitor' })));
    return out;
  }

  function readParams() {
    const p = new URLSearchParams(window.location.search);

    /* Priority: #hash → ?cat= → 'all' */
    const hashCat = HASH_TO_CAT[String(window.location.hash || '').toLowerCase()] || '';
    const cat = hashCat || (p.get('cat') || 'all').trim();

    return {
      cat:  cat,
      sort: (p.get('sort') || '').trim(),
      view: (p.get('view') || '').trim(),
    };
  }

  function writeParams(params) {
    const url = new URL(window.location.href);
    if (params.cat && params.cat !== 'all')        url.searchParams.set('cat', params.cat);
    else                                            url.searchParams.delete('cat');
    if (params.sort && params.sort !== 'featured') url.searchParams.set('sort', params.sort);
    else                                            url.searchParams.delete('sort');
    if (params.view && params.view !== 'grid')     url.searchParams.set('view', params.view);
    else                                            url.searchParams.delete('view');
    window.history.replaceState({}, '', url);
  }

  function applySort(items, sort) {
    const copy = items.slice();
    switch (sort) {
      case 'price-asc':  return copy.sort((a,b) => Number(a.price) - Number(b.price));
      case 'price-desc': return copy.sort((a,b) => Number(b.price) - Number(a.price));
      case 'model-asc':  return copy.sort((a,b) => String(a.model||'').localeCompare(String(b.model||'')));
      case 'ram-desc':   return copy.sort((a,b) => (Number(b.ram)||0) - (Number(a.ram)||0));
      default:           return copy;
    }
  }

  function updateCount(visible, total, category) {
    const el = document.getElementById('pcs-count');
    if (!el) return;

    const labelMap = {
      'all':     'desktops, tiny PCs, monitors',
      'desktop': 'desktops',
      'tiny':    'tiny PCs',
      'monitor': 'monitors',
    };
    const label = labelMap[category] || 'items';

    if (visible === total && category === 'all') {
      el.textContent = total + ' items \u00b7 ' + label;
    } else {
      el.textContent = visible + ' ' + label + ' shown';
    }

    if (NS.SortBar && typeof NS.SortBar.setCount === 'function') {
      NS.SortBar.setCount(visible);
    }
  }

  function mountTabs(host, state, onChange) {
    host.innerHTML = CATEGORIES.map(function (c) {
      const active = state.category === c.id;
      return '<button type="button" class="filter-btn' + (active ? ' is-active' : '') + '"' +
             ' data-filter="' + c.id + '"' +
             ' aria-pressed="' + (active ? 'true' : 'false') + '">' +
             c.label + '</button>';
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

  /* Update the tab UI without re-binding listeners */
  function setActiveTab(host, category) {
    if (!host) return;
    host.querySelectorAll('.filter-btn').forEach(function (b) {
      const active = b.dataset.filter === category;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  async function init() {
    const gridHost = document.getElementById('pcs-grid');
    const tabsHost = document.getElementById('pcs-tabs');
    const sortHost = document.getElementById('pcs-sort');
    if (!gridHost) return;

    if (!NS.ProductCard || typeof NS.ProductCard.render !== 'function') {
      console.error('[IT Zone] PCs: ProductCard not loaded.');
      return;
    }

    gridHost.innerHTML =
      '<div class="product-loading" role="status" aria-live="polite">' +
        '<i data-lucide="loader-2"></i><span>Loading PCs and monitors\u2026</span>' +
      '</div>';
    NS.renderIcons?.(gridHost);

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

    const urlState = readParams();
    const storedView = (NS.SortBar && NS.SortBar.getStoredView)
      ? NS.SortBar.getStoredView() : 'grid';
    const storedSort = (NS.SortBar && NS.SortBar.getStoredSort)
      ? NS.SortBar.getStoredSort() : 'featured';

    const state = {
      category: urlState.cat || 'all',
      sort: urlState.sort || storedSort || 'featured',
      view: urlState.view || storedView || 'grid',
    };

    const grid = NS.ProductGrid.mount(gridHost);
    if (!grid) return;

    function render() {
      const filtered = state.category === 'all'
        ? allItems
        : allItems.filter(i => i._subtype === state.category);
      const sorted = applySort(filtered, state.sort);

      grid.render(sorted);
      updateCount(sorted.length, allItems.length, state.category);
      gridHost.classList.toggle('is-list', state.view === 'list');
      writeParams(state);
    }

    if (tabsHost) {
      mountTabs(tabsHost, { category: state.category }, function (cat) {
        state.category = cat;
        render();
      });
    }

    if (sortHost && NS.SortBar && typeof NS.SortBar.mount === 'function') {
      NS.SortBar.mount(sortHost, { initialView: state.view });
      document.addEventListener('sort:change', function (e) { state.sort = e.detail.sort; render(); });
      document.addEventListener('view:change', function (e) { state.view = e.detail.view; render(); });
    }

    /* Listen for hash changes (e.g. navbar link while already on this page) */
    window.addEventListener('hashchange', function () {
      const cat = HASH_TO_CAT[String(window.location.hash || '').toLowerCase()];
      if (cat) {
        state.category = cat;
        setActiveTab(tabsHost, cat);
        render();
      }
    });

    render();
    console.info('[IT Zone] Loaded ' + allItems.length + ' PCs & monitors. Category:', state.category);
  }

  NS.pcsPage = { init: init };
})();