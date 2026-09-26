// assets/js/components/Hero.js
/* ─────────────────────────────────────────────────────────
   Hero section — banner image background, vivid text.
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
    const bannerSrc = r('assets/img/banner1.jpg');

    return `
      <div class="hero-banner" role="img" aria-label="Premium business laptops from IT Zone Electronics">
        <div class="hero-banner-bg" style="background-image: url('${bannerSrc}');" aria-hidden="true"></div>
        <div class="hero-banner-scrim" aria-hidden="true"></div>

        <div class="hero-banner-content">
          <span class="hero-eyebrow">
            <i data-lucide="badge-check"></i>
            Trusted by 1,200+ businesses across Pakistan
          </span>

          <h1 class="hero-title">
            Premium business laptops,
            <span class="hero-title-accent">driven by values</span>.
          </h1>

          <p class="hero-subtitle">
            Dell · HP · Lenovo — meticulously tested, business-grade machines
            at fair prices. Karachi-based, nationwide delivery.
          </p>

          <div class="hero-ctas">
            <a href="${r('pages/inventory.html')}" class="btn btn-brand btn-lg">
              <i data-lucide="shopping-bag"></i>
              <span>Browse inventory</span>
            </a>
            <a href="${r('pages/pcs.html')}" class="btn btn-outline-hero btn-lg">
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
  }

  NS.Hero = { mount };
})();