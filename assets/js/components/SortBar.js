// assets/js/components/SortBar.js
/* ─────────────────────────────────────────────────────────
   Sort dropdown + grid/list view toggle.
   Emits 'sort:change' and 'view:change' on document.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const SORT_OPTIONS = [
    { id: 'featured',   label: 'Featured' },
    { id: 'price-asc',  label: 'Price: Low to High' },
    { id: 'price-desc', label: 'Price: High to Low' },
    { id: 'model-asc',  label: 'Model: A to Z' },
    { id: 'ram-desc',   label: 'RAM: High to Low' },
    { id: 'ssd-desc',   label: 'Storage: High to Low' },
  ];

  function template() {
    const options = SORT_OPTIONS.map(o => `
      <option value="${o.id}">${o.label}</option>
    `).join('');

    return `
      <div class="sort-bar">
        <div class="sort-bar-count">
          <span id="sort-bar-count-value">0</span>
          <span class="sort-bar-count-label">items</span>
        </div>

        <div class="sort-bar-controls">
          <label for="sort-select" class="sort-bar-label">
            <i data-lucide="arrow-up-down"></i>
            <span class="visually-hidden">Sort by</span>
          </label>
          <select id="sort-select" class="sort-select" aria-label="Sort by">
            ${options}
          </select>

          <div class="view-toggle" role="group" aria-label="View mode">
            <button type="button"
                    class="view-btn is-active"
                    data-view="grid"
                    aria-pressed="true"
                    aria-label="Grid view">
              <i data-lucide="layout-grid"></i>
            </button>
            <button type="button"
                    class="view-btn"
                    data-view="list"
                    aria-pressed="false"
                    aria-label="List view">
              <i data-lucide="list"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function mount(host) {
    if (!host) return;
    if (host.dataset.mounted === 'true') return;
    host.dataset.mounted = 'true';

    host.innerHTML = template();

    const select = host.querySelector('#sort-select');
    const viewBtns = host.querySelectorAll('.view-btn');

    select.addEventListener('change', () => {
      document.dispatchEvent(new CustomEvent('sort:change', {
        detail: { sort: select.value }
      }));
    });

    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        document.dispatchEvent(new CustomEvent('view:change', {
          detail: { view: btn.dataset.view }
        }));
      });
    });
  }

  /* Called by the page controller to update the visible count */
  function setCount(n) {
    const el = document.getElementById('sort-bar-count-value');
    if (el) el.textContent = n;
  }

  NS.SortBar = { mount, setCount };
})();