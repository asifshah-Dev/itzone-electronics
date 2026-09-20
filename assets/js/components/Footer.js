// assets/js/components/Footer.js
/* ─────────────────────────────────────────────────────────
   Footer component.
   Injects the site footer into <footer class="site-footer">.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  function isInPagesDir() {
    return /\/(pages)\//.test(window.location.pathname);
  }
  function r(href) {
    if (href.startsWith('#')) return isInPagesDir() ? `../index.html${href}` : href;
    if (/^https?:/.test(href)) return href;
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  function template() {
    return `
      <div class="container">
        <div class="row g-5">

          <div class="col-lg-4">
            <a class="brand" href="${r('index.html')}" aria-label="IT Zone Electronics — Home">
              <img src="${r('assets/img/logo.svg')}"
                   alt="" width="40" height="40"
                   class="brand-logo" decoding="async">
              <span class="brand-text">
                <span class="brand-name">IT ZONE</span>
                <span class="brand-tag">Electronics</span>
              </span>
            </a>
            <p class="footer-blurb">
              Driven by values. Certified refurbished business laptops
              from Dell, HP &amp; Lenovo — tested, warrantied, delivered
              nationwide.
            </p>
          </div>

          <div class="col-6 col-lg-2">
            <h3 class="footer-heading">Shop</h3>
            <ul class="footer-list">
              <li><a href="${r('pages/inventory.html')}">All laptops</a></li>
              <li><a href="${r('pages/inventory.html')}">Dell</a></li>
              <li><a href="${r('pages/inventory.html')}">HP</a></li>
              <li><a href="${r('pages/inventory.html')}">Lenovo</a></li>
            </ul>
          </div>

          <div class="col-6 col-lg-2">
            <h3 class="footer-heading">Support</h3>
            <ul class="footer-list">
              <li><a href="#">Warranty</a></li>
              <li><a href="#">Returns</a></li>
              <li><a href="#">Shipping</a></li>
              <li><a href="${r('pages/contact.html')}">Contact</a></li>
            </ul>
          </div>

          <div class="col-lg-4">
            <h3 class="footer-heading">Get in touch</h3>
            <ul class="footer-list">
              <li><i data-lucide="map-pin"></i> Karachi, Pakistan</li>
              <li><a href="tel:+923001234567"><i data-lucide="phone"></i> +92 300 1234567</a></li>
              <li><a href="mailto:hello@itzone.pk"><i data-lucide="mail"></i> hello@itzone.pk</a></li>
            </ul>
          </div>

        </div>

        <hr class="footer-divider">

        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} IT Zone Electronics — All rights reserved.</p>
          <p class="footer-credit">Karachi · Pakistan</p>
        </div>
      </div>
    `;
  }

  function mount() {
    const host = document.querySelector('.site-footer');
    if (!host) return;
    host.innerHTML = template();
    NS.renderIcons?.(host);
  }

  NS.Footer = { mount };
})();