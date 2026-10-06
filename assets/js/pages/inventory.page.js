// assets/js/pages/inventory.page.js
/* ─────────────────────────────────────────────────────────
   Inventory page — combines laptops.json + pcs.json.
   Supports: ?type=  ?tag=  ?q=  ?brand=  ?series=  ?sort=  ?view=
   View persists across reloads (URL + localStorage).
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  let allItems = [];

  /* ═══════════════════════════════════════════════════════
     TAG FILTERS (existing price/cpu/brand presets)
     ═══════════════════════════════════════════════════════ */
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

  /* ═══════════════════════════════════════════════════════
     BRAND / SERIES helpers
     ═══════════════════════════════════════════════════════ */

  function slug(s) {
    return String(s || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /* Extract series from a model, matching Navbar.seriesOf exactly. */
  function seriesOf(modelRaw) {
    const m = String(modelRaw || '').trim();
    if (!m) return '';
    const upper = m.toUpperCase();

    // ── DELL ────────────────────────────────────────────
    if (/\bLATITUDE\b/.test(upper))  return 'Latitude';
    if (/\bVOSTRO\b/.test(upper))    return 'Vostro';
    if (/\bINSPIRON\b/.test(upper))  return 'Inspiron';
    if (/\bXPS\b/.test(upper))       return 'XPS';
    if (/\bPRECISION\b/.test(upper)) return 'Precision';

    // ── HP ──────────────────────────────────────────────
    if (/\bZ\s*BOOK\s*FIREFLY\b|\bZBOOK\s*FIREFLY\b/.test(upper)) return 'ZBook Firefly';
    if (/\bZ\s*BOOK\b|\bZBOOK\b/.test(upper))                     return 'ZBook';
    if (/\bELITEBOOK\b/.test(upper)) return 'EliteBook';
    if (/\bPROBOOK\b/.test(upper))   return 'ProBook';
    if (/\bPAVILION\b/.test(upper))  return 'Pavilion';
    if (/^250\b/.test(upper))        return 'HP 250 Series';
    if (/^445\b/.test(upper))        return 'HP 445 Series';

    // ── LENOVO ──────────────────────────────────────────
    if (/^(T|X|L|E|P|W|S)\d{2,4}\b/.test(upper)) return 'ThinkPad';
    if (/\bTHINKPAD\b/.test(upper))              return 'ThinkPad';
    if (/\bIDEAPAD\b/.test(upper))               return 'IdeaPad';
    if (/\bLEGION\b/.test(upper))                return 'Legion';
    if (/\bYOGA\b/.test(upper))                  return 'Yoga';

    const fallback = m.replace(/[\s\-]*\d.*$/, '').trim();
    return fallback || m;
  }

  /* ═══════════════════════════════════════════════════════
     URL PARAMS
     ═══════════════════════════════════════════════════════ */
  function readParams() {
    const p = new URLSearchParams(window.location.search);
    let tag = (p.get('tag') || '').trim();
    const q = (p.get('q') || '').trim();

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
      type:   (p.get('type')   || 'all').trim(),
      tag:    tag,
      q:      q,
      brand:  (p.get('brand')  || '').trim(),
      series: (p.get('series') || '').trim(),
      sort:   (p.get('sort')   || '').trim(),
      view:   (p.get('view')   || '').trim(),
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
    if (state.brand)                             url.searchParams.set('brand', state.brand);
    else                                         url.searchParams.delete('brand');
    if (state.series)                            url.searchParams.set('series', state.series);
    else                                         url.searchParams.delete('series');
    if (state.sort && state.sort !== 'featured') url.searchParams.set('sort', state.sort);
    else                                         url.searchParams.delete('sort');
    if (state.view && state.view !== 'grid')     url.searchParams.set('view', state.view);
    else                                         url.searchParams.delete('view');
    window.history.replaceState({}, '', url);
  }

  /* ═══════════════════════════════════════════════════════
     MERGE + FILTER + SORT
     ═══════════════════════════════════════════════════════ */
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

    /* ── Brand filter (?brand=dell / hp / lenovo) ──── */
    if (state.brand) {
      const b = String(state.brand).toUpperCase();
      items = items.filter(i => String(i.brand || '').toUpperCase() === b);
    }

    /* ── Series filter (?series=latitude / thinkpad) ─ */
    if (state.series) {
      const want = slug(state.series);
      items = items.filter(i => slug(seriesOf(i.model)) === want);
    }

    /* ── Text search (?q=) ─────────────────────────── */
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

  /* Build a readable page heading from active filters */
  function filterHeading(state) {
    const parts = [];
    if (state.brand)  parts.push(state.brand.toUpperCase());
    if (state.series) parts.push(titleCase(state.series.replace(/-/g, ' ')));
    if (state.tag)    parts.push(titleCase(state.tag.replace(/-/g, ' ')));
    if (state.q)      parts.push('\u201C' + state.q + '\u201D');
    return parts.join(' \u00b7 ');
  }

  function titleCase(s) {
    return String(s || '').replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
  }

  function updateCount(visible, total, state) {
    const el = document.getElementById('inventory-count');
    if (!el) return;

    const heading = filterHeading(state);
    if (visible === 0) {
      el.textContent = heading
        ? 'No items match ' + heading
        : 'No items found';
    } else if (heading) {
      el.textContent = heading + ' \u2014 ' + visible + ' item' + (visible === 1 ? '' : 's');
    } else if (visible === total) {
      el.textContent = total + ' items \u00b7 laptops, desktops, monitors';
    } else {
      el.textContent = visible + ' of ' + total + ' items shown';
    }

    if (NS.SortBar && typeof NS.SortBar.setCount === 'function') {
      NS.SortBar.setCount(visible);
    }
  }

  /* ═══════════════════════════════════════════════════════
     TABS
     ═══════════════════════════════════════════════════════ */
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

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */
  async function init() {
    const gridHost = document.getElementById('product-grid');
    const tabsHost = document.getElementById('product-filters');
    const sortHost = document.getElementById('product-sort');
    if (!gridHost) return;

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
    const storedView = (NS.SortBar && NS.SortBar.getStoredView)
      ? NS.SortBar.getStoredView() : 'grid';
    const storedSort = (NS.SortBar && NS.SortBar.getStoredSort)
      ? NS.SortBar.getStoredSort() : 'featured';

    const state = {
      type:   urlState.type   || 'all',
      tag:    urlState.tag    || '',
      q:      urlState.q      || '',
      brand:  urlState.brand  || '',
      series: urlState.series || '',
      sort:   urlState.sort   || storedSort || 'featured',
      view:   urlState.view   || storedView || 'grid',
    };

    /* If a brand or series came in via URL, force tab to "laptop"
       (only laptops have brands/series today). */
    if ((state.brand || state.series) && state.type === 'all') {
      state.type = 'all'; // keep showing all matching brand/series
    }

    const grid = NS.ProductGrid.mount(gridHost);
    if (!grid) { console.error('[IT Zone] Grid mount failed'); return; }

    function render() {
      const filtered = applyFilters(state);
      const sorted = applySort(filtered, state.sort);

      grid.render(sorted);
      updateCount(sorted.length, allItems.length, state);

      gridHost.classList.toggle('is-list', state.view === 'list');

      writeParams(state);
    }

    mountTabs(tabsHost, state, function (type) {
      state.type = type;
      /* Clear brand/series when user switches tabs manually */
      if (type !== 'all') {
        state.brand = '';
        state.series = '';
      }
      render();
    });

    if (sortHost && NS.SortBar && typeof NS.SortBar.mount === 'function') {
      NS.SortBar.mount(sortHost, { initialView: state.view });

      document.addEventListener('sort:change', function (e) {
        state.sort = e.detail.sort;
        render();
      });
      document.addEventListener('view:change', function (e) {
        state.view = e.detail.view;
        render();
      });
    }

    gridHost.addEventListener('click', function (e) {
      if (e.target.closest('#empty-reset')) {
        state.type = 'all';
        state.tag = '';
        state.q = '';
        state.brand = '';
        state.series = '';
        state.sort = 'featured';
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
    console.info('[IT Zone] Loaded ' + allItems.length + ' items. View:',
                 state.view,
                 '| Brand: "' + (state.brand || '\u2014') + '"',
                 '| Series: "' + (state.series || '\u2014') + '"',
                 '| Tag: "' + (state.tag || '\u2014') + '"');
  }

  NS.inventoryPage = { init: init };
})();