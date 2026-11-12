// assets/js/core/data.js
/* ─────────────────────────────────────────────────────────
   Data loader — API only (no JSON fallback).

   All products come from /api/products.php and /api/product.php.
   If the API errors, methods return empty / null and log a clear
   error. The calling page shows its existing error state.

   Shapes returned (unchanged from before, so pages keep working):
     - laptops()  -> [ {...}, ... ]
     - pcs()      -> { desktops: [...], tiny: [...], monitors: [...] }
     - product(id) -> single product object or null

   Image paths returned by the API look like:
       "uploads/products/LAP-0001-xxxx.jpg"
   The frontend's r() helper in ProductCard.js / product.page.js
   prepends "../" when in /pages/, so paths resolve correctly.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const IN_PAGES = /\/pages\//.test(window.location.pathname);

  function apiBase() { return IN_PAGES ? '../api' : 'api'; }

  async function fetchJSON(url, opts, timeoutMs) {
    const ctrl  = ('AbortController' in window) ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs || 10000) : null;
    try {
      const res = await fetch(url, Object.assign(
        { cache: 'no-store' },
        opts || {},
        ctrl ? { signal: ctrl.signal } : {}
      ));
      if (!res.ok) {
        // Read body for the API's JSON error if present (useful in console)
        let detail = '';
        try { detail = await res.text(); } catch (e) {}
        throw new Error(url + ' -> ' + res.status + (detail ? ' :: ' + detail.slice(0, 200) : ''));
      }
      return await res.json();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // Cache so page-to-page nav doesn't re-fetch within the session
  const cache = {
    laptops:  null,
    pcs:      null,
    products: new Map(),  // id -> product
  };

  function resetCache() {
    cache.laptops = null;
    cache.pcs = null;
    cache.products.clear();
  }

  /* ────────────────────────────────────────────────────────
     laptops() — array of laptop products
     ──────────────────────────────────────────────────────── */
  async function laptops() {
    if (cache.laptops) return cache.laptops;
    try {
      const data = await fetchJSON(`${apiBase()}/products.php?category=laptop`);
      cache.laptops = Array.isArray(data) ? data : [];
      return cache.laptops;
    } catch (err) {
      console.error('[IT Zone] Failed to load laptops from API.', err);
      return [];
    }
  }

  /* ────────────────────────────────────────────────────────
     pcs() — { desktops, tiny, monitors }
     ──────────────────────────────────────────────────────── */
  async function pcs() {
    if (cache.pcs) return cache.pcs;
    try {
      const data = await fetchJSON(`${apiBase()}/products.php?grouped=1`);
      // Ensure all three keys exist — pages assume them
      cache.pcs = {
        desktops: data && Array.isArray(data.desktops) ? data.desktops : [],
        tiny:     data && Array.isArray(data.tiny)     ? data.tiny     : [],
        monitors: data && Array.isArray(data.monitors) ? data.monitors : [],
      };
      return cache.pcs;
    } catch (err) {
      console.error('[IT Zone] Failed to load PCs from API.', err);
      return { desktops: [], tiny: [], monitors: [] };
    }
  }

  /* ────────────────────────────────────────────────────────
     product(id) — single product, fast path
     ──────────────────────────────────────────────────────── */
  async function product(id) {
    if (!id) return null;
    id = String(id);
    if (cache.products.has(id)) return cache.products.get(id);
    try {
      const data = await fetchJSON(`${apiBase()}/product.php?id=${encodeURIComponent(id)}`);
      if (data && data.ok && data.product) {
        cache.products.set(id, data.product);
        return data.product;
      }
      return null;
    } catch (err) {
      console.error('[IT Zone] Failed to load product "' + id + '" from API.', err);
      return null;
    }
  }

  NS.Data = {
    laptops: laptops,
    pcs:     pcs,
    product: product,
    resetCache: resetCache,
  };
})();