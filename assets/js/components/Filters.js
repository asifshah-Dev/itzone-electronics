 
// assets/js/components/Filters.js
/* ─────────────────────────────────────────────────────────
   Brand filter buttons.
   Emits 'filter:change' CustomEvent on document.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const BRANDS = [
    { id: 'all',    label: 'All' },
    { id: 'DELL',   label: 'Dell' },
    { id: 'HP',     label: 'HP' },
    { id: 'LENOVO', label: 'Lenovo' },
  ];

  function template() {
    return BRANDS.map(b => `
      <button type="button"
              class="filter-btn${b.id === 'all' ? ' is-active' : ''}"
              data-filter="${b.id}"
              aria-pressed="${b.id === 'all' ? 'true' : 'false'}">
        ${b.label}
      </button>
    `).join('');
  }

  function mount(host) {
    if (!host) return;
    if (host.dataset.mounted === 'true') return;
    host.dataset.mounted = 'true';

    host.innerHTML = template();

    host.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      host.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');

      document.dispatchEvent(new CustomEvent('filter:change', {
        detail: { brand: btn.dataset.filter }
      }));
    });
  }

  NS.Filters = { mount };
})();