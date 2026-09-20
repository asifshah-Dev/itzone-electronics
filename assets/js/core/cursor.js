// assets/js/core/cursor.js
/* ─────────────────────────────────────────────────────────
   Custom cursor v3 — precise dot + smooth trailing pill.
   - Dot snaps to the pointer (instant feedback)
   - Ring eases behind with a spring feel
   - Ring grows into a pill with a label on data-cursor
   - Ripple on click
   - Disabled on touch / reduced-motion
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH   = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  if (REDUCED || TOUCH) {
    NS.Cursor = { init: function () {} };
    return;
  }

  const HOVER_SELECTORS = [
    'a', 'button',
    'input[type="submit"]', 'input[type="button"]',
    '[role="button"]',
    '.product-card', '.filter-btn', '.cat-link', '.social-link',
    '.nav-link', '.mobile-link', '.drawer-cat', '.view-btn',
    '.product-order-wa', '.btn', '.sort-select',
  ].join(',');

  const TEXT_SELECTORS = [
    'input[type="text"]', 'input[type="search"]',
    'input[type="email"]', 'input[type="tel"]',
    'input[type="password"]', 'input[type="number"]',
    'textarea',
  ].join(',');

  let ring, dot, label;
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let rafId = null;
  let visible = false;

  function create() {
    ring = document.createElement('div');
    ring.className = 'cur-ring is-hidden';
    ring.innerHTML = '<span class="cur-ring-label"></span>';
    label = ring.querySelector('.cur-ring-label');

    dot = document.createElement('div');
    dot.className = 'cur-dot is-hidden';

    document.body.appendChild(ring);
    document.body.appendChild(dot);
    document.body.classList.add('has-cursor');
  }

  function setVisible(on) {
    if (on === visible) return;
    visible = on;
    ring.classList.toggle('is-hidden', !on);
    dot.classList.toggle('is-hidden', !on);
  }

  function moveTo(x, y) {
    mx = x;
    my = y;
    dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    /* Spring feel — 0.22 for smooth but responsive */
    rx += (mx - rx) * 0.22;
    ry += (my - ry) * 0.22;

    ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)';

    if (Math.abs(mx - rx) > 0.15 || Math.abs(my - ry) > 0.15) {
      rafId = requestAnimationFrame(tick);
    } else {
      rx = mx; ry = my;
      rafId = null;
    }
  }

  function handleOver(e) {
    const t = e.target;
    if (!t || !(t instanceof Element)) return;

    /* Text input */
    if (t.matches(TEXT_SELECTORS) || t.closest(TEXT_SELECTORS)) {
      ring.classList.remove('is-hover', 'is-label');
      ring.classList.add('is-text');
      dot.classList.add('is-hidden-soft');
      return;
    }
    ring.classList.remove('is-text');
    dot.classList.remove('is-hidden-soft');

    /* Label cursor */
    const labelled = t.closest('[data-cursor]');
    if (labelled) {
      const text = labelled.getAttribute('data-cursor') || '';
      if (text) {
        ring.classList.add('is-hover', 'is-label');
        label.textContent = text;
        /* Set a pill width based on label length */
        ring.style.setProperty('--ring-pill-w', (text.length * 8 + 48) + 'px');
        return;
      }
    }

    /* Generic interactive */
    if (t.matches(HOVER_SELECTORS) || t.closest(HOVER_SELECTORS)) {
      ring.classList.add('is-hover');
      ring.classList.remove('is-label');
      label.textContent = '';
      return;
    }

    /* Default */
    ring.classList.remove('is-hover', 'is-label', 'is-text');
    label.textContent = '';
  }

  function down(e) {
    ring.classList.add('is-click');
    /* Ripple */
    if (!ring) return;
    const ripple = document.createElement('span');
    ripple.className = 'cur-ripple';
    const r = ring.getBoundingClientRect();
    ripple.style.left = (e.clientX - r.left) + 'px';
    ripple.style.top  = (e.clientY - r.top) + 'px';
    ring.appendChild(ripple);
    window.setTimeout(function () {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 550);
  }
  function up() { ring.classList.remove('is-click'); }

  function init() {
    if (document.body.dataset.cursorMounted === 'true') return;
    document.body.dataset.cursorMounted = 'true';

    create();

    window.addEventListener('mousemove', function (e) {
      setVisible(true);
      moveTo(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('mouseover', handleOver, { passive: true });
    window.addEventListener('mousedown', down, { passive: true });
    window.addEventListener('mouseup', up, { passive: true });
    document.addEventListener('mouseleave', function () { setVisible(false); });
    document.addEventListener('mouseenter', function () { setVisible(true); });
    window.addEventListener('blur', function () { setVisible(false); });
    window.addEventListener('focus', function () { setVisible(true); });
  }

  NS.Cursor = { init: init };
  console.info('[IT Zone] Cursor v3 loaded.');
})();