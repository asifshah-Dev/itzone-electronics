// assets/js/core/data.js
/* ─────────────────────────────────────────────────────────
   Data loader.
   Reads JSON from /data/ (works from / and /pages/).
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  function resolveDataPath(file) {
    const inPages = /\/pages\//.test(window.location.pathname);
    return inPages ? `../data/${file}` : `data/${file}`;
  }

  async function loadJSON(file) {
    const url = resolveDataPath(file);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
    return res.json();
  }

  NS.Data = {
    laptops: () => loadJSON('laptops.json'),
    pcs:     () => loadJSON('pcs.json'),
  };
})();