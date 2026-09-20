// assets/js/main.js
/* ─────────────────────────────────────────────────────────
   App bootstrap (classic script, deferred).
   Step 3: adds Lucide icon rendering + debug helpers.
   Step 6: upgrades to `type="module"` with routing.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const ITZone = {
    /** Re-render all Lucide placeholders currently in the DOM. */
    renderIcons(root) {
      if (typeof window.lucide?.createIcons !== 'function') return;
      window.lucide.createIcons({
        nameAttr: 'data-lucide',
        attrs: { 'stroke-width': 2, 'aria-hidden': 'true' },
        ...(root ? { root } : {}),
      });
    },
  };

  // Expose a tiny namespace for later steps. Not a global
  // god-object — just a hook so page modules can call it.
  window.ITZone = ITZone;

  function boot() {
    const page = document.body.dataset.page || 'home';
    console.info(`[IT Zone] booted — page="${page}"`);
    console.info(`[IT Zone] bootstrap ${window.bootstrap ? '✓' : '✗'} | lucide ${window.lucide ? '✓' : '✗'}`);

    // Ensure skip-link target can take focus
    const main = document.getElementById('main');
    if (main && !main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
    }

    // Render icons on first paint
    ITZone.renderIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();