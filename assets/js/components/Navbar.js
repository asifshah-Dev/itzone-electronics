// assets/js/components/Navbar.js
/* ─────────────────────────────────────────────────────────
   Navbar v3.
   Row 1 (non-sticky): socials · tagline
   Row 2 (sticky):     search · phone · LOGO · call · cart
   Row 3 (sticky):     white category bar — computed from JSON
   Mobile: search + phone + logo + cart, then two links.
   Search opens a left-side drawer with input + categories.
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

  /* Category definitions — computed at mount from JSON.
     Each entry: { id, label, test(item) } */
  function buildCategories(data) {
    const laptops = Array.isArray(data.laptops) ? data.laptops : [];
    const pcs     = data.pcs || {};
    const allPCs  = []
      .concat(pcs.desktops || [])
      .concat(pcs.tiny     || [])
      .concat(pcs.monitors || []);

    const combined = laptops.concat(allPCs);

    const hasModelOrExtra = (item, term) => {
      const hay = ((item.model || '') + ' ' + (item.extras || '')).toLowerCase();
      return hay.includes(term);
    };

    return [
      {
        id: '50k-70k', label: '50k to 70k',
        test: (i) => i.price >= 50000 && i.price <= 70000,
      },
      {
        id: 'upto-100k', label: 'Upto 100k',
        test: (i) => i.price <= 100000,
      },
      {
        id: '100k-plus', label: '100k Plus',
        test: (i) => i.price > 100000,
      },
      {
        id: 'i5', label: 'Core i5',
        test: (i) => (i.cpu || '').toLowerCase().includes('i5'),
      },
      {
        id: 'i7', label: 'Core i7',
        test: (i) => (i.cpu || '').toLowerCase().includes('i7'),
      },
      {
        id: 'hp', label: 'HP',
        test: (i) => i.brand === 'HP',
      },
      {
        id: 'dell', label: 'Dell',
        test: (i) => i.brand === 'DELL',
      },
      {
        id: 'touch', label: 'Touch',
        test: (i) => hasModelOrExtra(i, 'touch'),
      },
      {
        id: 'numpad', label: 'NUMPAD',
        test: (i) => hasModelOrExtra(i, 'numpad'),
      },
      {
        id: 'gaming', label: 'Gaming / Workstation',
        test: (i) => {
          if (i.gpu && String(i.gpu).trim() !== '') return true;
          const hay = ((i.model || '') + ' ' + (i.extras || '')).toLowerCase();
          return hay.includes('p51') || hay.includes('p14') ||
                 hay.includes('z book') || hay.includes('zbook') ||
                 hay.includes('xps') || hay.includes('xeon') ||
                 hay.includes('quadro') || hay.includes('dedicated');
        },
      },
    ].filter(c => combined.some(c.test));  /* keep only categories with ≥1 item */
  }

  let CATEGORIES = [];   /* populated on mount */

  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function r(href) {
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
            <stop offset="0%" stop-color="#0d4a26"/><stop offset="100%" stop-color="#1fa050"/>
          </linearGradient>
          <linearGradient id="itzRedNav" x1="60" y1="15" x2="60" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#e8382a"/><stop offset="100%" stop-color="#8a0f0a"/>
          </linearGradient>
        </defs>
        <path d="M 22 40 A 48 48 0 1 0 98 40" stroke="url(#itzGreenNav)" stroke-width="9" stroke-linecap="round" fill="none"/>
        <path d="M 38 34 A 22 22 0 1 0 82 34" stroke="url(#itzRedNav)" stroke-width="9" stroke-linecap="round" fill="none"/>
        <rect x="54" y="14" width="12" height="34" rx="6" fill="url(#itzRedNav)"/>
        <rect x="40" y="70" width="14" height="42" rx="4" fill="url(#itzGreenNav)"/>
        <rect x="66" y="70" width="14" height="42" rx="4" fill="url(#itzGreenNav)"/>
        <path d="M 66 74 L 90 74 L 90 82 L 66 82 Z" fill="url(#itzGreenNav)"/>
      </svg>`;
  }

  function template() {
    const logoSrc = r('assets/img/logo.svg');

    const socialLinks = SOCIALS.map(s =>
      `<a href="${s.href}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${s.name}"><i data-lucide="${s.icon}"></i></a>`
    ).join('');

    const catLinks = CATEGORIES.map(c =>
      `<a class="cat-link" href="${r('pages/inventory.html')}?tag=${c.id}">${c.label}</a>`
    ).join('');

    const drawerCatLinks = CATEGORIES.map(c =>
      `<li><a class="drawer-cat" href="${r('pages/inventory.html')}?tag=${c.id}">${c.label}</a></li>`
    ).join('');

    return `
      <nav class="site-nav" aria-label="Primary">

        <!-- ROW 1 — not sticky -->
        <div class="nav-row nav-row-1" data-row="1">
          <div class="nav-container">
            <div class="nav-socials">${socialLinks}</div>
            <p class="nav-tagline">${TAGLINE}</p>
          </div>
        </div>

        <!-- ROWS 2 + 3 — sticky block -->
        <div class="nav-sticky" data-sticky>
          <div class="nav-container">

            <!-- ROW 2 -->
            <div class="nav-row nav-row-2">
              <div class="nav-left">
                <button type="button"
                        class="nav-search-btn"
                        id="mobile-search-open"
                        aria-label="Open search"
                        aria-expanded="false"
                        aria-controls="mobile-search">
                  <i data-lucide="search"></i>
                </button>

                <form class="nav-search" role="search" onsubmit="return false;">
                  <label for="nav-search-input" class="visually-hidden">Search laptops</label>
                  <i data-lucide="search" class="nav-search-icon"></i>
                  <input type="search" id="nav-search-input" class="nav-search-input"
                         placeholder="Search laptops…" autocomplete="off">
                </form>

                <a href="${PHONE_TEL}" class="nav-phone-icon" aria-label="Call ${PHONE_DISPLAY}">
                  <i data-lucide="phone"></i>
                </a>
              </div>

              <a class="brand" href="${r('index.html')}" aria-label="IT Zone Electronics — Home">
                <img class="brand-logo" src="${logoSrc}" alt="IT Zone Electronics"
                     decoding="async" fetchpriority="high">
              </a>

              <div class="nav-actions">
                <a href="${PHONE_TEL}" class="nav-call">
                  <i data-lucide="phone"></i>
                  <span>Call now <strong>${PHONE_DISPLAY}</strong></span>
                </a>
                <button type="button" class="cart-btn" id="cart-trigger" aria-label="Open shopping cart">
                  <i data-lucide="shopping-cart"></i>
                  <span class="cart-count" id="cart-count" data-visible="false">0</span>
                </button>
                <button type="button" class="nav-toggler" id="nav-toggler"
                        aria-label="Open menu" aria-expanded="false" aria-controls="primary-menu">
                  <i data-lucide="menu"></i>
                </button>
              </div>
            </div>

            <!-- ROW 3 — white bar, edge to edge -->
            <div class="nav-row nav-row-3">
              <div class="cat-links-scroll">
                <div class="cat-links">${catLinks}</div>
              </div>
            </div>

            <!-- Mobile-only links row (visible < 992px) -->
            <div class="nav-row nav-row-3-mobile">
              ${NAV_ITEMS.map(item =>
                `<a class="mobile-link" href="${r(item.href)}">
                   <i data-lucide="${item.icon}"></i><span>${item.label}</span>
                 </a>`
              ).join('')}
            </div>

          </div>
        </div>
      </nav>

      <!-- ── LEFT-SIDE SEARCH DRAWER (mobile) ──────────── -->
      <aside class="mobile-search"
             id="mobile-search"
             aria-hidden="true"
             aria-label="Search">
        <header class="mobile-search-head">
          <form class="mobile-search-form" role="search" onsubmit="return false;">
            <i data-lucide="search" class="mobile-search-icon"></i>
            <input type="search"
                   id="mobile-search-input"
                   class="mobile-search-input"
                   placeholder="Search laptops…"
                   autocomplete="off">
            <button type="button" class="mobile-search-clear"
                    id="mobile-search-clear" aria-label="Clear search">
              <i data-lucide="x"></i>
            </button>
          </form>
          <button type="button"
                  class="mobile-search-close"
                  id="mobile-search-close"
                  aria-label="Close search">
            <i data-lucide="x"></i>
          </button>
        </header>

        <div class="mobile-search-body">
          <h3 class="mobile-search-title">Quick filters</h3>
          <ul class="mobile-cats">
            ${CATEGORIES.map(c =>
              `<li>
                 <a class="mobile-cat" href="${r('pages/inventory.html')}?tag=${c.id}">
                   <i data-lucide="tag"></i><span>${c.label}</span>
                 </a>
               </li>`
            ).join('')}
          </ul>
        </div>
      </aside>

      <!-- ── MOBILE MENU DRAWER (right) ────────────────── -->
      <ul class="nav-links" id="primary-menu">
        <li class="drawer-header">
          <a class="drawer-brand" href="${r('index.html')}" aria-label="Home">
            <img class="drawer-logo" src="${logoSrc}" alt="IT Zone Electronics" decoding="async">
          </a>
          <button type="button" class="drawer-close" id="drawer-close" aria-label="Close menu">
            <i data-lucide="x"></i>
          </button>
        </li>
        ${NAV_ITEMS.map(item =>
          `<li><a class="nav-link" href="${r(item.href)}"><i data-lucide="${item.icon}"></i><span>${item.label}</span></a></li>`
        ).join('')}
        <li class="drawer-cats-header">Quick filters</li>
        ${drawerCatLinks}
        <li class="drawer-call-wrap">
          <a href="${PHONE_TEL}" class="btn btn-brand drawer-call">
            <i data-lucide="phone"></i><span>Call ${PHONE_DISPLAY}</span>
          </a>
        </li>
      </ul>
      <div class="nav-backdrop" id="nav-backdrop" hidden></div>
    `;
  }

  function attachLogoFallback(root) {
    root.querySelectorAll('img.brand-logo, img.drawer-logo').forEach(img => {
      img.addEventListener('error', () => {
        const wrapper = document.createElement('div');
        const cls = img.classList.contains('drawer-logo') ? 'drawer-logo' : 'brand-logo';
        wrapper.innerHTML = inlineLogoSVG(cls).trim();
        img.replaceWith(wrapper.firstElementChild);
      }, { once: true });
    });
  }

  function wire(root) {
    const toggler    = root.querySelector('#nav-toggler');
    const menu       = root.querySelector('#primary-menu');
    const backdrop   = root.querySelector('#nav-backdrop');
    const closeBtn   = root.querySelector('#drawer-close');
    const header     = document.querySelector('.site-header');

    const searchOpen  = root.querySelector('#mobile-search-open');
    const searchPanel = root.querySelector('#mobile-search');
    const searchClose = root.querySelector('#mobile-search-close');
    const searchInput = root.querySelector('#mobile-search-input');
    const searchClear = root.querySelector('#mobile-search-clear');

    const lockScroll = (on) => { document.documentElement.style.overflow = on ? 'hidden' : ''; };

    /* ── Right drawer (menu) ─────────────────────────────── */
    if (toggler && menu && backdrop) {
      menu.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      backdrop.hidden = true;

      const setIcon = (el, name) => { el.innerHTML = `<i data-lucide="${name}"></i>`; NS.renderIcons?.(el); };

      const openMenu = () => {
        closeSearch();
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
        toggler.addEventListener('click', e => {
          e.preventDefault();
          menu.classList.contains('is-open') ? closeMenu() : openMenu();
        });
      }
      if (closeBtn) closeBtn.addEventListener('click', e => { e.preventDefault(); closeMenu(); toggler.focus(); });
      backdrop.addEventListener('click', closeMenu);
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); toggler.focus(); }
      });

      const mq = window.matchMedia('(min-width: 992px)');
      const mqHandler = e => {
        if (e.matches) {
          if (menu.classList.contains('is-open')) closeMenu();
          if (searchPanel.classList.contains('is-open')) closeSearch();
        }
      };
      if (mq.addEventListener) mq.addEventListener('change', mqHandler);
      else if (mq.addListener) mq.addListener(mqHandler);
    }

    /* ── Left search drawer (mobile) ─────────────────────── */
    function openSearch() {
      searchPanel.classList.add('is-open');
      searchPanel.setAttribute('aria-hidden', 'false');
      searchOpen && searchOpen.setAttribute('aria-expanded', 'true');
      lockScroll(true);
      window.setTimeout(() => searchInput && searchInput.focus(), 220);
    }
    function closeSearch() {
      searchPanel.classList.remove('is-open');
      searchPanel.setAttribute('aria-hidden', 'true');
      searchOpen && searchOpen.setAttribute('aria-expanded', 'false');
      if (!menu || !menu.classList.contains('is-open')) lockScroll(false);
    }

    if (searchOpen) {
      searchOpen.addEventListener('click', e => {
        e.preventDefault();
        searchPanel.classList.contains('is-open') ? closeSearch() : openSearch();
      });
    }
    if (searchClose) searchClose.addEventListener('click', e => { e.preventDefault(); closeSearch(); });

    /* Click outside the search panel closes it */
    document.addEventListener('click', e => {
      if (!searchPanel.classList.contains('is-open')) return;
      if (searchPanel.contains(e.target)) return;
      if (searchOpen && searchOpen.contains(e.target)) return;
      closeSearch();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && searchPanel.classList.contains('is-open')) {
        closeSearch();
        searchOpen && searchOpen.focus();
      }
    });

    /* Live search from the drawer → navigates on Enter, or filters on inventory page */
    if (searchInput) {
      searchInput.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const q = searchInput.value.trim();
        if (!q) return;

        if (document.body.dataset.page === 'inventory') {
          const nav = document.getElementById('nav-search-input');
          const page = document.getElementById('page-search');
          if (nav) nav.value = q;
          if (page) page.value = q;
          document.dispatchEvent(new CustomEvent('search:change', { detail: { query: q } }));
          closeSearch();
        } else {
          window.location.href = r('pages/inventory.html') + '?q=' + encodeURIComponent(q);
        }
      });
    }
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) { searchInput.value = ''; searchInput.focus(); }
      });
    }

    /* ── Desktop search ──────────────────────────────────── */
    const desktopSearch = root.querySelector('#nav-search-input');
    if (desktopSearch) {
      desktopSearch.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const q = desktopSearch.value.trim();
        if (!q) return;

        if (document.body.dataset.page === 'inventory') {
          const page = document.getElementById('page-search');
          if (page) page.value = q;
          document.dispatchEvent(new CustomEvent('search:change', { detail: { query: q } }));
        } else {
          window.location.href = r('pages/inventory.html') + '?q=' + encodeURIComponent(q);
        }
      });
    }

    /* ── Scroll: sticky handled by CSS, only add shadow ──── */
    if (header) {
      const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  /* ── Mount (async: fetch JSON first) ───────────────────── */
  async function mount() {
    const host = document.querySelector('.site-header');
    if (!host) return;
    if (host.dataset.mounted === 'true') return;
    host.dataset.mounted = 'true';

    /* Fetch data for category computation */
    try {
      const [laptops, pcs] = await Promise.all([
        NS.Data?.laptops ? NS.Data.laptops().catch(() => []) : [],
        NS.Data?.pcs     ? NS.Data.pcs().catch(() => ({})) : {},
      ]);
      CATEGORIES = buildCategories({ laptops, pcs });
    } catch (e) {
      console.warn('[IT Zone] Navbar: category computation failed, using empty list.', e);
      CATEGORIES = [];
    }

    host.innerHTML = template();
    attachLogoFallback(host);
    wire(host);
    NS.renderIcons?.(host);
  }

  NS.Navbar = { mount };
})();