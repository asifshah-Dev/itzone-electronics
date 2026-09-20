// assets/js/pages/inventory.page.js
/* ─────────────────────────────────────────────────────────
   Inventory page — combines laptops.json + pcs.json.
   Type tabs: All / Laptops / PCs & Monitors.
   Reads: ?tag=  ?q=  ?sort=  ?view=  ?type=
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  let allItems = [];

    const TAG_FILTERS = {
    /* ── PRICE ─────────────────────────────────────────── */
    'upto-30k': (i) => {
      const p = Number(i.price);
      return p > 0 && p <= 30000;
    },
    '30k-50k':  (i) => {
      const p = Number(i.price);
      return p > 30000 && p <= 50000;
    },
    '50k-70k':  (i) => {
      const p = Number(i.price);
      return p > 50000 && p <= 70000;
    },
    '70k-plus': (i) => Number(i.price) > 70000,

    /* ── CPU ───────────────────────────────────────────── */
    'i5':    (i) => (i.cpu || '').toLowerCase().includes('i5'),
    'i7':    (i) => (i.cpu || '').toLowerCase().includes('i7'),
    'xeon':  (i) => (i.cpu || '').toLowerCase().includes('xeon'),
    'ryzen': (i) => /ryzen|r5|r7/i.test(i.cpu || ''),

    /* ── BRAND ─────────────────────────────────────────── */
    'dell':   (i) => i.brand === 'DELL',
    'hp':     (i) => i.brand === 'HP',
    'lenovo': (i) => i.brand === 'LENOVO',

    /* ── FEATURES ──────────────────────────────────────── */
    'touch': (i) => {
      const h = ((i.model || '') + ' ' + (i.extras || '')).toLowerCase();
      return h.includes('touch') || h.includes('2in1') || h.includes('2-in-1');
    },
    'numpad': (i) => {
      const h = ((i.model || '') + ' ' + (i.extras || '')).toLowerCase();
      return h.includes('numpad');
    },
    'gaming': (i) => {
      if (i.gpu && String(i.gpu).trim() !== '') return true;
      const h = ((i.model || '') + ' ' + (i.extras || '') + ' ' + (i.gpu || '')).toLowerCase();
      return h.includes('p51') || h.includes('p14') ||
             h.includes('z book') || h.includes('zbook') ||
             h.includes('z2') || h.includes('xps') ||
             h.includes('xeon') || h.includes('quadro') ||
             h.includes('dedicated') || h.includes('graphic');
    },

       /* ── TYPE ──────────────────────────────────────────── */
    'laptops-only': (i) => i._subtype === 'laptop',
    'desktops':     (i) => i._subtype === 'desktop',
    'tiny-pcs':     (i) => i._subtype === 'tiny',
    'monitors':     (i) => i._subtype === 'monitor',
  };

     function readParams() {
    const p = new URLSearchParams(window.location.search);

    let tag = (p.get('tag') || '').trim();

    /* Fallback: if the URL had no tag but the navbar stashed one
       in sessionStorage on click, use it. This survives dev servers
       that strip query strings on extensionless redirects. */
    if (!tag) {
      try {
        const pending = sessionStorage.getItem('itz.pendingTag');
        const at = Number(sessionStorage.getItem('itz.pendingAt') || 0);
        /* Only use if stashed within the last 10 seconds */
        if (pending && (Date.now() - at) < 10000) {
          tag = pending;
          console.info('[IT Zone] Recovered tag from sessionStorage:', tag);
          /* Put it back into the URL so subsequent reloads work */
          p.set('tag', tag);
          const url = new URL(window.location.href);
          url.searchParams.set('tag', tag);
          window.history.replaceState({}, '', url);
        }
        sessionStorage.removeItem('itz.pendingTag');
        sessionStorage.removeItem('itz.pendingAt');
      } catch (e) { /* private mode etc. */ }
    }

    return {
      type: (p.get('type') || 'all').trim(),
      tag,
      q:    (p.get('q')    || '').trim(),
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
    (laptops || []).forEach(i => out.push(Object.assign({}, i, {
      _type: 'laptop',
      _subtype: 'laptop',
    })));
    (pcs?.desktops || []).forEach(i => out.push(Object.assign({}, i, {
      _type: 'pc',
      _subtype: 'desktop',
    })));
    (pcs?.tiny || []).forEach(i => out.push(Object.assign({}, i, {
      _type: 'pc',
      _subtype: 'tiny',
    })));
    (pcs?.monitors || []).forEach(i => out.push(Object.assign({}, i, {
      _type: 'pc',
      _subtype: 'monitor',
    })));
    return out;
  }

  function applyFilters(state) {
    let items = allItems.slice();

    if (state.type === 'laptop') items = items.filter(i => i._type === 'laptop');
    if (state.type === 'pc')     items = items.filter(i => i._type === 'pc');

    if (state.tag) {
      const fn = TAG_FILTERS[state.tag];
      if (fn) {
        const before = items.length;
        items = items.filter(fn);
        console.info(`[IT Zone] tag="${state.tag}" → ${items.length}/${before}`);
      } else {
        console.warn(`[IT Zone] Unknown tag "${state.tag}" — no filter applied.`);
      }
    }

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
      case 'price-asc':  return copy.sort((a,b) => Number(a.price) - Number(b.price));
      case 'price-desc': return copy.sort((a,b) => Number(b.price) - Number(a.price));
      case 'model-asc':  return copy.sort((a,b) => (a.model||'').localeCompare(b.model||''));
      case 'ram-desc':   return copy.sort((a,b) => (Number(b.ram)||0) - (Number(a.ram)||0));
      case 'ssd-desc':   return copy.sort((a,b) => (Number(b.ssd)||0) - (Number(a.ssd)||0));
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

  const TABS = [
    { id: 'all',    label: 'All' },
    { id: 'laptop', label: 'Laptops' },
    { id: 'pc',     label: 'PCs & Monitors' },
  ];

  function mountTabs(host, state, onChange) {
    if (!host) return;
    host.innerHTML = TABS.map(t => {
      const active = state.type === t.id;
      return `<button type="button" class="filter-btn${active ? ' is-active' : ''}"
                data-filter="${t.id}"
                aria-pressed="${active ? 'true' : 'false'}">${t.label}</button>`;
    }).join('');

    host.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      host.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      onChange(btn.dataset.filter);
    });
  }

  async function init() {
    const gridHost  = document.getElementById('product-grid');
    const tabsHost  = document.getElementById('product-filters');
    const sortHost  = document.getElementById('product-sort');
    if (!gridHost) return;

    gridHost.innerHTML =
      '<div class="product-loading" role="status" aria-live="polite">' +
        '<i data-lucide="loader-2"></i><span>Loading inventory…</span>' +
      '</div>';
    NS.renderIcons?.(gridHost);

    /* ── DEBUG ────────────────────────────────────────────── */
    console.group('[IT Zone] Inventory page boot');
    console.log('URL:', window.location.href);
    console.log('search:', window.location.search);
    console.log('tag from URL:', new URLSearchParams(window.location.search).get('tag'));

    try {
      const [laptops, pcs] = await Promise.all([
        NS.Data.laptops().catch(() => []),
        NS.Data.pcs().catch(() => ({})),
      ]);
      allItems = mergeAll(laptops, pcs);
      console.log('Total items merged:', allItems.length);
    } catch (err) {
      console.error('[IT Zone] Failed to load inventory:', err);
      gridHost.innerHTML =
        '<div class="product-empty" role="alert">' +
          '<i data-lucide="alert-circle"></i>' +
          '<p>Could not load inventory. Please refresh.</p>' +
        '</div>';
      NS.renderIcons?.(gridHost);
      console.groupEnd();
      return;
    }

    const urlState = readParams();
    console.log('Parsed state:', urlState);
    console.groupEnd();

    const state = {
      type: urlState.type,
      tag:  urlState.tag,
      q:    urlState.q,
      sort: urlState.sort,
      view: urlState.view,
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

    mountTabs(tabsHost, state, (type) => {
      state.type = type;
      render();
    });

    if (sortHost) {
      NS.SortBar.mount(sortHost);
      document.addEventListener('sort:change', e => { state.sort = e.detail.sort; render(); });
      document.addEventListener('view:change', e => { state.view = e.detail.view; render(); });
    }

    gridHost.addEventListener('click', e => {
      if (e.target.closest('#empty-reset')) {
        state.type = 'all'; state.tag = ''; state.q = ''; state.sort = 'featured';
        if (tabsHost) {
          tabsHost.querySelectorAll('.filter-btn').forEach(b => {
            const isAll = b.dataset.filter === 'all';
            b.classList.toggle('is-active', isAll);
            b.setAttribute('aria-pressed', isAll ? 'true' : 'false');
          });
        }
        render();
        return;
      }
      const btn = e.target.closest('[data-action="add-to-cart"]');
      if (!btn) return;
      const card = btn.closest('[data-id]');
      if (!card) return;
      document.dispatchEvent(new CustomEvent('cart:add', { detail: { id: card.dataset.id } }));
    });

    /* ── Self-test: verify the tag filter logic on the loaded data ── */
    if (state.tag) {
      const fn = TAG_FILTERS[state.tag];
      if (fn) {
        const matches = allItems.filter(fn);
        console.info(
          `[IT Zone] SELF-TEST tag="${state.tag}" → ${matches.length} matches. ` +
          `Sample: ${matches.slice(0,3).map(m => m.brand + ' ' + m.model + ' @' + m.price).join(' | ') || '(none)'}`
        );
        if (matches.length === 0) {
          console.warn('[IT Zone] SELF-TEST: 0 matches — filter logic or data issue.');
        }
        /* Sanity: confirm none of the loaded items that match are outside the range */
        if (state.tag === '50k-70k') {
          const bad = matches.filter(m => Number(m.price) < 50000 || Number(m.price) > 70000);
          if (bad.length > 0) {
            console.error('[IT Zone] SELF-TEST: filter passed items outside range!', bad);
          } else {
            console.info('[IT Zone] SELF-TEST: all 50k-70k matches are within range ✓');
          }
        }
      }
    }

    /* ── Self-test: verify the tag filter logic on the loaded data ── */
    if (state.tag) {
      const fn = TAG_FILTERS[state.tag];
      if (fn) {
        const matches = allItems.filter(fn);
        console.info(
          `[IT Zone] SELF-TEST tag="${state.tag}" → ${matches.length} matches. ` +
          `Sample: ${matches.slice(0,3).map(m => m.brand + ' ' + m.model + ' @' + m.price).join(' | ') || '(none)'}`
        );
        if (matches.length === 0) {
          console.warn('[IT Zone] SELF-TEST: 0 matches — filter logic or data issue.');
        }
        /* Sanity: confirm none of the loaded items that match are outside the range */
        if (state.tag === '50k-70k') {
          const bad = matches.filter(m => Number(m.price) < 50000 || Number(m.price) > 70000);
          if (bad.length > 0) {
            console.error('[IT Zone] SELF-TEST: filter passed items outside range!', bad);
          } else {
            console.info('[IT Zone] SELF-TEST: all 50k-70k matches are within range ✓');
          }
        }
      }
    }

    /* ── Self-test: verify the tag filter logic on the loaded data ── */
    if (state.tag) {
      const fn = TAG_FILTERS[state.tag];
      if (fn) {
        const matches = allItems.filter(fn);
        console.info(
          `[IT Zone] SELF-TEST tag="${state.tag}" → ${matches.length} matches. ` +
          `Sample: ${matches.slice(0,3).map(m => m.brand + ' ' + m.model + ' @' + m.price).join(' | ') || '(none)'}`
        );
        if (matches.length === 0) {
          console.warn('[IT Zone] SELF-TEST: 0 matches — filter logic or data issue.');
        }
        /* Sanity: confirm none of the loaded items that match are outside the range */
        if (state.tag === '50k-70k') {
          const bad = matches.filter(m => Number(m.price) < 50000 || Number(m.price) > 70000);
          if (bad.length > 0) {
            console.error('[IT Zone] SELF-TEST: filter passed items outside range!', bad);
          } else {
            console.info('[IT Zone] SELF-TEST: all 50k-70k matches are within range ✓');
          }
        }
      }
    }

    /* ── Self-test: verify the tag filter logic on the loaded data ── */
    if (state.tag) {
      const fn = TAG_FILTERS[state.tag];
      if (fn) {
        const matches = allItems.filter(fn);
        console.info(
          `[IT Zone] SELF-TEST tag="${state.tag}" → ${matches.length} matches. ` +
          `Sample: ${matches.slice(0,3).map(m => m.brand + ' ' + m.model + ' @' + m.price).join(' | ') || '(none)'}`
        );
        if (matches.length === 0) {
          console.warn('[IT Zone] SELF-TEST: 0 matches — filter logic or data issue.');
        }
        /* Sanity: confirm none of the loaded items that match are outside the range */
        if (state.tag === '50k-70k') {
          const bad = matches.filter(m => Number(m.price) < 50000 || Number(m.price) > 70000);
          if (bad.length > 0) {
            console.error('[IT Zone] SELF-TEST: filter passed items outside range!', bad);
          } else {
            console.info('[IT Zone] SELF-TEST: all 50k-70k matches are within range ✓');
          }
        }
      }
    }

    render();
    console.info('[IT Zone] Loaded ' + allItems.length + ' items. Tag: "' + (state.tag || '—') + '"');
  }

  NS.inventoryPage = { init };
})();