// assets/js/pages/404.page.js
/* ─────────────────────────────────────────────────────────
   Custom 404 page.
   - Wires the search box (Enter / button → inventory page)
   - Renders popular category pills from the same source
     the navbar uses (laptops.json + pcs.json)
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  /* Same definition as the navbar's buildCategories() */
  function buildCategories(data) {
    const laptops  = Array.isArray(data.laptops) ? data.laptops : [];
    const pcs      = data.pcs || {};
    const desktops = pcs.desktops || [];
    const tiny     = pcs.tiny     || [];
    const monitors = pcs.monitors || [];
    const allPCs   = [].concat(desktops, tiny, monitors);
    const combined = laptops.concat(allPCs);

    const candidates = [
      { id: '30k-50k', label: '30k to 50k',
        test: function (i) { const p = Number(i.price); return p > 30000 && p <= 50000; } },
      { id: '50k-70k', label: '50k to 70k',
        test: function (i) { const p = Number(i.price); return p > 50000 && p <= 70000; } },
      { id: '70k-plus', label: '70k Plus',
        test: function (i) { return Number(i.price) > 70000; } },
      { id: 'i5', label: 'Core i5',
        test: function (i) { return (i.cpu || '').toLowerCase().indexOf('i5') !== -1; } },
      { id: 'i7', label: 'Core i7',
        test: function (i) { return (i.cpu || '').toLowerCase().indexOf('i7') !== -1; } },
      { id: 'dell', label: 'Dell',
        test: function (i) { return i.brand === 'DELL'; } },
      { id: 'hp', label: 'HP',
        test: function (i) { return i.brand === 'HP'; } },
      { id: 'lenovo', label: 'Lenovo',
        test: function (i) { return i.brand === 'LENOVO'; } },
    ];

    return candidates
      .map(function (c) {
        return Object.assign({}, c, { _count: combined.filter(c.test).length });
      })
      .filter(function (c) { return c._count >= 2; })
      .map(function (c) { delete c._count; return c; });
  }

  /* Detect whether we're at the repo root or inside /pages/ */
  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function inventoryBase() {
    return isInPagesDir() ? 'inventory.html' : 'pages/inventory.html';
  }

  function goTo(url) {
    window.location.href = url;
  }

  function renderCategories(host, cats) {
    if (!host) return;
    if (!cats.length) {
      host.innerHTML = '<p class="not-found-empty">No categories available.</p>';
      return;
    }

    host.innerHTML = cats.map(function (c) {
      return '<button type="button" class="nf-cat" data-cat="' + c.id + '">' + c.label + '</button>';
    }).join('');

    host.addEventListener('click', function (e) {
      const btn = e.target.closest('.nf-cat');
      if (!btn) return;
      goTo(inventoryBase() + '?tag=' + encodeURIComponent(btn.dataset.cat));
    });
  }

  function wireSearch() {
    const input = document.getElementById('nf-search');
    const submit = document.getElementById('nf-search-submit');
    if (!input) return;

    function submitSearch() {
      const q = input.value.trim();
      if (!q) { input.focus(); return; }
      goTo(inventoryBase() + '?q=' + encodeURIComponent(q));
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitSearch();
      }
    });

    if (submit) {
      submit.addEventListener('click', function (e) {
        e.preventDefault();
        submitSearch();
      });
    }
  }

  async function init() {
    wireSearch();

    const catsHost = document.getElementById('nf-cats');
    if (!catsHost) return;

    /* Show a skeleton while we fetch */
    catsHost.innerHTML = '<span class="nf-cat nf-cat--skeleton"></span>' +
                         '<span class="nf-cat nf-cat--skeleton"></span>' +
                         '<span class="nf-cat nf-cat--skeleton"></span>' +
                         '<span class="nf-cat nf-cat--skeleton"></span>';

    try {
      const [laptops, pcs] = await Promise.all([
        NS.Data.laptops().catch(function () { return []; }),
        NS.Data.pcs().catch(function () { return {}; }),
      ]);
      const cats = buildCategories({ laptops: laptops, pcs: pcs });
      renderCategories(catsHost, cats);
    } catch (err) {
      console.error('[IT Zone] 404: category fetch failed.', err);
      catsHost.innerHTML = '';
    }

    console.info('[IT Zone] 404 page ready.');
  }

  NS.page404 = { init: init };
})();