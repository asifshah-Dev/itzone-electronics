// assets/js/pages/pcs.page.js
/* ─────────────────────────────────────────────────────────
   PCs & Monitors page.
   Category tabs + sort + view toggle.
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
    (data.desktops || []).forEach(i => out.push(Object.assign({}, i, { _category: 'desktop' })));
    (data.tiny || []).forEach(i => out.push(Object.assign({}, i, { _category: 'tiny' })));
    (data.monitors || []).forEach(i => out.push(Object.assign({}, i, { _category: 'monitor' })));
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
    ['cat','sort','view'].forEach(k => {
      if (params[k] && params[k] !== 'grid' && params[k] !== 'featured' && params[k] !== 'all') {
        url.searchParams.set(k, params[k]);
      } else {
        url.searchParams.delete(k);
      }
    });
    window.history.replaceState({}, '', url);
  }

  function applySort(items, sort) {
    const copy = items.slice();
    switch (sort) {
      case 'price-asc':  return copy.sort((a,b) => a.price - b.price);
      case 'price-desc': return copy.sort((a,b) => b.price - a.price);
      case 'model-asc':  return copy.sort((a,b) => (a.model || '').localeCompare(b.model || ''));
      case 'ram-desc':   return copy.sort((a,b) => (b.ram || 0) - (a.ram || 0));
      case 'featured':
      default:           return copy;
    }
  }

  function updateCount(visible, total) {
    const el = document.getElementById('pcs-count');
    if (el) {
      el.textContent = visible === total
        ? total + ' machines · tested, warranted, priced fairly'
        : visible + ' of ' + total + ' machines shown';
    }
    NS.SortBar?.setCount?.(visible);
  }

  function renderTabs(host, state, onChange) {
    host.innerHTML = CATEGORIES.map(function (c) {
      const active = state.category === c.id;
      return (
        '<button type="button" class="filter-btn' + (active ? ' is-active' : '') + '"' +
        ' data-filter="' + c.id + '"' +
        ' aria-pressed="' + (active ? 'true' : 'false') + '">' +
        c.label + '</button>'
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

  async function init() {
    const gridHost = document.getElementById('pcs-grid');
    const tabsHost = document.getElementById('pcs-tabs');
    const sortHost = document.getElementById('pcs-sort');
    if (!gridHost) return;

    gridHost.innerHTML =
      '<div class="product-loading" role="status" aria-live="polite">' +
        '<i data-lucide="loader-2"></i><span>Loading PCs and monitors…</span>' +
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
        : allItems.filter(i => i._category === state.category);
      const sorted = applySort(filtered, state.sort);
      grid.render(sorted);
      updateCount(sorted.length, allItems.length);
      gridHost.classList.toggle('is-list', state.view === 'list');
      writeParams(state);
    }

    if (tabsHost) {
      renderTabs(tabsHost, { category: state.category }, function (cat) {
        state.category = cat;
        render();
      });
    }

    if (sortHost) {
      NS.SortBar.mount(sortHost);
      document.addEventListener('sort:change', (e) => {
        state.sort = e.detail.sort;
        render();
      });
      document.addEventListener('view:change', (e) => {
        state.view = e.detail.view;
        render();
      });
    }

    gridHost.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action="add-to-cart"]');
      if (!btn) return;
      const card = btn.closest('[data-id]');
      if (!card) return;
      document.dispatchEvent(new CustomEvent('cart:add', {
        detail: { id: card.dataset.id }
      }));
    });

    render();
    console.info('[IT Zone] Loaded ' + allItems.length + ' PCs & monitors.');
  }

  NS.pcsPage = { init: init };
})();