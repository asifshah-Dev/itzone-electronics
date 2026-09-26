// assets/js/components/Hero.js
/* ─────────────────────────────────────────────────────────
   Hero — typographic hero with gradient blobs AND floating
   tech icons scattered around the edges.
   Icons drift on their own and push away from the cursor.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function r(href) {
    if (href.startsWith('#')) return isInPagesDir() ? `../index.html${href}` : href;
    if (/^https?:|^tel:|^mailto:/.test(href)) return href;
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  /* ── Floating icons — positioned around the edges ──────── */
  const FLOATING_ICONS = [
    /* Top row */
    { icon: 'laptop',        size: 'lg', pos: 'top-left',      dur: 7.5,  delay: 0.0 },
    { icon: 'server',        size: 'md', pos: 'top-mid-left',  dur: 8.4,  delay: 1.2 },
    { icon: 'cpu',           size: 'sm', pos: 'top-mid-right', dur: 6.8,  delay: 0.6 },
    { icon: 'headphones',    size: 'lg', pos: 'top-right',     dur: 9.1,  delay: 1.8 },

    /* Bottom row */
    { icon: 'hard-drive',    size: 'sm', pos: 'bot-left',      dur: 8.0,  delay: 0.3 },
    { icon: 'monitor',       size: 'md', pos: 'bot-mid-left',  dur: 7.2,  delay: 1.5 },
    { icon: 'smartphone',    size: 'sm', pos: 'bot-mid-right', dur: 8.7,  delay: 0.9 },
    { icon: 'keyboard',      size: 'lg', pos: 'bot-right',     dur: 7.8,  delay: 2.1 },

    /* Tiny accents */
    { icon: 'wifi',          size: 'xs', pos: 'accent-1',      dur: 6.4,  delay: 0.5 },
    { icon: 'battery-charging', size: 'xs', pos: 'accent-2',   dur: 8.2,  delay: 1.7 },
    { icon: 'usb',           size: 'xs', pos: 'accent-3',      dur: 7.6,  delay: 2.4 },
    { icon: 'tablet',        size: 'xs', pos: 'accent-4',      dur: 6.9,  delay: 0.8 }
  ];

  function iconsMarkup() {
    return FLOATING_ICONS.map(function (ic, i) {
      return (
        '<div class="hero-icon hero-icon--' + ic.size + ' hero-icon--' + ic.pos + '"' +
        '     data-icon-index="' + i + '"' +
        '     style="--drift-dur: ' + ic.dur + 's; --drift-delay: ' + ic.delay + 's;">' +
          '<i data-lucide="' + ic.icon + '"></i>' +
        '</div>'
      );
    }).join('');
  }

  function template() {
    return `
      <div class="hero-type">

        <!-- Animated gradient blobs (decorative) -->
        <div class="hero-blob hero-blob--1" aria-hidden="true"></div>
        <div class="hero-blob hero-blob--2" aria-hidden="true"></div>
        <div class="hero-blob hero-blob--3" aria-hidden="true"></div>

        <!-- Grain / noise overlay -->
        <div class="hero-grain" aria-hidden="true"></div>

        <!-- Floating tech icons (decorative) -->
        <div class="hero-floating-icons" aria-hidden="true">
          ${iconsMarkup()}
        </div>

        <!-- Centered copy -->
        <div class="hero-content">
          <span class="hero-eyebrow">
            <span class="hero-eyebrow-dot" aria-hidden="true"></span>
            Trusted by 1,200+ businesses across Pakistan
          </span>

          <h1 class="hero-title">
            Premium business laptops,
            <span class="text-gradient-brand">driven by values</span>.
          </h1>

          <p class="hero-subtitle">
            Dell &middot; HP &middot; Lenovo — meticulously tested, business-grade
            machines at fair prices. Karachi-based, nationwide delivery.
          </p>

          <div class="hero-ctas">
            <a href="${r('pages/inventory.html')}" class="btn btn-brand btn-xl">
              <i data-lucide="shopping-bag"></i>
              <span>Browse inventory</span>
            </a>
            <a href="${r('pages/pcs.html')}" class="btn btn-outline-light btn-xl">
              <i data-lucide="monitor"></i>
              <span>PCs &amp; Monitors</span>
            </a>
          </div>

          <ul class="hero-trust">
            <li><i data-lucide="shield-check"></i><span>1-year warranty</span></li>
            <li><i data-lucide="truck"></i><span>Nationwide delivery</span></li>
            <li><i data-lucide="star"></i><span>4.9 &middot; 1.2k reviews</span></li>
          </ul>
        </div>

      </div>
    `;
  }

  function mount() {
    const host = document.getElementById('hero-slot');
    if (!host) return;
    if (host.dataset.mounted === 'true') return;
    host.dataset.mounted = 'true';

    host.innerHTML = template();
    NS.renderIcons?.(host);

    const heroEl = host.querySelector('.hero-type');
    if (!heroEl) return;

    const blobs = Array.from(heroEl.querySelectorAll('.hero-blob'));
    const icons = Array.from(heroEl.querySelectorAll('.hero-icon'));

    /* ── Parallax: blobs + icons follow the mouse ─────────── */
    let raf = null;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    heroEl.addEventListener('mousemove', function (e) {
      const rect = heroEl.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width - 0.5;
      targetY = (e.clientY - rect.top) / rect.height - 0.5;

      /* ── Push-away effect on icons near the cursor ──────── */
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const influence = 160;

      icons.forEach(function (el) {
        const r = el.getBoundingClientRect();
        const ix = r.left + r.width / 2 - rect.left;
        const iy = r.top + r.height / 2 - rect.top;
        const dx = ix - mx;
        const dy = iy - my;
        const dist = Math.hypot(dx, dy);

        if (dist < influence) {
          const force = (1 - dist / influence) * 22;
          const nx = (dx / (dist || 1)) * force;
          const ny = (dy / (dist || 1)) * force;
          el.style.setProperty('--push-x', nx.toFixed(1) + 'px');
          el.style.setProperty('--push-y', ny.toFixed(1) + 'px');
          el.style.setProperty('--push-scale', '1.08');
          el.style.setProperty('--push-rotate', (nx * 0.2).toFixed(1) + 'deg');
        } else {
          el.style.setProperty('--push-x', '0px');
          el.style.setProperty('--push-y', '0px');
          el.style.setProperty('--push-scale', '1');
          el.style.setProperty('--push-rotate', '0deg');
        }
      });

      if (raf === null) raf = requestAnimationFrame(tick);
    });

    heroEl.addEventListener('mouseleave', function () {
      targetX = 0;
      targetY = 0;
      icons.forEach(function (el) {
        el.style.setProperty('--push-x', '0px');
        el.style.setProperty('--push-y', '0px');
        el.style.setProperty('--push-scale', '1');
        el.style.setProperty('--push-rotate', '0deg');
      });
      if (raf === null) raf = requestAnimationFrame(tick);
    });

    function tick() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      blobs.forEach(function (blob, i) {
        const strength = (i + 1) * 12;
        blob.style.setProperty('--parallax-x', (currentX * strength).toFixed(2) + 'px');
        blob.style.setProperty('--parallax-y', (currentY * strength).toFixed(2) + 'px');
      });

      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    /* ── Icon click pulse ─────────────────────────────────── */
    heroEl.addEventListener('click', function (e) {
      const icon = e.target.closest('.hero-icon');
      if (!icon) return;
      icon.classList.remove('is-pulsing');
      void icon.offsetWidth;
      icon.classList.add('is-pulsing');
      window.setTimeout(function () {
        icon.classList.remove('is-pulsing');
      }, 550);
    });
  }

  NS.Hero = { mount };
})();