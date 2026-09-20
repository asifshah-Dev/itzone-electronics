// assets/js/pages/inventory.page.js
/* ─────────────────────────────────────────────────────────
   Inventory page — Laptops + PCs merged.
   Filters: brand buttons, quick tag (from URL), search.
   Sort + view mode.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  let allItems = [];

  /* ── Quick tag predicates ─────────────────────────────── */
  const TAG_FILTERS = {
    '50k-70k':   (i) => i.price >= 50000 && i.price <= 70000,
    'upto-100k': (i) => i.price <= 100000,
    '100k-plus': (i) => i.price > 100000,
    'i5':        (i) => (i.cpu || '').toLowerCase().includes('i5'),
    'i7':        (i) => (i.cpu || '').toLowerCase().includes('i7'),
    'hp':        (i) => i.brand === 'HP',
    'dell':      (i) => i.brand === 'DELL',
    'touch':     (i) => {
      const h = ((i.model || '') + ' ' + (i.extras || '')).toLowerCase();
      return h.includes('touch');
    },
    'numpad':    (i) => {
      const h = ((i.model || '') + ' ' + (i.extras || '')).toLowerCase();
      return h.includes('numpad');
    },
    'gaming':    (i) => {
      if (i.gpu && String(i.gpu).trim() !== '') return true;
      const h = ((i.model || '') + ' ' + (i.extras || '')).toLowerCase();
      return h.includes('p51') || h.includes('p14') ||
             h.includes('z book') || h.includes('zbook') ||
             h.includes('xps') || h.includes('xeon') ||
             h.includes('quadro') || h.includes('dedicated');
    },
  };

  function readParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      tag:  (p.get('tag')  || '').trim(),
      q:    (p.get('q')    || '').trim(),
      sort: (p.get('sort') || 'featured').trim(),
      view: (p.get('view') || 'grid').trim(),
    };
  }

  function writeParams(params) {
    const url = new URL(window.location.href);
    ['tag','q','sort','view'].forEach(k => {
      if (params[k] && params[k] !== 'grid' && params[k] !== 'featured' && params[k] !== '') {
        url.searchParams.set(k, params[k]);
      } else {
        url.searchParams.delete(k);
      }
    });
    window.history.replaceState({}, '', url);
  }

  /* ── Merge laptops + desktops + tiny + monitors ───────── */
  function mergeAll(laptops, pcs) {
    const out = [];
    (laptops || []).forEach(i => out.push(Object.assign({}, i, { _type: 'laptop' })));
    (pcs?.desktops || []).forEach(i => out.push(Object.assign({}, i, { _type: 'desktop' })));
    (pcs?.tiny     || []).forEach(i => out.push(Object.assign({}, i, { _type: 'tiny' })));
    (pcs?.monitors || []).forEach(i => out.push(Object.assign({}, i, { _type: 'monitor' })));
    return out;
  }

  function applyFilters(state) {
    let items = allItems.slice();
    if (state.tag && TAG_FILTERS[state.tag]) items = items.filter(TAG_FILTERS[state.tag]);
    if (state.brand && state.brand !== 'all') items = items.filter(i => i.brand === state.brand);
    const q = (state.q || '').toLowerCase();
    if (q) {
      items = items.filter(i => {
        const h = [i.brand, i.model, i.cpu, i.gen, i.extras, i.hdd, i.gpu,
                   i.resolution, i.size, i.ram + 'GB', i.ssd + 'GB']
                  .filter(Boolean).join(' ').toLowerCase();
        return h.includes(q);
      });
    }
    return items;
  }

  function applySort(items, sort) {
    const copy = items.slice();
    switch (sort) {
      case 'price-asc':  return copy.sort((a,b) => a.price - b.price);
      case 'price-desc': return copy.sort((a,b) => b.price - a.price);
      case 'model-asc':  return copy.sort((a,b) => (a.model||'').localeCompare(b.model||''));
      case 'ram-desc':   return copy.sort((a,b) => (b.ram||0) - (a.ram||0));
      case 'ssd-desc':   return copy.sort((a,b) => (b.ssd||0) - (a.ssd||0));
      default:           return copy;
    }
  }

  function updateCount(visible, total) {
    const el = document.getElementById('inventory-count');
    if (el) {
      el.textContent = visible === total
        ? total + ' items · laptops, desktops, monitors'
        : visible + ' of ' + total + ' items shown';
    }
    NS.SortBar?.setCount?.(visible);
  }

  async function init() {
    const gridHost   = document.getElementById('product-grid');
    const filtersHost = document.getElementById('product-filters');
    const searchHost  = document.getElementById('product-search');
    const sortHost    = document.getElementById('product-sort');
    if (!gridHost) return;

    gridHost.innerHTML =
      '<div class="product-loading" role="status" aria-live="polite">' +
        '<i data-lucide="loader-2"></i><span>Loading inventory…</span>' +
      '</div>';
    NS.renderIcons?.(gridHost);

    /* Fetch both files in parallel */
    try {
      const [laptops, pcs] = await Promise.all([
        NS.Data.laptops().catch(() => []),
        NS.Data.pcs().catch(() => ({})),
      ]);
      allItems = mergeAll(laptops, pcs);
    } catch (err) {
      console.error('[IT Zone] Failed to load inventory:', err);
      gridHost.innerHTML =
        '<div class="product-empty" role="alert">' +
          '<i data-lucide="alert-circle"></i>' +
          '<p>Could not load inventory. Please refresh.</p>' +
        '</div>';
      NS.renderIcons?.(gridHost);
      return;
    }

    const urlState = readParams();
    const state = {
      brand: 'all',
      tag:   urlState.tag,
      q:     urlState.q,
      sort:  urlState.sort,
      view:  urlState.view,
    };

    const grid = NS.ProductGrid.mount(gridHost);

    function render() {
      const filtered = applyFilters(state);
      const sorted = applySort(filtered, state.sort);
      grid.render(sorted);
      updateCount(sorted.length, allItems.length);
      gridHost.classList.toggle('is-list', state.view === 'list');
      writeParams(state);
    }

    NS.Filters.mount(filtersHost);
    document.addEventListener('filter:change', e => {
      state.brand = e.detail.brand;
      render();
    });

    NS.SearchBar.mount(searchHost, state.q);
    document.addEventListener('search:change', e => {
      state.q = e.detail.query;
      render();
    });

    NS.SortBar.mount(sortHost);
    document.addEventListener('sort:change', e => { state.sort = e.detail.sort; render(); });
    document.addEventListener('view:change', e => { state.view = e.detail.view; render(); });

    gridHost.addEventListener('click', e => {
      if (e.target.closest('#empty-reset')) {
        state.brand = 'all'; state.tag = ''; state.q = ''; state.sort = 'featured';
        document.querySelectorAll('.filter-btn').forEach(b => {
          const isAll = b.dataset.filter === 'all';
          b.classList.toggle('is-active', isAll);
          b.setAttribute('aria-pressed', isAll ? 'true' : 'false');
        });
        const si = document.getElementById('page-search'); if (si) si.value = '';
        const ni = document.getElementById('nav-search-input'); if (ni) ni.value = '';
        render();
        return;
      }
      const btn = e.target.closest('[data-action="add-to-cart"]');
      if (!btn) return;
      const card = btn.closest('[data-id]');
      if (!card) return;
      document.dispatchEvent(new CustomEvent('cart:add', { detail: { id: card.dataset.id } }));
    });

    render();
    console.info('[IT Zone] Loaded ' + allItems.length + ' items from laptops + pcs.'
      + (state.tag ? ' (tag=' + state.tag + ')' : ''));
  }

  NS.inventoryPage = { init };
})();