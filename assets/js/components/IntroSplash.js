// assets/js/components/IntroSplash.js
/* ─────────────────────────────────────────────────────────
   Intro splash — Aurora Curtain (fast + no jiggle).
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const DESKTOP_MIN  = 0;
  const SESSION_LOCK = false;

  /* Tighter timings — entire splash done in ~2.4s */
  const MIN_MS = 2200;
  const MAX_MS = 4000;

  const ORBIT_ICONS = [
    { icon: 'laptop',           size: 'lg', ring: 'inner', angle: 0   },
    { icon: 'cpu',              size: 'md', ring: 'inner', angle: 60  },
    { icon: 'monitor',          size: 'lg', ring: 'inner', angle: 120 },
    { icon: 'hard-drive',       size: 'md', ring: 'inner', angle: 180 },
    { icon: 'headphones',       size: 'lg', ring: 'inner', angle: 240 },
    { icon: 'smartphone',       size: 'md', ring: 'inner', angle: 300 },
    { icon: 'keyboard',         size: 'md', ring: 'outer', angle: 30  },
    { icon: 'server',           size: 'md', ring: 'outer', angle: 90  },
    { icon: 'tablet',           size: 'sm', ring: 'outer', angle: 150 },
    { icon: 'wifi',             size: 'sm', ring: 'outer', angle: 210 },
    { icon: 'battery-charging', size: 'sm', ring: 'outer', angle: 270 },
    { icon: 'usb',              size: 'sm', ring: 'outer', angle: 330 }
  ];

  function orbitMarkup() {
    return ORBIT_ICONS.map(function (ic) {
      return (
        '<div class="orbit-icon orbit-icon--' + ic.size + ' orbit-icon--' + ic.ring + '"' +
        '     style="--angle:' + ic.angle + 'deg;">' +
          '<div class="orbit-icon__inner">' +
            '<i data-lucide="' + ic.icon + '"></i>' +
          '</div>' +
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
        <div class="aurora">
          <div class="aurora__streak aurora__streak--1"></div>
          <div class="aurora__streak aurora__streak--2"></div>
          <div class="aurora__streak aurora__streak--3"></div>
        </div>

        <div class="orbit">
          <div class="orbit__ring orbit__ring--inner"></div>
          <div class="orbit__ring orbit__ring--outer"></div>
          <div class="orbit__icons">${orbitMarkup()}</div>
        </div>

        <div class="intro-text">
          <span class="intro-text__slot">
            <span class="intro-text__word intro-text__word--it">IT</span>
          </span>
          <span class="intro-text__slot">
            <span class="intro-text__word intro-text__word--zone">ZONE</span>
          </span>
          <span class="intro-text__slot intro-text__slot--elec">
            <span class="intro-text__word intro-text__word--elec">ELECTRONICS</span>
          </span>
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
      }, 900);
    }

    function tryFinish() {
      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, MIN_MS - elapsed);
      window.setTimeout(removeSplash, remaining);
    }

    if (document.readyState === 'complete') tryFinish();
    else window.addEventListener('load', tryFinish, { once: true });

    window.setTimeout(removeSplash, MAX_MS);
  }

  NS.IntroSplash = { mount: mount };
})();