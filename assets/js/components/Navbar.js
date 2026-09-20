// assets/js/components/Navbar.js
/* ─────────────────────────────────────────────────────────
   Navbar layout (LEFT → RIGHT):
     [LOGO]  [Laptops]  [PCs & Monitors]  ...spacer...  [🛒]  [📞 Call 0326 597 4741]
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const NS = (window.ITZone = window.ITZone || {});

  const PHONE_DISPLAY = '0326 597 4741';
  const PHONE_TEL     = 'tel:+923265974741';

  const NAV_ITEMS = [
    { id: 'inventory', label: 'Laptops',        href: 'pages/inventory.html', icon: 'laptop' },
    { id: 'pcs',       label: 'PCs & Monitors', href: 'pages/pcs.html',       icon: 'monitor' },
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

  function template(currentPage) {
    const logoSrc = resolveHref('assets/img/logo.svg');

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

          <!-- ── LEFT: LOGO FIRST, then nav links ─────────── -->
          <div class="nav-left">

            <a class="brand"
               href="${resolveHref('index.html')}"
               aria-label="IT Zone Electronics — Home">
              <img class="brand-logo"
                   src="${logoSrc}"
                   alt="IT Zone Electronics"
                   decoding="async"
                   fetchpriority="high">
            </a>

            <ul class="nav-links" id="primary-menu">
              <!-- Drawer header (mobile only) -->
              <li class="drawer-header">
                <a class="drawer-brand"
                   href="${resolveHref('index.html')}"
                   aria-label="IT Zone Electronics — Home">
                  <img class="drawer-logo"
                       src="${logoSrc}"
                       alt="IT Zone Electronics"
                       decoding="async">
                </a>
                <button type="button"
                        class="drawer-close"
                        id="drawer-close"
                        aria-label="Close menu">
                  <i data-lucide="x"></i>
                </button>
              </li>

              ${links}

              <li class="drawer-call-wrap">
                <a href="${PHONE_TEL}" class="btn btn-brand drawer-call">
                  <i data-lucide="phone"></i>
                  <span>Call ${PHONE_DISPLAY}</span>
                </a>
              </li>
            </ul>

          </div>

          <!-- ── RIGHT: cart + call ──────────────────────── -->
          <div class="nav-actions">

            <button type="button"
                    class="cart-btn"
                    id="cart-trigger"
                    aria-label="Open shopping cart">
              <i data-lucide="shopping-cart"></i>
              <span class="cart-count" id="cart-count" data-visible="false">0</span>
            </button>

            <a href="${PHONE_TEL}"
               class="btn btn-brand nav-call">
              <i data-lucide="phone"></i>
              <span>Call ${PHONE_DISPLAY}</span>
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

  function attachLogoFallback(root) {
    root.querySelectorAll('img.brand-logo, img.drawer-logo').forEach((img) => {
      img.addEventListener('error', () => {
        console.warn('[IT Zone] logo.svg failed — inline fallback.');
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

    if (!toggler || !menu || !backdrop) return;

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

    if (toggler.dataset.bound === 'true') return;
    toggler.dataset.bound = 'true';

    toggler.addEventListener('click', (e) => {
      e.preventDefault();
      menu.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        toggler.focus();
      });
    }

    backdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu();
        toggler.focus();
      }
    });

    const mq = window.matchMedia('(min-width: 992px)');
    const mqHandler = (e) => { if (e.matches && menu.classList.contains('is-open')) closeMenu(); };
    if (mq.addEventListener) mq.addEventListener('change', mqHandler);
    else if (mq.addListener) mq.addListener(mqHandler);

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

    const currentPage = document.body.dataset.page || 'home';
    host.innerHTML = template(currentPage);

    attachLogoFallback(host);
    wire(host);
    NS.renderIcons?.(host);
  }

  NS.Navbar = { mount };
})();