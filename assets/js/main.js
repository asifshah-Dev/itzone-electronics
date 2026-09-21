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
  };

  function boot() {
    const page = document.body.dataset.page || 'home';
    const vendors = vendorStatus();

    /* ── Diagnostic banner ─────────────────────────────── */
    console.group('[IT Zone] Boot — ' + page);
    console.log('Data:',        typeof ITZone.Data);
    console.log('WhatsApp:',    typeof ITZone.WhatsApp);
    console.log('Cursor:',      typeof ITZone.Cursor);
    console.log('Navbar:',      typeof ITZone.Navbar);
    console.log('Footer:',      typeof ITZone.Footer);
    console.log('Hero:',        typeof ITZone.Hero);
    console.log('Reviews:',     typeof ITZone.Reviews);
    console.log('ProductCard:', typeof ITZone.ProductCard);
    console.log('ProductGrid:', typeof ITZone.ProductGrid);
    console.log('SortBar:',     typeof ITZone.SortBar);
    console.log('homePage:',    typeof ITZone.homePage);
    console.log('inventoryPage:', typeof ITZone.inventoryPage);
    console.log('pcsPage:',     typeof ITZone.pcsPage);
    console.log('productPage:', typeof ITZone.productPage);
    console.log('contactPage:', typeof ITZone.contactPage);
    console.groupEnd();

    /* ── Chrome ────────────────────────────────────────── */
    try { ITZone.Navbar?.mount(); } catch (e) { console.error('Navbar mount:', e); }
    try { ITZone.Footer?.mount(); } catch (e) { console.error('Footer mount:', e); }
    try { ITZone.Cursor?.init(); } catch (e) { console.error('Cursor init:', e); }

    /* ── Reviews — mount on ANY page that has a slot ───── */
    try {
      if (ITZone.Reviews && typeof ITZone.Reviews.mount === 'function') {
        const hasSlot = document.getElementById('reviews-slot');
        if (hasSlot) {
          console.info('[IT Zone] Mounting reviews into #reviews-slot...');
          ITZone.Reviews.mount();
        }
      } else {
        console.warn('[IT Zone] Reviews module not loaded.');
      }
    } catch (e) { console.error('Reviews mount:', e); }

    /* ── Focus target for skip link ───────────────────── */
    const main = document.getElementById('main');
    if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');

    /* ── Icons ─────────────────────────────────────────── */
    ITZone.renderIcons();

    /* ── Route ─────────────────────────────────────────── */
    const route = ROUTES[page];
    if (route) {
      try { route(); } catch (e) { console.error(`Route "${page}" error:`, e); }
    } else {
      console.warn('[IT Zone] No route registered for page="' + page + '"');
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