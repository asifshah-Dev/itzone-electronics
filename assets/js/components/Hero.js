// assets/js/components/Hero.js
/* ─────────────────────────────────────────────────────────
   Hero section.
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

  function heroIllustration() {
    return `
      <svg class="hero-art" viewBox="0 0 560 440" fill="none"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="heroScreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0f4f28"/>
            <stop offset="100%" stop-color="#062b14"/>
          </linearGradient>
          <linearGradient id="heroBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d9d9d9"/>
            <stop offset="100%" stop-color="#9aa0a6"/>
          </linearGradient>
          <linearGradient id="heroGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f5b81c" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#d4281c" stop-opacity="0.15"/>
          </linearGradient>
          <radialGradient id="heroShadow" cx="0.5" cy="1" r="0.7">
            <stop offset="0%" stop-color="#000" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#000" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <ellipse cx="280" cy="240" rx="260" ry="200" fill="url(#heroGlow)"/>
        <ellipse cx="280" cy="400" rx="220" ry="26" fill="url(#heroShadow)"/>
        <path d="M 60 330 L 500 330 L 540 380 L 20 380 Z" fill="url(#heroBase)"/>
        <path d="M 60 330 L 500 330 L 505 336 L 55 336 Z" fill="#7a8085"/>
        <rect x="90" y="60" width="380" height="270" rx="14" fill="#0a0f0d"/>
        <rect x="104" y="74" width="352" height="242" rx="8" fill="url(#heroScreen)"/>
        <g transform="translate(280 195)">
          <circle cx="0" cy="0" r="58" stroke="#1fa050" stroke-width="9"
                  stroke-dasharray="82 44" stroke-linecap="round" fill="none"/>
          <rect x="-9" y="-62" width="18" height="42" rx="9" fill="#e8382a"/>
          <path d="M -30 -50 A 26 26 0 1 0 30 -50"
                stroke="#e8382a" stroke-width="9" stroke-linecap="round" fill="none"/>
          <rect x="-26" y="12" width="16" height="52" rx="5" fill="#1fa050"/>
          <rect x="10" y="12" width="16" height="52" rx="5" fill="#1fa050"/>
          <path d="M 10 16 L 40 16 L 40 26 L 10 26 Z" fill="#1fa050"/>
        </g>
        <rect x="128" y="276" width="150" height="6" rx="3" fill="#1fa050" opacity="0.5"/>
        <rect x="128" y="288" width="220" height="6" rx="3" fill="#f5b81c" opacity="0.5"/>
        <rect x="128" y="300" width="110" height="6" rx="3" fill="#e8382a" opacity="0.5"/>
        <rect x="250" y="330" width="60" height="6" rx="3" fill="#555"/>
      </svg>
    `;
  }

  function template() {
    return `
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="hero-eyebrow">
            <i data-lucide="badge-check"></i>
            Trusted by 1,200+ businesses across Pakistan
          </span>

          <h1 class="hero-title">
            Premium business laptops,
            <span class="text-gradient-brand">driven by values</span>.
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
            <a href="${r('pages/pcs.html')}" class="btn btn-outline-light btn-lg">
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

        <div class="hero-visual">
          ${heroIllustration()}
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