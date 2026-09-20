// assets/js/components/Navbar.js
/* ─────────────────────────────────────────────────────────
   Navbar — two rows.
   ROW 1: social icons (left) · tagline (center)
   ROW 2: search · phone icon · LOGO · Call now+number · cart
   Number: 03265974741
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const NS = (window.ITZone = window.ITZone || {});

  const PHONE_DISPLAY = '03265974741';
  const PHONE_TEL     = 'tel:+923265974741';

  const TAGLINE = 'Free nationwide delivery · 1-year warranty on every laptop';

  const NAV_ITEMS = [
    { id: 'inventory', label: 'Laptops',        href: 'pages/inventory.html', icon: 'laptop' },
    { id: 'pcs',       label: 'PCs & Monitors', href: 'pages/pcs.html',       icon: 'monitor' },
  ];

  const SOCIALS = [
    { name: 'Facebook',  href: 'https://facebook.com/',      icon: 'facebook' },
    { name: 'Instagram', href: 'https://instagram.com/',     icon: 'instagram' },
    { name: 'WhatsApp',  href: 'https://wa.me/923265974741', icon: 'message-circle' },
    { name: 'Twitter',   href: 'https://twitter.com/',       icon: 'twitter' },
  ];

  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function resolveHref(href) {
    if (href.startsWith('#')) return isInPagesDir() ? `../index.html${href}` : href;
    if (/^https?:|^tel:|^mailto:/.test(href)) return href;
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  function inlineLogoSVG(cls) {
    return `
      <svg class="${cls || 'brand-logo'}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="itzGreenNav" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#0d4a26"/>
            <stop offset="100%" stop-color="#1fa050"/>
          </linearGradient>
          <linearGradient id="itzRedNav" x1="60" y1="15" x2="60" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#e8382a"/>
            <stop offset="100%" stop-color="#8a0f0a"/>
          </linearGradient>
        </defs>
        <path d="M 22 40 A 48 48 0 1 0 98 40" stroke="url(#itzGreenNav)" stroke-width="9" stroke-linecap="round" fill="none"/>
        <path d="M 38 34 A 22 22 0 1 0 82 34" stroke="url(#itzRedNav)" stroke-width="9" stroke-linecap="round" fill="none"/>
        <rect x="54" y="14" width="12" height="34" rx="6" fill="url(#itzRedNav)"/>
        <rect x="40" y="70" width="14" height="42" rx="4" fill="url(#itzGreenNav)"/>
        <rect x="66" y="70" width="14" height="42" rx="4" fill="url(#itzGreenNav)"/>
        <path d="M 66 74 L 90 74 L 90 82 L 66 82 Z" fill="url(#itzGreenNav)"/>
      </svg>
    `;
  }

  function template() {
    const logoSrc = resolveHref('assets/img/logo.svg');

    const drawerLinks = NAV_ITEMS.map((item) => `
      <li>
        <a class="nav-link" href="${resolveHref(item.href)}">
          <i data-lucide="${item.icon}"></i>
          <span>${item.label}</span>
        </a>
      </li>
    `).join('');

    const socialLinks = SOCIALS.map(s => `
      <a href="${s.href}" class="social-link" target="_blank" rel="noopener noreferrer"
         aria-label="${s.name}">
        <i data-lucide="${s.icon}"></i>
      </a>
    `).join('');

    return `
      <nav class="navbar site-nav" aria-label="Primary">
        <div class="container">

          <!-- ══════════ ROW 1: socials + tagline ══════════ -->
          <div class="nav-row nav-row-top">
            <div class="nav-socials">${socialLinks}</div>
            <p class="nav-tagline" role="status">${TAGLINE}</p>
          </div>

          <!-- ══════════ ROW 2: search · phone · LOGO · call · cart ══════════ -->
          <div class="nav-row nav-row-main">

            <!-- LEFT: search + phone icon -->
            <div class="nav-search-group">
              <form class="nav-search" role="search" onsubmit="return false;">
                <label for="nav-search-input" class="visually-hidden">Search laptops</label>
                <i data-lucide="search" class="nav-search-icon"></i>
                <input type="search"
                       id="nav-search-input"
                       class="nav-search-input"
                       placeholder="Search laptops…"
                       autocomplete="off">
              </form>

              <a href="${PHONE_TEL}" class="nav-phone-icon" aria-label="Call ${PHONE_DISPLAY}">
                <i data-lucide="phone"></i>
              </a>
            </div>

            <!-- CENTER: logo -->
            <a class="brand"
               href="${resolveHref('index.html')}"
               aria-label="IT Zone Electronics — Home">
              <img class="brand-logo"
                   src="${logoSrc}"
                   alt="IT Zone Electronics"
                   decoding="async"
                   fetchpriority="high">
            </a>

            <!-- RIGHT: call now (inline) + cart + hamburger -->
            <div class="nav-actions">
              <a href="${PHONE_TEL}" class="nav-call">
                <i data-lucide="phone"></i>
                <span class="nav-call-text">
                  Call now <strong>${PHONE_DISPLAY}</strong>
                </span>
              </a>

              <button type="button"
                      class="cart-btn"
                      id="cart-trigger"
                      aria-label="Open shopping cart">
                <i data-lucide="shopping-cart"></i>
                <span class="cart-count" id="cart-count" data-visible="false">0</span>
              </button>

              <button type="button"
                      class="nav-toggler"
                      id="nav-toggler"
                      aria-label="Open menu"
                      aria-expanded="false"
                      aria-controls="primary-menu">
                <i data-lucide="menu"></i>
              </button>
            </div>

          </div>

          <!-- ══════════ DRAWER (mobile only) ══════════ -->
          <ul class="nav-links" id="primary-menu">
            <li class="drawer-header">
              <a class="drawer-brand"
                 href="${resolveHref('index.html')}"
                 aria-label="IT Zone Electronics — Home">
                <img class="drawer-logo" src="${logoSrc}" alt="IT Zone Electronics" decoding="async">
              </a>
              <button type="button"
                      class="drawer-close"
                      id="drawer-close"
                      aria-label="Close menu">
                <i data-lucide="x"></i>
              </button>
            </li>

            ${drawerLinks}

            <li class="drawer-call-wrap">
              <a href="${PHONE_TEL}" class="btn btn-brand drawer-call">
                <i data-lucide="phone"></i>
                <span>Call ${PHONE_DISPLAY}</span>
              </a>
            </li>
          </ul>

        </div>
      </nav>
      <div class="nav-backdrop" id="nav-backdrop" hidden></div>
    `;
  }

  function attachLogoFallback(root) {
    root.querySelectorAll('img.brand-logo, img.drawer-logo').forEach((img) => {
      img.addEventListener('error', () => {
        const wrapper = document.createElement('div');
        const cls = img.classList.contains('drawer-logo') ? 'drawer-logo' : 'brand-logo';
        wrapper.innerHTML = inlineLogoSVG(cls).trim();
        img.replaceWith(wrapper.firstElementChild);
      }, { once: true });
    });
  }

  function wire(root) {
    const toggler  = root.querySelector('#nav-toggler');
    const menu     = root.querySelector('#primary-menu');
    const backdrop = root.querySelector('#nav-backdrop');
    const closeBtn = root.querySelector('#drawer-close');
    const header   = document.querySelector('.site-header');

    if (toggler && menu && backdrop) {
      menu.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      backdrop.hidden = true;
      document.documentElement.style.overflow = '';

      const lockScroll = (on) => { document.documentElement.style.overflow = on ? 'hidden' : ''; };
      const setIcon = (el, name) => {
        el.innerHTML = `<i data-lucide="${name}"></i>`;
        NS.renderIcons?.(el);
      };

      const openMenu = () => {
        menu.classList.add('is-open');
        backdrop.hidden = false;
        void backdrop.offsetWidth;
        backdrop.classList.add('is-open');
        toggler.setAttribute('aria-expanded', 'true');
        setIcon(toggler, 'x');
        lockScroll(true);
      };

      const closeMenu = () => {
        menu.classList.remove('is-open');
        backdrop.classList.remove('is-open');
        toggler.setAttribute('aria-expanded', 'false');
        setIcon(toggler, 'menu');
        lockScroll(false);
        window.setTimeout(() => { backdrop.hidden = true; }, 250);
      };

      if (toggler.dataset.bound !== 'true') {
        toggler.dataset.bound = 'true';
        toggler.addEventListener('click', (e) => {
          e.preventDefault();
          menu.classList.contains('is-open') ? closeMenu() : openMenu();
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => { e.preventDefault(); closeMenu(); toggler.focus(); });
      }
      backdrop.addEventListener('click', closeMenu);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) {
          closeMenu(); toggler.focus();
        }
      });

      const mq = window.matchMedia('(min-width: 992px)');
      const mqHandler = (e) => { if (e.matches && menu.classList.contains('is-open')) closeMenu(); };
      if (mq.addEventListener) mq.addEventListener('change', mqHandler);
      else if (mq.addListener) mq.addListener(mqHandler);
    }

    const search = root.querySelector('#nav-search-input');
    if (search) {
      search.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const q = search.value.trim();
          if (!q) return;
          window.location.href = resolveHref('pages/inventory.html') + '?q=' + encodeURIComponent(q);
        }
      });
    }

    if (header) {
      const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  function mount() {
    const host = document.querySelector('.site-header');
    if (!host) return;
    if (host.dataset.mounted === 'true') return;
    host.dataset.mounted = 'true';

    host.innerHTML = template();
    attachLogoFallback(host);
    wire(host);
    NS.renderIcons?.(host);
  }

  NS.Navbar = { mount };
})();