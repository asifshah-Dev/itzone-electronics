// assets/js/components/Hero.js
/* ─────────────────────────────────────────────────────────
   Hero section — typographic hero with animated gradient blob.
   No images, no icons. Just bold typography + motion.
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

  function template() {
    return `
      <div class="hero-type">

        <!-- Animated gradient blobs (decorative) -->
        <div class="hero-blob hero-blob--1" aria-hidden="true"></div>
        <div class="hero-blob hero-blob--2" aria-hidden="true"></div>
        <div class="hero-blob hero-blob--3" aria-hidden="true"></div>

        <!-- Grain / noise overlay for texture -->
        <div class="hero-grain" aria-hidden="true"></div>

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

    /* ── Smart parallax: blobs follow the mouse slightly ─── */
    const heroEl = host.querySelector('.hero-type');
    if (!heroEl) return;

    const blobs = heroEl.querySelectorAll('.hero-blob');
    let raf = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    heroEl.addEventListener('mousemove', function (e) {
      const rect = heroEl.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;  /* -0.5 → 0.5 */
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x;
      targetY = y;
      if (raf === null) raf = requestAnimationFrame(tick);
    });

    heroEl.addEventListener('mouseleave', function () {
      targetX = 0;
      targetY = 0;
      if (raf === null) raf = requestAnimationFrame(tick);
    });

    function tick() {
      /* Smooth ease */
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      blobs.forEach(function (blob, i) {
        const strength = (i + 1) * 12;   /* each blob moves a bit more */
        blob.style.setProperty('--parallax-x', (currentX * strength).toFixed(2) + 'px');
        blob.style.setProperty('--parallax-y', (currentY * strength).toFixed(2) + 'px');
      });

      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }
  }

  NS.Hero = { mount };
})();