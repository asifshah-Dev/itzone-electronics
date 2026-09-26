// assets/js/components/SortBar.js
/* ─────────────────────────────────────────────────────────
   Sort bar + (optional) type tabs.
   - Renders tabs, count, sort dropdown, view toggle in ONE row
   - Emits 'sort:change' and 'view:change'
   - Persists view + sort to localStorage
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const STORAGE_VIEW = 'itz.view';
  const STORAGE_SORT = 'itz.sort';

  const SORT_OPTIONS = [
    { id: 'featured',   label: 'Featured' },
    { id: 'price-asc',  label: 'Price: Low to High' },
    { id: 'price-desc', label: 'Price: High to Low' },
    { id: 'model-asc',  label: 'Model: A to Z' },
    { id: 'ram-desc',   label: 'RAM: High to Low' },
    { id: 'ssd-desc',   label: 'Storage: High to Low' }
  ];

  function readStored(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
  }
  function writeStored(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  /* options: { initialView, tabs: [{id,label}], activeTab } */
  function template(view, sort, tabs, activeTab) {
    const options = SORT_OPTIONS.map(function (o) {
      return '<option value="' + o.id + '"' + (o.id === sort ? ' selected' : '') + '>' + o.label + '</option>';
    }).join('');

    const gridActive = view !== 'list';
    const listActive = view === 'list';

    /* Optional tabs on the left */
    const tabsHtml = (tabs && tabs.length)
      ? '<div class="sort-bar-tabs" role="group" aria-label="Filter by type">' +
          tabs.map(function (t) {
            const active = t.id === activeTab;
            return '<button type="button" ' +
                     'class="filter-btn' + (active ? ' is-active' : '') + '" ' +
                     'data-filter="' + t.id + '" ' +
                     'aria-pressed="' + (active ? 'true' : 'false') + '">' +
                     t.label +
                   '</button>';
          }).join('') +
        '</div>'
      : '';

    return (
      '<div class="sort-bar">' +

        tabsHtml +

        '<div class="sort-bar-count">' +
          '<span id="sort-bar-count-value">0</span>' +
          '<span class="sort-bar-count-label">items</span>' +
        '</div>' +

        '<div class="sort-bar-controls">' +
          '<label for="sort-select" class="sort-bar-label">' +
            '<i data-lucide="arrow-up-down"></i>' +
            '<span class="visually-hidden">Sort by</span>' +
          '</label>' +
          '<select id="sort-select" class="sort-select" aria-label="Sort by">' +
            options +
          '</select>' +

          '<div class="view-toggle" role="group" aria-label="View mode">' +
            '<button type="button" ' +
                    'class="view-btn' + (gridActive ? ' is-active' : '') + '" ' +
                    'data-view="grid" ' +
                    'aria-pressed="' + (gridActive ? 'true' : 'false') + '" ' +
                    'aria-label="Grid view">' +
              '<i data-lucide="layout-grid"></i>' +
            '</button>' +
            '<button type="button" ' +
                    'class="view-btn' + (listActive ? ' is-active' : '') + '" ' +
                    'data-view="list" ' +
                    'aria-pressed="' + (listActive ? 'true' : 'false') + '" ' +
                    'aria-label="List view">' +
              '<i data-lucide="list"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +

      '</div>'
    );
  }

  /* options: { initialView, tabs, activeTab, onTabChange } */
  function mount(host, options) {
    if (!host) return;
    if (host.dataset.mounted === 'true') return;
    host.dataset.mounted = 'true';

    options = options || {};
    const initialView = options.initialView || readStored(STORAGE_VIEW, 'grid');
    const initialSort = readStored(STORAGE_SORT, 'featured');
    const tabs = options.tabs || [];
    const activeTab = options.activeTab || 'all';

    host.innerHTML = template(initialView, initialSort, tabs, activeTab);

    /* Sort change */
    const select = host.querySelector('#sort-select');
    if (select) {
      select.addEventListener('change', function () {
        writeStored(STORAGE_SORT, select.value);
        document.dispatchEvent(new CustomEvent('sort:change', {
          detail: { sort: select.value }
        }));
      });
    }

    /* View change */
    const viewBtns = host.querySelectorAll('.view-btn');
    viewBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        viewBtns.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        const newView = btn.dataset.view;
        writeStored(STORAGE_VIEW, newView);
        document.dispatchEvent(new CustomEvent('view:change', {
          detail: { view: newView }
        }));
      });
    });

    /* Tabs */
    const tabsHost = host.querySelector('.sort-bar-tabs');
    if (tabsHost && typeof options.onTabChange === 'function') {
      tabsHost.addEventListener('click', function (e) {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        tabsHost.querySelectorAll('.filter-btn').forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        options.onTabChange(btn.dataset.filter);
      });
    }
  }

  function setCount(n) {
    const el = document.getElementById('sort-bar-count-value');
    if (el) el.textContent = n;
  }

  NS.SortBar = {
    mount: mount,
    setCount: setCount,
    getStoredView: function () { return readStored(STORAGE_VIEW, 'grid'); },
    getStoredSort: function () { return readStored(STORAGE_SORT, 'featured'); }
  };
})();