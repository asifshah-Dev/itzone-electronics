// assets/js/pages/pcs.page.js
/* ─────────────────────────────────────────────────────────
   PCs & Monitors page.
   Category tabs + sort + view.
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

  function flatten(data) {
    const out = [];
    (data.desktops || []).forEach(i => out.push(Object.assign({}, i, { _type: 'pc', _subtype: 'desktop' })));
    (data.tiny     || []).forEach(i => out.push(Object.assign({}, i, { _type: 'pc', _subtype: 'tiny' })));
    (data.monitors || []).forEach(i => out.push(Object.assign({}, i, { _type: 'pc', _subtype: 'monitor' })));
    return out;
  }

  function readParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      cat:  (p.get('cat')  || 'all').trim(),
      sort: (p.get('sort') || 'featured').trim(),
      view: (p.get('view') || 'grid').trim(),
    };
  }

  function writeParams(params) {
    const url = new URL(window.location.href);
    if (params.cat  && params.cat  !== 'all')      url.searchParams.set('cat', params.cat);
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
      case 'model-asc':  return copy.sort((a,b) => (a.model||'').localeCompare(b.model||''));
      case 'ram-desc':   return copy.sort((a,b) => (Number(b.ram)||0) - (Number(a.ram)||0));
      default:           return copy;
    }
  }

  function updateCount(visible, total) {
    const el = document.getElementById('pcs-count');
    if (el) {
      el.textContent = visible === total
        ? total + ' items \u00b7 desktops, tiny PCs, monitors'
        : visible + ' of ' + total + ' items shown';
    }
    NS.SortBar?.setCount?.(visible);
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

  async function init() {
    const gridHost = document.getElementById('pcs-grid');
    const tabsHost = document.getElementById('pcs-tabs');
    const sortHost = document.getElementById('pcs-sort');
    if (!gridHost) return;

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
    const state = {
      category: urlState.cat,
      sort:     urlState.sort,
      view:     urlState.view,
    };

    const grid = NS.ProductGrid.mount(gridHost);

    function render() {
      const filtered = state.category === 'all'
        ? allItems
        : allItems.filter(i => i._subtype === state.category);
      const sorted = applySort(filtered, state.sort);
      grid.render(sorted);
      updateCount(sorted.length, allItems.length);
      gridHost.classList.toggle('is-list', state.view === 'list');
      writeParams(state);
    }

    if (tabsHost) {
      mountTabs(tabsHost, { category: state.category }, function (cat) {
        state.category = cat;
        render();
      });
    }

    if (sortHost) {
      NS.SortBar.mount(sortHost);
      document.addEventListener('sort:change', e => { state.sort = e.detail.sort; render(); });
      document.addEventListener('view:change', e => { state.view = e.detail.view; render(); });
    }

    render();
    console.info('[IT Zone] Loaded ' + allItems.length + ' PCs & monitors.');
  }

  NS.pcsPage = { init: init };
})();