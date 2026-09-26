// assets/js/components/IntroSplash.js
/* ─────────────────────────────────────────────────────────
   Intro splash — big "IT Zone Electronics" reveal on load
   with floating tech icons drifting around the edges.
   Stays up until the page is actually ready (or MAX_MS).
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  /* ── SETTINGS ───────────────────────────────────────── */
  const DESKTOP_MIN  = 0;       // 0 = all screen sizes
  const SESSION_LOCK = false;   // false = fires every page load

  const MIN_MS = 2600;          // minimum time on screen
  const MAX_MS = 6000;          // absolute max (safety net)

  /* ── Floating icons — scattered around the edges ────── */
  const FLOATING_ICONS = [
    /* Top row */
    { icon: 'laptop',      size: 'lg', pos: 'top-left',      dur: 7.5, delay: 0.0 },
    { icon: 'server',      size: 'md', pos: 'top-mid-left',  dur: 8.4, delay: 0.4 },
    { icon: 'cpu',         size: 'sm', pos: 'top-mid-right', dur: 6.8, delay: 0.8 },
    { icon: 'headphones',  size: 'lg', pos: 'top-right',     dur: 9.1, delay: 0.2 },

    /* Bottom row */
    { icon: 'hard-drive',  size: 'sm', pos: 'bot-left',      dur: 8.0, delay: 0.6 },
    { icon: 'monitor',     size: 'md', pos: 'bot-mid-left',  dur: 7.2, delay: 0.9 },
    { icon: 'smartphone',  size: 'sm', pos: 'bot-mid-right', dur: 8.7, delay: 0.3 },
    { icon: 'keyboard',    size: 'lg', pos: 'bot-right',     dur: 7.8, delay: 0.7 },

    /* Tiny accents */
    { icon: 'wifi',            size: 'xs', pos: 'accent-1', dur: 6.4, delay: 0.5 },
    { icon: 'battery-charging',size: 'xs', pos: 'accent-2', dur: 8.2, delay: 0.1 },
    { icon: 'usb',             size: 'xs', pos: 'accent-3', dur: 7.6, delay: 0.8 },
    { icon: 'tablet',          size: 'xs', pos: 'accent-4', dur: 6.9, delay: 0.4 }
  ];

  function iconsMarkup() {
    return FLOATING_ICONS.map(function (ic) {
      return (
        '<div class="intro-icon intro-icon--' + ic.size + ' intro-icon--' + ic.pos + '"' +
        '     style="--drift-dur: ' + ic.dur + 's; --drift-delay: ' + ic.delay + 's;">' +
          '<i data-lucide="' + ic.icon + '"></i>' +
        '</div>'
      );
    }).join('');
  }

  function shouldRun() {
    if (window.innerWidth < DESKTOP_MIN) return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (SESSION_LOCK && sessionStorage.getItem('itzone-intro-shown') === '1') return false;
    return true;
  }

  function template() {
    return `
      <div class="intro-splash" role="presentation" aria-hidden="true">
        <div class="intro-splash__icons" aria-hidden="true">
          ${iconsMarkup()}
        </div>
        <div class="intro-splash__inner">
          <span class="intro-splash__word intro-splash__word--it">IT</span>
          <span class="intro-splash__word intro-splash__word--zone">Zone</span>
          <span class="intro-splash__word intro-splash__word--elec">Electronics</span>
        </div>
      </div>
    `;
  }

  function mount() {
    if (!shouldRun()) return;

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const wrap = document.createElement('div');
    wrap.innerHTML = template();
    const splash = wrap.firstElementChild;
    document.body.appendChild(splash);

    /* Render the Lucide icons inside the splash */
    NS.renderIcons?.(splash);

    if (SESSION_LOCK) {
      try { sessionStorage.setItem('itzone-intro-shown', '1'); } catch (e) {}
    }

    const startedAt = performance.now();
    let removed = false;

    function removeSplash() {
      if (removed) return;
      removed = true;
      splash.classList.add('is-leaving');

      splash.addEventListener('transitionend', function onEnd(e) {
        if (e.propertyName !== 'opacity') return;
        splash.removeEventListener('transitionend', onEnd);
        splash.remove();
        document.documentElement.style.overflow = prevOverflow;
      });

      window.setTimeout(function () {
        if (splash.isConnected) {
          splash.remove();
          document.documentElement.style.overflow = prevOverflow;
        }
      }, 800);
    }

    function tryFinish() {
      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, MIN_MS - elapsed);
      window.setTimeout(removeSplash, remaining);
    }

    if (document.readyState === 'complete') {
      tryFinish();
    } else {
      window.addEventListener('load', tryFinish, { once: true });
    }

    window.setTimeout(function () {
      removeSplash();
    }, MAX_MS);
  }

  NS.IntroSplash = { mount };
})();