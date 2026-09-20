// assets/js/components/SearchBar.js
/* ─────────────────────────────────────────────────────────
   Inventory search bar (in-page).
   Reads ?q= from URL on load, emits 'search:change'.
   Syncs the navbar search input too.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const DEBOUNCE_MS = 220;

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function readQueryFromURL() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('q') || '').trim();
  }

  function writeQueryToURL(q) {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set('q', q);
    else   url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  }

  function template(initial) {
    return `
      <label for="page-search" class="visually-hidden">Search laptops</label>
      <i data-lucide="search" class="page-search-icon" aria-hidden="true"></i>
      <input type="search"
             id="page-search"
             class="page-search-input"
             placeholder="Search by model, CPU, RAM…"
             autocomplete="off"
             value="${initial.replace(/"/g, '&quot;')}">
      <button type="button" class="page-search-clear" id="page-search-clear"
              aria-label="Clear search">
        <i data-lucide="x"></i>
      </button>
    `;
  }

  function mount(host, initialQuery) {
    if (!host) return;
    if (host.dataset.mounted === 'true') return;
    host.dataset.mounted = 'true';

    const initial = initialQuery ?? readQueryFromURL();
    host.innerHTML = template(initial);

    const input = host.querySelector('#page-search');
    const clear = host.querySelector('#page-search-clear');

    // Sync navbar search input on load
    const navInput = document.getElementById('nav-search-input');
    if (navInput) navInput.value = initial;

    const emit = debounce((val) => {
      writeQueryToURL(val);
      // keep navbar input in sync
      if (navInput && navInput.value !== val) navInput.value = val;
      document.dispatchEvent(new CustomEvent('search:change', {
        detail: { query: val }
      }));
    }, DEBOUNCE_MS);

    input.addEventListener('input', (e) => emit(e.target.value));

    clear.addEventListener('click', () => {
      input.value = '';
      input.focus();
      emit('');
    });

    // If the user edits the navbar input while on this page, mirror it
    if (navInput) {
      navInput.addEventListener('input', (e) => {
        if (input.value !== e.target.value) {
          input.value = e.target.value;
          emit(e.target.value);
        }
      });
    }
  }

  NS.SearchBar = { mount, readQueryFromURL };
})();