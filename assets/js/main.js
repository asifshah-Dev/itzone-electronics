// assets/js/main.js
/* ─────────────────────────────────────────────────────────
   App bootstrap. Idempotent.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  if (window.ITZone?.__booted) return;
  const ITZone = (window.ITZone = window.ITZone || {});
  ITZone.__booted = true;

  ITZone.renderIcons = function (root) {
    if (typeof window.lucide?.createIcons !== 'function') {
      if (!ITZone._warnedLucide) {
        console.warn('[IT Zone] Lucide missing — icons skipped.');
        ITZone._warnedLucide = true;
      }
      return;
    }
    try {
      window.lucide.createIcons({
        nameAttr: 'data-lucide',
        attrs: { 'stroke-width': 2, 'aria-hidden': 'true' },
        ...(root ? { root } : {}),
      });
    } catch (err) { console.error('[IT Zone] Lucide render failed:', err); }
  };

  function vendorStatus() {
    return {
      bootstrap: typeof window.bootstrap !== 'undefined',
      lucide:    typeof window.lucide !== 'undefined' &&
                 typeof window.lucide.createIcons === 'function',
    };
  }

  const ROUTES = {
    home:      () => window.ITZone.homePage?.init(),
    inventory: () => window.ITZone.inventoryPage?.init(),
    pcs:       () => window.ITZone.pcsPage?.init(),
    product:   () => window.ITZone.productPage?.init(),
    contact:   () => window.ITZone.contactPage?.init(),
    '404':     () => window.ITZone.page404?.init(),
  };

  function boot() {
    const page = document.body.dataset.page || 'home';
    const vendors = vendorStatus();

    try { ITZone.Navbar?.mount(); } catch (e) { console.error('Navbar:', e); }
    try { ITZone.Footer?.mount(); } catch (e) { console.error('Footer:', e); }
    try { ITZone.Cursor?.init(); } catch (e) { console.error('Cursor:', e); }

    try {
      if (ITZone.Reviews && typeof ITZone.Reviews.mount === 'function') {
        if (document.getElementById('reviews-slot')) ITZone.Reviews.mount();
      }
    } catch (e) { console.error('Reviews:', e); }

    const main = document.getElementById('main');
    if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');

    ITZone.renderIcons();

    const route = ROUTES[page];
    if (route) {
      try { route(); } catch (e) { console.error(`Route "${page}" error:`, e); }
    }

    const ok = (b) => b ? '✓' : '✗';
    console.info(
      `[IT Zone] booted — page="${page}" | bootstrap ${ok(vendors.bootstrap)} | lucide ${ok(vendors.lucide)}`
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else { boot(); }
})();