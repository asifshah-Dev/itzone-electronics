// assets/js/components/Navbar.js
/* ─────────────────────────────────────────────────────────
   Navbar component.
   Injects the site header markup into <header class="site-header">
   on every page, wires the mobile drawer, marks the active link
   via <body data-page>, and provides a cart-badge API for Step 9.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const NS = (window.ITZone = window.ITZone || {});

  /* ── Nav model — one source of truth ────────────────────
     Add new pages here; they appear on every page's navbar. */
  const NAV_ITEMS = [
    { id: 'home',      label: 'Home',     href: 'index.html',              icon: 'home' },
    { id: 'inventory', label: 'Laptops',  href: 'pages/inventory.html',    icon: 'laptop' },
    { id: 'reviews',   label: 'Reviews',  href: '#reviews',                icon: 'star' },
    { id: 'contact',   label: 'Contact',  href: 'pages/contact.html',      icon: 'mail' },
  ];

  /* ── Compute the correct href relative to the current page.
     GitHub Pages serves at /<repo>/ — pages in /pages/ need
     ../ prefixes; index.html needs plain paths. ───────────── */
  function isInPagesDir() {
    return /\/(pages)\//.test(window.location.pathname);
  }

  function resolveHref(href) {
    // Hash-only links (e.g. #reviews) and external URLs pass through
    if (href.startsWith('#')) return isInPagesDir() ? `../index.html${href}` : href;
    if (/^https?:/.test(href)) return href;
    // Normalize relative paths for /pages/ context
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  /* ── Markup template ───────────────────────────────────── */
  function template(currentPage) {
    const links = NAV_ITEMS.map((item) => {
      const isActive = item.id === currentPage;
      return `
        <li>
          <a class="nav-link"
             href="${resolveHref(item.href)}"
             ${isActive ? 'aria-current="page"' : ''}>
            <i data-lucide="${item.icon}"></i>
            <span>${item.label}</span>
          </a>
        </li>`;
    }).join('');

    return `
      <nav class="navbar site-nav" aria-label="Primary">
        <div class="container">

          <a class="brand" href="${resolveHref('index.html')}" aria-label="IT Zone Electronics — Home">
            <img src="${resolveHref('assets/img/logo.svg')}"
                 alt="" width="44" height="44"
                 class="brand-logo"
                 fetchpriority="high"
                 decoding="async">
            <span class="brand-text">
              <span class="brand-name">IT ZONE</span>
              <span class="brand-tag">Electronics</span>
            </span>
          </a>

          <ul class="nav-links" id="primary-menu">
            ${links}
          </ul>

          <div class="nav-actions">
            <button type="button"
                    class="cart-btn"
                    id="cart-trigger"
                    aria-label="Open shopping cart">
              <i data-lucide="shopping-cart"></i>
              <span class="cart-count" id="cart-count" data-visible="false">0</span>
            </button>

            <a href="tel:+923001234567" class="btn btn-brand d-none d-md-inline-flex">
              <i data-lucide="phone"></i>
              <span>Call now</span>
            </a>

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
      </nav>
      <div class="nav-backdrop" id="nav-backdrop" hidden></div>
    `;
  }

  /* ── Wire behaviours ───────────────────────────────────── */
  function wire(root) {
    const toggler  = root.querySelector('#nav-toggler');
    const menu     = root.querySelector('#primary-menu');
    const backdrop = root.querySelector('#nav-backdrop');
    const header   = document.querySelector('.site-header');

    if (!toggler || !menu || !backdrop) return;

    const openMenu = () => {
      menu.classList.add('is-open');
      backdrop.hidden = false;
      // rAF so the transition fires after `hidden` is removed
      requestAnimationFrame(() => backdrop.classList.add('is-open'));
      toggler.setAttribute('aria-expanded', 'true');
      toggler.setAttribute('aria-label', 'Close menu');
      toggler.innerHTML = '<i data-lucide="x"></i>';
      NS.renderIcons?.(toggler);
    };

    const closeMenu = () => {
      menu.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      toggler.setAttribute('aria-expanded', 'false');
      toggler.setAttribute('aria-label', 'Open menu');
      toggler.innerHTML = '<i data-lucide="menu"></i>';
      NS.renderIcons?.(toggler);
      window.setTimeout(() => { backdrop.hidden = true; }, 250);
    };

    toggler.addEventListener('click', () => {
      menu.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    backdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu();
        toggler.focus();
      }
    });

    // Close drawer if viewport grows past md
    const mq = window.matchMedia('(min-width: 992px)');
    mq.addEventListener('change', (e) => {
      if (e.matches && menu.classList.contains('is-open')) closeMenu();
    });

    // Sticky header shadow on scroll
    if (header) {
      const onScroll = () => {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  /* ── Public API ────────────────────────────────────────── */
  function mount() {
    const host = document.querySelector('.site-header');
    if (!host) return;

    const currentPage = document.body.dataset.page || 'home';
    host.innerHTML = template(currentPage);
    wire(host);

    NS.renderIcons?.(host);
  }

  NS.Navbar = { mount };
})(); 
