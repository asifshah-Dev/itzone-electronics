// assets/js/components/SortBar.js
/* ─────────────────────────────────────────────────────────
   Sort dropdown + grid/list view toggle.
   - Reads initial view from localStorage (fallback: 'grid')
   - Emits 'sort:change' and 'view:change'
   - Persists view choice in localStorage
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const STORAGE_KEY = 'itz.view';
  const SORT_STORAGE_KEY = 'itz.sort';

  const SORT_OPTIONS = [
    { id: 'featured',   label: 'Featured' },
    { id: 'price-asc',  label: 'Price: Low to High' },
    { id: 'price-desc', label: 'Price: High to Low' },
    { id: 'model-asc',  label: 'Model: A to Z' },
    { id: 'ram-desc',   label: 'RAM: High to Low' },
    { id: 'ssd-desc',   label: 'Storage: High to Low' },
  ];

  /* Read from localStorage (safely) */
  function readStored(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v || fallback;
    } catch (e) { return fallback; }
  }
  function writeStored(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function template(view) {
    const options = SORT_OPTIONS.map(function (o) {
      return '<option value="' + o.id + '">' + o.label + '</option>';
    }).join('');

    const gridActive = view !== 'list';
    const listActive = view === 'list';

    return (
      '<div class="sort-bar">' +
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

  function mount(host, initialView) {
    if (!host) return;
    if (host.dataset.mounted === 'true') return;
    host.dataset.mounted = 'true';

    /* Resolve view: URL → localStorage → 'grid' */
    const view = initialView ||
                 readStored(STORAGE_KEY, 'grid');
    const storedSort = readStored(SORT_STORAGE_KEY, 'featured');

    host.innerHTML = template(view);

    const select = host.querySelector('#sort-select');
    if (select && storedSort) select.value = storedSort;

    const viewBtns = host.querySelectorAll('.view-btn');

    /* Sort change */
    if (select) {
      select.addEventListener('change', function () {
        writeStored(SORT_STORAGE_KEY, select.value);
        document.dispatchEvent(new CustomEvent('sort:change', {
          detail: { sort: select.value }
        }));
      });
    }

    /* View change */
    viewBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        viewBtns.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        const newView = btn.dataset.view;
        writeStored(STORAGE_KEY, newView);
        document.dispatchEvent(new CustomEvent('view:change', {
          detail: { view: newView }
        }));
      });
    });
  }

  function setCount(n) {
    const el = document.getElementById('sort-bar-count-value');
    if (el) el.textContent = n;
  }

  NS.SortBar = {
    mount: mount,
    setCount: setCount,
    getStoredView: function () { return readStored(STORAGE_KEY, 'grid'); },
    getStoredSort: function () { return readStored(SORT_STORAGE_KEY, 'featured'); }
  };
})();