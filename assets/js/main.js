// assets/js/main.js
/* ─────────────────────────────────────────────────────────
   App bootstrap. Mounts chrome, then routes page content.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  if (window.ITZone?.__booted) {
    console.info('[IT Zone] already booted — skip.');
    return;
  }

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
    } catch (err) {
      console.error('[IT Zone] Lucide render failed:', err);
    }
  };

  function vendorStatus() {
    return {
      bootstrap: typeof window.bootstrap !== 'undefined',
      lucide:    typeof window.lucide !== 'undefined' &&
                 typeof window.lucide.createIcons === 'function',
    };
  }

  const ROUTES = {
    home:      () => window.ITZone.Hero?.mount(),
    inventory: () => window.ITZone.inventoryPage?.init(),
    pcs:       () => window.ITZone.pcsPage?.init(),
  };

  function boot() {
    const page = document.body.dataset.page || 'home';
    const vendors = vendorStatus();

    try { ITZone.Navbar?.mount(); } catch (e) { console.error('Navbar:', e); }
    try { ITZone.Footer?.mount(); } catch (e) { console.error('Footer:', e); }

    const main = document.getElementById('main');
    if (main && !main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
    }

    ITZone.renderIcons();

    const route = ROUTES[page];
    if (route) {
      try { route(); } catch (e) { console.error(`Route "${page}" error:`, e); }
    }

    const ok = (b) => b ? '✓' : '✗';
    console.info(
      `[IT Zone] booted — page="${page}" | ` +
      `bootstrap ${ok(vendors.bootstrap)} | lucide ${ok(vendors.lucide)}`
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();