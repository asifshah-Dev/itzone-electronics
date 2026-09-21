// assets/js/components/Footer.js
/* ─────────────────────────────────────────────────────────
   Site footer — enhanced.
   Columns: Brand + socials | Shop | Support | Contact + hours
   Bottom bar: copyright + trust badges
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const PHONE_DISPLAY = '03265974741';
  const PHONE_TEL     = 'tel:+923265974741';
  const WHATSAPP      = 'https://wa.me/923265974741?text=' + encodeURIComponent('Hi IT Zone!');

  const SOCIALS = [
    { name: 'Facebook',  href: 'https://facebook.com/',      icon: 'facebook' },
    { name: 'Instagram', href: 'https://instagram.com/',     icon: 'instagram' },
    { name: 'WhatsApp',  href: 'https://wa.me/923265974741', icon: 'message-circle' },
    { name: 'Twitter',   href: 'https://twitter.com/',       icon: 'twitter' },
  ];

  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function r(href) {
    if (/^https?:|^tel:|^mailto:/.test(href)) return href;
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  function template() {
    const socialLinks = SOCIALS.map(s =>
      '<a href="' + s.href + '" class="footer-social" target="_blank" rel="noopener noreferrer" aria-label="' + s.name + '">' +
        '<i data-lucide="' + s.icon + '"></i>' +
      '</a>'
    ).join('');

    const year = new Date().getFullYear();

    return (
      '<div class="footer-inner">' +
        '<div class="container">' +

          '<div class="footer-grid">' +

            /* ── Brand column ──────────────────────────── */
            '<div class="footer-brand-col">' +
              '<a class="footer-brand" href="' + r('index.html') + '" aria-label="IT Zone Electronics — Home">' +
                '<img src="' + r('assets/img/logo.svg') + '" alt="IT Zone Electronics" width="56" height="56" decoding="async">' +
              '</a>' +
              '<p class="footer-blurb">' +
                'Driven by values. Certified refurbished business laptops, desktops, and monitors ' +
                'from Dell, HP &amp; Lenovo — tested, warrantied, delivered nationwide.' +
              '</p>' +
              '<div class="footer-socials">' + socialLinks + '</div>' +
            '</div>' +

            /* ── Shop column ───────────────────────────── */
            '<div class="footer-col">' +
              '<h3 class="footer-heading">Shop</h3>' +
              '<ul class="footer-list">' +
                '<li><a href="' + r('pages/inventory.html') + '">All Products</a></li>' +
                '<li><a href="' + r('pages/inventory.html') + '?type=laptop">Laptops</a></li>' +
                '<li><a href="' + r('pages/pcs.html') + '?cat=desktop">Desktops</a></li>' +
                '<li><a href="' + r('pages/pcs.html') + '?cat=monitor">Monitors</a></li>' +
                '<li><a href="' + r('pages/inventory.html') + '?tag=gaming">Gaming / Workstation</a></li>' +
              '</ul>' +
            '</div>' +

            /* ── Support column ────────────────────────── */
            '<div class="footer-col">' +
              '<h3 class="footer-heading">Support</h3>' +
              '<ul class="footer-list">' +
                '<li><a href="' + r('pages/contact.html') + '">Contact us</a></li>' +
                '<li><a href="' + r('pages/contact.html') + '#warranty">Warranty</a></li>' +
                '<li><a href="' + r('pages/contact.html') + '#delivery">Delivery</a></li>' +
                '<li><a href="' + r('pages/contact.html') + '#returns">Returns</a></li>' +
              '</ul>' +
            '</div>' +

            /* ── Contact + hours column ────────────────── */
            '<div class="footer-col footer-contact-col">' +
              '<h3 class="footer-heading">Get in touch</h3>' +
              '<ul class="footer-list footer-contact">' +
                '<li>' +
                  '<i data-lucide="phone"></i>' +
                  '<a href="' + PHONE_TEL + '">' + PHONE_DISPLAY + '</a>' +
                '</li>' +
                '<li>' +
                  '<i data-lucide="message-circle"></i>' +
                  '<a href="' + WHATSAPP + '" target="_blank" rel="noopener noreferrer">WhatsApp us</a>' +
                '</li>' +
                '<li>' +
                  '<i data-lucide="map-pin"></i>' +
                  '<span>Karachi, Pakistan</span>' +
                '</li>' +
                '<li>' +
                  '<i data-lucide="clock"></i>' +
                  '<span>Mon\u2013Sat \u00b7 10 AM \u2013 9 PM</span>' +
                '</li>' +
              '</ul>' +
            '</div>' +

          '</div>' +

          /* ── Bottom bar ──────────────────────────────── */
          '<div class="footer-bottom">' +
            '<div class="footer-trust">' +
              '<span class="footer-trust-item">' +
                '<i data-lucide="shield-check"></i>1-year warranty' +
              '</span>' +
              '<span class="footer-trust-item">' +
                '<i data-lucide="truck"></i>Nationwide delivery' +
              '</span>' +
              '<span class="footer-trust-item">' +
                '<i data-lucide="badge-check"></i>Tested before shipping' +
              '</span>' +
            '</div>' +
            '<p class="footer-copy">\u00A9 ' + year + ' IT Zone Electronics. All rights reserved.</p>' +
          '</div>' +

        '</div>' +
      '</div>'
    );
  }

  function mount() {
    const host = document.querySelector('.site-footer');
    if (!host) return;
    if (host.dataset.mounted === 'true') return;
    host.dataset.mounted = 'true';

    host.innerHTML = template();
    NS.renderIcons?.(host);
  }

  NS.Footer = { mount };
})();