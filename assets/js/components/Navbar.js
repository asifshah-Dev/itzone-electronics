// assets/js/components/Navbar.js
/* ─────────────────────────────────────────────────────────
   Navbar — white rows 1 & 2, glass green row 3.
   Categories visible on all screen sizes with horizontal scroll on mobile.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const NS = (window.ITZone = window.ITZone || {});

  const PHONE_DISPLAY = '03265974741';
  const PHONE_TEL     = 'tel:+923265974741';
  const TAGLINE = 'Free nationwide delivery \u00b7 1-year warranty on every laptop';

  const NAV_ITEMS = [
    { id: 'inventory', label: 'Laptops',        href: 'pages/inventory.html', icon: 'laptop' },
    { id: 'pcs',       label: 'PCs & Monitors', href: 'pages/pcs.html',       icon: 'monitor' },
  ];

  const SOCIALS = [
    { name: 'Facebook',  href: 'https://facebook.com/',      icon: 'facebook' },
    { name: 'Instagram', href: 'https://instagram.com/',     icon: 'instagram' },
    { name: 'WhatsApp',  href: 'https://wa.me/923265974741', icon: 'whatsapp' },
    { name: 'Twitter',   href: 'https://twitter.com/',       icon: 'twitter' },
  ];

  function buildCategories(data) {
    const laptops  = Array.isArray(data.laptops) ? data.laptops : [];
    const pcs      = data.pcs || {};
    const desktops = pcs.desktops || [];
    const tiny     = pcs.tiny     || [];
    const monitors = pcs.monitors || [];
    const allPCs   = [].concat(desktops, tiny, monitors);
    const combined = laptops.concat(allPCs);

    const candidates = [
      { id: '30k-50k', label: '30k to 50k',
        test: function (i) { const p = Number(i.price); return p > 30000 && p <= 50000; } },
      { id: '50k-70k', label: '50k to 70k',
        test: function (i) { const p = Number(i.price); return p > 50000 && p <= 70000; } },
      { id: '70k-plus', label: '70k Plus',
        test: function (i) { return Number(i.price) > 70000; } },
      { id: 'i5', label: 'Core i5',
        test: function (i) { return (i.cpu || '').toLowerCase().indexOf('i5') !== -1; } },
      { id: 'i7', label: 'Core i7',
        test: function (i) { return (i.cpu || '').toLowerCase().indexOf('i7') !== -1; } },
      { id: 'dell', label: 'Dell',
        test: function (i) { return i.brand === 'DELL'; } },
      { id: 'hp', label: 'HP',
        test: function (i) { return i.brand === 'HP'; } },
      { id: 'lenovo', label: 'Lenovo',
        test: function (i) { return i.brand === 'LENOVO'; } },
    ];

    return candidates
      .map(function (c) {
        return Object.assign({}, c, { _count: combined.filter(c.test).length });
      })
      .filter(function (c) { return c._count >= 2; })
      .map(function (c) { delete c._count; return c; });
  }

  let CATEGORIES = [];

  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function r(href) {
    if (href.startsWith('#')) return isInPagesDir() ? `../index.html${href}` : href;
    if (/^https?:|^tel:|^mailto:/.test(href)) return href;
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  function gotoTag(slug) {
    try { sessionStorage.setItem('itz.pendingTag', slug); } catch (e) {}
    try { sessionStorage.setItem('itz.pendingAt', String(Date.now())); } catch (e) {}
    const url = (isInPagesDir() ? '' : 'pages/') + 'inventory.html?tag=' + encodeURIComponent(slug);
    window.location.href = url;
  }

  function gotoSearch(q) {
    try { sessionStorage.removeItem('itz.pendingTag'); } catch (e) {}
    const url = (isInPagesDir() ? '' : 'pages/') + 'inventory.html?q=' + encodeURIComponent(q);
    window.location.href = url;
  }

  function whatsappSvg(size) {
    const s = size || 16;
    return (
      '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
        '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />' +
      '</svg>'
    );
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

    const socialLinks = SOCIALS.map(function (s) {
      const icon = s.icon === 'whatsapp' ? whatsappSvg(16) : '<i data-lucide="' + s.icon + '"></i>';
      return '<a href="' + s.href + '" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="' + s.name + '">' +
        icon +
      '</a>';
    }).join('');

    const catButtons = CATEGORIES.map(function (c) {
      return '<button type="button" class="cat-link" data-cat="' + c.id + '">' + c.label + '</button>';
    }).join('');

    const drawerCatButtons = CATEGORIES.map(function (c) {
      return '<li><button type="button" class="drawer-cat" data-cat="' + c.id + '">' + c.label + '</button></li>';
    }).join('');

    const mobileCatButtons = CATEGORIES.map(function (c) {
      return '<li><button type="button" class="mobile-cat" data-cat="' + c.id + '"><i data-lucide="tag"></i><span>' + c.label + '</span></button></li>';
    }).join('');

    return `
      <nav class="site-nav" aria-label="Primary">

        <div class="nav-row nav-row-1">
          <div class="nav-container">
            <div class="nav-socials">${socialLinks}</div>
            <p class="nav-tagline">${TAGLINE}</p>
          </div>
        </div>

        <div class="nav-sticky" id="nav-sticky">
          <div class="nav-container">

            <div class="nav-row nav-row-2">
              <div class="nav-left">
                <button type="button" class="nav-search-btn" id="mobile-search-open"
                        aria-label="Open search" aria-expanded="false" aria-controls="mobile-search">
                  <i data-lucide="search"></i>
                </button>

                <form class="nav-search" role="search" onsubmit="return false;">
                  <label for="nav-search-input" class="visually-hidden">Search laptops</label>
                  <i data-lucide="search" class="nav-search-icon"></i>
                  <input type="search" id="nav-search-input" class="nav-search-input"
                         placeholder="Search laptops\u2026" autocomplete="off">
                </form>

                <a href="${PHONE_TEL}" class="nav-phone-icon" aria-label="Call ${PHONE_DISPLAY}">
                  <i data-lucide="phone"></i>
                </a>
              </div>

              <a class="brand" href="${r('index.html')}" aria-label="IT Zone Electronics \u2014 Home">
                <img class="brand-logo" src="${logoSrc}" alt="IT Zone Electronics"
                     decoding="async" fetchpriority="high">
              </a>

              <div class="nav-actions">
                <a href="${PHONE_TEL}" class="nav-call">
                  <i data-lucide="phone"></i>
                  <span>Call now <strong>${PHONE_DISPLAY}</strong></span>
                </a>
                <button type="button" class="nav-toggler" id="nav-toggler"
                        aria-label="Open menu" aria-expanded="false" aria-controls="primary-menu">
                  <i data-lucide="menu"></i>
                </button>
              </div>
            </div>

            <div class="nav-row nav-row-3">
              <div class="cat-links-scroll">
                <div class="cat-links">${catButtons}</div>
              </div>
            </div>

          </div>
        </div>

        <div class="nav-sticky-placeholder" id="nav-sticky-placeholder" hidden></div>
      </nav>

      <aside class="mobile-search" id="mobile-search" aria-hidden="true" aria-label="Search">
        <header class="mobile-search-head">
          <form class="mobile-search-form" role="search" onsubmit="return false;">
            <i data-lucide="search" class="mobile-search-icon"></i>
            <input type="search" id="mobile-search-input" class="mobile-search-input"
                   placeholder="Search laptops\u2026" autocomplete="off">
            <button type="button" class="mobile-search-clear" id="mobile-search-clear" aria-label="Clear search">
              <i data-lucide="x"></i>
            </button>
          </form>
          <button type="button" class="mobile-search-close" id="mobile-search-close" aria-label="Close search">
            <i data-lucide="x"></i>
          </button>
        </header>
        <div class="mobile-search-body">
          <h3 class="mobile-search-title">Quick filters</h3>
          <ul class="mobile-cats">${mobileCatButtons}</ul>
        </div>
      </aside>

      <ul class="nav-links" id="primary-menu">
        <li class="drawer-header">
          <a class="drawer-brand" href="${r('index.html')}" aria-label="Home">
            <img class="drawer-logo" src="${logoSrc}" alt="IT Zone Electronics" decoding="async">
          </a>
          <button type="button" class="drawer-close" id="drawer-close" aria-label="Close menu">
            <i data-lucide="x"></i>
          </button>
        </li>
        ${NAV_ITEMS.map(function (item) {
          return '<li><a class="nav-link" href="' + r(item.href) + '">' +
            '<i data-lucide="' + item.icon + '"></i><span>' + item.label + '</span>' +
          '</a></li>';
        }).join('')}
        <li class="drawer-cats-header">Quick filters</li>
        ${drawerCatButtons}
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
    root.querySelectorAll('img.brand-logo, img.drawer-logo').forEach(function (img) {
      img.addEventListener('error', function () {
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

    const searchOpen  = root.querySelector('#mobile-search-open');
    const searchPanel = root.querySelector('#mobile-search');
    const searchClose = root.querySelector('#mobile-search-close');
    const searchInput = root.querySelector('#mobile-search-input');
    const searchClear = root.querySelector('#mobile-search-clear');

    const lockScroll = function (on) { document.documentElement.style.overflow = on ? 'hidden' : ''; };

    root.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-cat]');
      if (btn) { e.preventDefault(); gotoTag(btn.dataset.cat); }
    });

    if (toggler && menu && backdrop) {
      menu.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      backdrop.hidden = true;

      const setIcon = function (el, name) {
        el.innerHTML = '<i data-lucide="' + name + '"></i>';
        NS.renderIcons?.(el);
      };

      const openMenu = function () {
        closeSearch();
        menu.classList.add('is-open');
        backdrop.hidden = false;
        void backdrop.offsetWidth;
        backdrop.classList.add('is-open');
        toggler.setAttribute('aria-expanded', 'true');
        setIcon(toggler, 'x');
        lockScroll(true);
      };
      const closeMenu = function () {
        menu.classList.remove('is-open');
        backdrop.classList.remove('is-open');
        toggler.setAttribute('aria-expanded', 'false');
        setIcon(toggler, 'menu');
        lockScroll(false);
        window.setTimeout(function () { backdrop.hidden = true; }, 250);
      };

      if (toggler.dataset.bound !== 'true') {
        toggler.dataset.bound = 'true';
        toggler.addEventListener('click', function (e) {
          e.preventDefault();
          menu.classList.contains('is-open') ? closeMenu() : openMenu();
        });
      }
      if (closeBtn) closeBtn.addEventListener('click', function (e) { e.preventDefault(); closeMenu(); toggler.focus(); });
      backdrop.addEventListener('click', closeMenu);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); toggler.focus(); }
      });

      const mq = window.matchMedia('(min-width: 992px)');
      const mqHandler = function (e) {
        if (e.matches) {
          if (menu.classList.contains('is-open')) closeMenu();
          if (searchPanel.classList.contains('is-open')) closeSearch();
        }
      };
      if (mq.addEventListener) mq.addEventListener('change', mqHandler);
      else if (mq.addListener) mq.addListener(mqHandler);
    }

    function openSearch() {
      searchPanel.classList.add('is-open');
      searchPanel.setAttribute('aria-hidden', 'false');
      if (searchOpen) searchOpen.setAttribute('aria-expanded', 'true');
      lockScroll(true);
      window.setTimeout(function () { if (searchInput) searchInput.focus(); }, 220);
    }
    function closeSearch() {
      searchPanel.classList.remove('is-open');
      searchPanel.setAttribute('aria-hidden', 'true');
      if (searchOpen) searchOpen.setAttribute('aria-expanded', 'false');
      if (!menu || !menu.classList.contains('is-open')) lockScroll(false);
    }

    if (searchOpen) {
      searchOpen.addEventListener('click', function (e) {
        e.preventDefault();
        searchPanel.classList.contains('is-open') ? closeSearch() : openSearch();
      });
    }
    if (searchClose) searchClose.addEventListener('click', function (e) { e.preventDefault(); closeSearch(); });

    document.addEventListener('click', function (e) {
      if (!searchPanel.classList.contains('is-open')) return;
      if (searchPanel.contains(e.target)) return;
      if (searchOpen && searchOpen.contains(e.target)) return;
      closeSearch();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && searchPanel.classList.contains('is-open')) {
        closeSearch();
        if (searchOpen) searchOpen.focus();
      }
    });

    if (searchInput) {
      searchInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const q = searchInput.value.trim();
        if (!q) return;
        if (document.body.dataset.page === 'inventory') {
          const page = document.getElementById('page-search');
          if (page) page.value = q;
          document.dispatchEvent(new CustomEvent('search:change', { detail: { query: q } }));
          closeSearch();
        } else {
          gotoSearch(q);
        }
      });
    }
    if (searchClear) {
      searchClear.addEventListener('click', function () {
        if (searchInput) { searchInput.value = ''; searchInput.focus(); }
      });
    }

    const desktopSearch = root.querySelector('#nav-search-input');
    if (desktopSearch) {
      desktopSearch.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const q = desktopSearch.value.trim();
        if (!q) return;
        if (document.body.dataset.page === 'inventory') {
          const page = document.getElementById('page-search');
          if (page) page.value = q;
          document.dispatchEvent(new CustomEvent('search:change', { detail: { query: q } }));
        } else {
          gotoSearch(q);
        }
      });
    }

    setupSticky();
  }

  function setupSticky() {
    const sticky = document.getElementById('nav-sticky');
    const placeholder = document.getElementById('nav-sticky-placeholder');
    const row1 = document.querySelector('.nav-row-1');
    const header = document.querySelector('.site-header');
    if (!sticky || !placeholder || !row1 || !header) return;

    let spacerHeight = 0;

    function measure() {
      spacerHeight = sticky.offsetHeight;
      placeholder.style.height = spacerHeight + 'px';
    }

    function onScroll() {
      const row1Bottom = row1.getBoundingClientRect().bottom;
      const shouldStick = row1Bottom <= 0;

      if (shouldStick) {
        if (sticky.dataset.fixed !== 'true') {
          measure();
          placeholder.hidden = false;
          sticky.style.position = 'fixed';
          sticky.style.top = '0';
          sticky.style.left = '0';
          sticky.style.right = '0';
          sticky.style.zIndex = 'var(--z-sticky)';
          sticky.dataset.fixed = 'true';
          header.classList.add('is-stuck');
        }
      } else {
        if (sticky.dataset.fixed === 'true') {
          sticky.style.position = '';
          sticky.style.top = '';
          sticky.style.left = '';
          sticky.style.right = '';
          sticky.style.zIndex = '';
          placeholder.hidden = true;
          placeholder.style.height = '';
          sticky.dataset.fixed = 'false';
          header.classList.remove('is-stuck');
        }
      }

      header.classList.toggle('is-scrolled', window.scrollY > 8);
    }

    measure();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      if (sticky.dataset.fixed === 'true') measure();
    });
  }

  async function mount() {
    const host = document.querySelector('.site-header');
    if (!host) return;
    if (host.dataset.mounted === 'true') return;
    host.dataset.mounted = 'true';

    try {
      const [laptops, pcs] = await Promise.all([
        NS.Data?.laptops ? NS.Data.laptops().catch(function () { return []; }) : [],
        NS.Data?.pcs     ? NS.Data.pcs().catch(function () { return {}; }) : {},
      ]);
      CATEGORIES = buildCategories({ laptops: laptops, pcs: pcs });
    } catch (e) {
      console.warn('[IT Zone] Navbar: category computation failed.', e);
      CATEGORIES = [];
    }

    host.innerHTML = template();
    attachLogoFallback(host);
    wire(host);
    NS.renderIcons?.(host);

    console.info('[IT Zone] Navbar: ' + CATEGORIES.length + ' categories loaded.');
  }

  NS.Navbar = { mount: mount };
})();