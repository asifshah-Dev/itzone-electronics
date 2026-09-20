// assets/js/main.js
/* ─────────────────────────────────────────────────────────
   App bootstrap (classic script, deferred).
   Step 4: mounts Navbar + Footer on every page.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const ITZone = (window.ITZone = window.ITZone || {});

  /** Re-render all Lucide placeholders currently in the DOM. */
  ITZone.renderIcons = function (root) {
    if (typeof window.lucide?.createIcons !== 'function') return;
    window.lucide.createIcons({
      nameAttr: 'data-lucide',
      attrs: { 'stroke-width': 2, 'aria-hidden': 'true' },
      ...(root ? { root } : {}),
    });
  };

  function boot() {
    const page = document.body.dataset.page || 'home';

    // Mount persistent chrome
    ITZone.Navbar?.mount();
    ITZone.Footer?.mount();

    console.info(`[IT Zone] booted — page="${page}"` +
      ` | bootstrap ${window.bootstrap ? '✓' : '✗'}` +
      ` | lucide ${window.lucide ? '✓' : '✗'}`);

    // Ensure skip-link target is focusable
    const main = document.getElementById('main');
    if (main && !main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
    }

    // Icons inside dynamically injected chrome
    ITZone.renderIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();