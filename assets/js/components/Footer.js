// assets/js/components/Footer.js
/* ─────────────────────────────────────────────────────────
   Site footer — enhanced.
   Columns: Brand + socials | Shop | Support | Contact + hours
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const PHONE_DISPLAY = '03265974741';
  const PHONE_TEL     = 'tel:+923265974741';
  const WHATSAPP      = 'https://wa.me/923265974741?text=' + encodeURIComponent('Hi IT Zone!');

  /* TikTok has no Lucide icon → inline SVG */
  const TIKTOK_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" ' +
    'style="width:1em;height:1em;display:inline-block;vertical-align:middle;">' +
      '<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>' +
    '</svg>';

  const SOCIALS = [
    { name: 'Facebook',  href: 'https://www.facebook.com/itzoneelectronics',      icon: 'facebook' },
    { name: 'Instagram', href: 'https://www.instagram.com/itzoneelectronics',     icon: 'instagram' },
    { name: 'YouTube',   href: 'https://www.youtube.com/@itzoneelectronics',      icon: 'youtube' },
    { name: 'TikTok',    href: 'https://www.tiktok.com/@itzoneelectronics',       icon: null, svg: TIKTOK_SVG },
  ];

  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function r(href) {
    if (/^https?:|^tel:|^mailto:/.test(href)) return href;
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  function socialIconMarkup(s) {
    if (s.svg) return s.svg;
    return '<i data-lucide="' + s.icon + '"></i>';
  }

  function template() {
    const socialLinks = SOCIALS.map(s =>
      '<a href="' + s.href + '" class="footer-social" target="_blank" rel="noopener noreferrer" aria-label="' + s.name + '">' +
        socialIconMarkup(s) +
      '</a>'
    ).join('');

    const year = new Date().getFullYear();

    return (
      '<div class="footer-inner">' +
        '<div class="container">' +

          '<div class="footer-grid">' +

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

            '<div class="footer-col">' +
              '<h3 class="footer-heading">Support</h3>' +
              '<ul class="footer-list">' +
                '<li><a href="' + r('pages/contact.html') + '">Contact us</a></li>' +
                '<li><a href="' + r('pages/warranty.html') + '">Warranty Policy</a></li>' +
                
              '</ul>' +
            '</div>' +

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
                  '<span>Darogawala, Lahore, Pakistan</span>' +
                '</li>' +
                '<li>' +
                  '<i data-lucide="clock"></i>' +
                  '<span>11 AM to 9 PM</span>' +
                '</li>' +
              '</ul>' +
            '</div>' +

          '</div>' +

          '<div class="footer-bottom">' +
            '<div class="footer-trust">' +
              '<span class="footer-trust-item">' +
                '<i data-lucide="shield-check"></i>30-day performance warranty' +
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