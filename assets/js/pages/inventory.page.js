// assets/js/pages/inventory.page.js
/* ─────────────────────────────────────────────────────────
   Inventory page — combines laptops.json + pcs.json.
   Type tabs + tag filter + search + sort + view.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  let allItems = [];

  const TAG_FILTERS = {
    'upto-30k': (i) => { const p = Number(i.price); return p > 0 && p <= 30000; },
    '30k-50k':  (i) => { const p = Number(i.price); return p > 30000 && p <= 50000; },
    '50k-70k':  (i) => { const p = Number(i.price); return p > 50000 && p <= 70000; },
    '70k-plus': (i) => Number(i.price) > 70000,
    'i5':    (i) => (i.cpu || '').toLowerCase().indexOf('i5') !== -1,
    'i7':    (i) => (i.cpu || '').toLowerCase().indexOf('i7') !== -1,
    'xeon':  (i) => (i.cpu || '').toLowerCase().indexOf('xeon') !== -1,
    'ryzen': (i) => /ryzen|r5|r7/i.test(i.cpu || ''),
    'dell':   (i) => i.brand === 'DELL',
    'hp':     (i) => i.brand === 'HP',
    'lenovo': (i) => i.brand === 'LENOVO',
    'touch': (i) => {
      const h = ((i.model || '') + ' ' + (i.extras || '')).toLowerCase();
      return h.indexOf('touch') !== -1 || h.indexOf('2in1') !== -1 || h.indexOf('2-in-1') !== -1;
    },
    'gaming': (i) => {
      if (i.gpu && String(i.gpu).trim() !== '') return true;
      const h = ((i.model || '') + ' ' + (i.extras || '') + ' ' + (i.gpu || '')).toLowerCase();
      return h.indexOf('p51') !== -1 || h.indexOf('p14') !== -1 ||
             h.indexOf('z book') !== -1 || h.indexOf('zbook') !== -1 ||
             h.indexOf('z2') !== -1 || h.indexOf('xps') !== -1 ||
             h.indexOf('xeon') !== -1 || h.indexOf('quadro') !== -1 ||
             h.indexOf('dedicated') !== -1 || h.indexOf('graphic') !== -1;
    },
    'laptops-only': (i) => i._subtype === 'laptop',
    'desktops':     (i) => i._subtype === 'desktop',
    'tiny-pcs':     (i) => i._subtype === 'tiny',
    'monitors':     (i) => i._subtype === 'monitor',
  };

  function readParams() {
    const p = new URLSearchParams(window.location.search);
    let tag = (p.get('tag') || '').trim();
    let q   = (p.get('q')   || '').trim();

    if (!tag) {
      try {
        const pending = sessionStorage.getItem('itz.pendingTag');
        const at = Number(sessionStorage.getItem('itz.pendingAt') || 0);
        if (pending && (Date.now() - at) < 10000) {
          tag = pending;
          const url = new URL(window.location.href);
          url.searchParams.set('tag', tag);
          window.history.replaceState({}, '', url);
        }
        sessionStorage.removeItem('itz.pendingTag');
        sessionStorage.removeItem('itz.pendingAt');
      } catch (e) { /* ignore */ }
    }

    return {
      type: (p.get('type') || 'all').trim(),
      tag: tag,
      q: q,
      sort: (p.get('sort') || 'featured').trim(),
      view: (p.get('view') || 'grid').trim(),
    };
  }

  function writeParams(state) {
    const url = new URL(window.location.href);
    if (state.type && state.type !== 'all')      url.searchParams.set('type', state.type);
    else                                         url.searchParams.delete('type');
    if (state.tag)                               url.searchParams.set('tag', state.tag);
    else                                         url.searchParams.delete('tag');
    if (state.q)                                 url.searchParams.set('q', state.q);
    else                                         url.searchParams.delete('q');
    if (state.sort && state.sort !== 'featured') url.searchParams.set('sort', state.sort);
    else                                         url.searchParams.delete('sort');
    if (state.view && state.view !== 'grid')     url.searchParams.set('view', state.view);
    else                                         url.searchParams.delete('view');
    window.history.replaceState({}, '', url);
  }

  function mergeAll(laptops, pcs) {
    const out = [];
    (laptops || []).forEach(i => out.push(Object.assign({}, i, { _type: 'laptop', _subtype: 'laptop' })));
    (pcs && pcs.desktops || []).forEach(i => out.push(Object.assign({}, i, { _type: 'pc', _subtype: 'desktop' })));
    (pcs && pcs.tiny     || []).forEach(i => out.push(Object.assign({}, i, { _type: 'pc', _subtype: 'tiny' })));
    (pcs && pcs.monitors || []).forEach(i => out.push(Object.assign({}, i, { _type: 'pc', _subtype: 'monitor' })));
    return out;
  }

  function applyFilters(state) {
    let items = allItems.slice();

    if (state.type === 'laptop') items = items.filter(i => i._type === 'laptop');
    if (state.type === 'pc')     items = items.filter(i => i._type === 'pc');

    if (state.tag) {
      const fn = TAG_FILTERS[state.tag];
      if (fn) items = items.filter(fn);
    }

    const q = (state.q || '').toLowerCase();
    if (q) {
      items = items.filter(i => {
        const h = [i.brand, i.model, i.cpu, i.gen, i.extras, i.hdd, i.gpu,
                   i.resolution, i.size, i.ram + 'GB', i.ssd + 'GB']
                  .filter(Boolean).join(' ').toLowerCase();
        return h.indexOf(q) !== -1;
      });
    }
    return items;
  }

  function applySort(items, sort) {
    const copy = items.slice();
    switch (sort) {
      case 'price-asc':  return copy.sort((a,b) => Number(a.price) - Number(b.price));
      case 'price-desc': return copy.sort((a,b) => Number(b.price) - Number(a.price));
      case 'model-asc':  return copy.sort((a,b) => String(a.model||'').localeCompare(String(b.model||'')));
      case 'ram-desc':   return copy.sort((a,b) => (Number(b.ram)||0) - (Number(a.ram)||0));
      case 'ssd-desc':   return copy.sort((a,b) => (Number(b.ssd)||0) - (Number(a.ssd)||0));
      default:           return copy;
    }
  }

  function updateCount(visible, total) {
    const el = document.getElementById('inventory-count');
    if (el) {
      el.textContent = visible === total
        ? total + ' items \u00b7 laptops, desktops, monitors'
        : visible + ' of ' + total + ' items shown';
    }
    if (NS.SortBar && typeof NS.SortBar.setCount === 'function') {
      NS.SortBar.setCount(visible);
    }
  }

  const TABS = [
    { id: 'all',    label: 'All' },
    { id: 'laptop', label: 'Laptops' },
    { id: 'pc',     label: 'PCs & Monitors' },
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

  async function init() {
    const gridHost = document.getElementById('product-grid');
    const tabsHost = document.getElementById('product-filters');
    const sortHost = document.getElementById('product-sort');
    if (!gridHost) return;

    /* ── Module check ──────────────────────────────────── */
    console.group('[IT Zone] Inventory: module check');
    console.log('Data:',        typeof NS.Data);
    console.log('ProductCard:', typeof NS.ProductCard,
                NS.ProductCard ? ('render: ' + typeof NS.ProductCard.render) : '');
    console.log('ProductGrid:', typeof NS.ProductGrid);
    console.log('SortBar:',     typeof NS.SortBar);
    console.groupEnd();

    if (!NS.ProductCard || typeof NS.ProductCard.render !== 'function') {
      console.error('[IT Zone] Inventory: ProductCard not loaded — aborting.');
      gridHost.innerHTML = '<div class="product-empty">Product card module not loaded.</div>';
      return;
    }

    gridHost.innerHTML =
      '<div class="product-loading" role="status" aria-live="polite">' +
        '<i data-lucide="loader-2"></i><span>Loading inventory\u2026</span>' +
      '</div>';
    NS.renderIcons?.(gridHost);

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
      type: urlState.type,
      tag:  urlState.tag,
      q:    urlState.q,
      sort: urlState.sort,
      view: urlState.view,
    };

    const grid = NS.ProductGrid.mount(gridHost);
    if (!grid) { console.error('[IT Zone] Grid mount failed'); return; }

    function render() {
      const filtered = applyFilters(state);
      const sorted = applySort(filtered, state.sort);
      grid.render(sorted);
      updateCount(sorted.length, allItems.length);
      gridHost.classList.toggle('is-list', state.view === 'list');
      writeParams(state);
    }

    mountTabs(tabsHost, state, function (type) {
      state.type = type;
      render();
    });

    if (sortHost && NS.SortBar && typeof NS.SortBar.mount === 'function') {
      NS.SortBar.mount(sortHost);
      document.addEventListener('sort:change', function (e) { state.sort = e.detail.sort; render(); });
      document.addEventListener('view:change', function (e) { state.view = e.detail.view; render(); });
    }

    gridHost.addEventListener('click', function (e) {
      if (e.target.closest('#empty-reset')) {
        state.type = 'all'; state.tag = ''; state.q = ''; state.sort = 'featured';
        if (tabsHost) {
          tabsHost.querySelectorAll('.filter-btn').forEach(function (b) {
            const isAll = b.dataset.filter === 'all';
            b.classList.toggle('is-active', isAll);
            b.setAttribute('aria-pressed', isAll ? 'true' : 'false');
          });
        }
        render();
      }
    });

    render();
    console.info('[IT Zone] Loaded ' + allItems.length + ' items. Tag: "' + (state.tag || '\u2014') + '"');
  }

  NS.inventoryPage = { init: init };
})();