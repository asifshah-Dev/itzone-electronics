// assets/js/components/Navbar.js
/* ─────────────────────────────────────────────────────────
   Navbar — single-row design.
   Left:  Logo
   Center: Nav links (Laptops ▾, PCs ▾, Monitors, Accessories, Contact)
   Right:  Search / Call / Menu
   Mobile: Logo | Search icon | Menu icon + slide-in drawer with
           accordion-style collapsible groups.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const NS = (window.ITZone = window.ITZone || {});

  const PHONE_DISPLAY = '03265974741';
  const PHONE_TEL     = 'tel:+923265974741';

  /* ═══════════════════════════════════════════════════════
     NAV STRUCTURE
     ═══════════════════════════════════════════════════════ */
  const NAV_STRUCTURE = [
    {
      label: 'Laptops',
      href: 'pages/inventory.html',
      children: [
        {
          label: 'HP',
          href: 'pages/inventory.html?brand=hp',
          children: [
            { label: 'Pavilion',  href: 'pages/inventory.html?brand=hp&model=pavilion' },
            { label: 'EliteBook', href: 'pages/inventory.html?brand=hp&model=elitebook' },
            { label: 'ProBook',   href: 'pages/inventory.html?brand=hp&model=probook' },
            { label: 'ZBook',     href: 'pages/inventory.html?brand=hp&model=zbook' }
          ]
        },
        {
          label: 'Dell',
          href: 'pages/inventory.html?brand=dell',
          children: [
            { label: 'Latitude', href: 'pages/inventory.html?brand=dell&model=latitude' },
            { label: 'Inspiron', href: 'pages/inventory.html?brand=dell&model=inspiron' },
            { label: 'Vostro',   href: 'pages/inventory.html?brand=dell&model=vostro' }
          ]
        },
        {
          label: 'Lenovo',
          href: 'pages/inventory.html?brand=lenovo',
          children: [
            { label: 'ThinkPad', href: 'pages/inventory.html?brand=lenovo&model=thinkpad' },
            { label: 'IdeaPad',  href: 'pages/inventory.html?brand=lenovo&model=ideapad' }
          ]
        },
        {
          label: 'Apple',
          href: 'pages/inventory.html?brand=apple',
          children: [
            { label: 'MacBook Air', href: 'pages/inventory.html?brand=apple&model=macbook-air' },
            { label: 'MacBook Pro', href: 'pages/inventory.html?brand=apple&model=macbook-pro' }
          ]
        },
        {
          label: 'Microsoft',
          href: 'pages/inventory.html?brand=microsoft',
          children: [
            { label: 'Surface',        href: 'pages/inventory.html?brand=microsoft&model=surface' },
            { label: 'Surface Laptop', href: 'pages/inventory.html?brand=microsoft&model=surface-laptop' },
            { label: 'Surface Book',   href: 'pages/inventory.html?brand=microsoft&model=surface-book' }
          ]
        }
      ]
    },
    {
      label: 'PCs',
      href: 'pages/pcs.html',
      children: [
        { label: 'Desktops', href: 'pages/pcs.html#desktops' },
        { label: 'Tiny PCs', href: 'pages/pcs.html#tiny' }
      ]
    },
    { label: 'Monitors',    href: 'pages/pcs.html#monitors' },
    { label: 'Accessories', href: 'pages/inventory.html?tag=accessories' },
    { label: 'Contact',     href: 'pages/contact.html' }
  ];

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */
  function isInPagesDir() { return /\/pages\//.test(window.location.pathname); }

  function r(href) {
    if (!href) return '';
    if (href.startsWith('#')) return isInPagesDir() ? `../index.html${href}` : href;
    if (/^https?:|^tel:|^mailto:/.test(href)) return href;
    if (isInPagesDir()) return href.startsWith('pages/') ? href.replace('pages/', '') : `../${href}`;
    return href;
  }

  function whatsappSvg(size) {
    const s = size || 20;
    return (
      '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
        '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />' +
      '</svg>'
    );
  }

  function inlineLogoSVG(cls) {
    return `
      <svg class="${cls || 'nav-logo'}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
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

  /* ═══════════════════════════════════════════════════════
     DESKTOP NAV LINKS with nested dropdowns
     ═══════════════════════════════════════════════════════ */
  function buildDesktopNav() {
    return NAV_STRUCTURE.map(function (item) {

      if (!item.children || !item.children.length) {
        return '<li><a class="nav-item" href="' + r(item.href) + '">' + item.label + '</a></li>';
      }

      const childItems = item.children.map(function (child) {

        if (!child.children || !child.children.length) {
          return '<li><a class="nav-subitem" href="' + r(child.href) + '">' + child.label + '</a></li>';
        }

        const subItems = child.children.map(function (gc) {
          return '<li><a class="nav-subitem nav-subitem--deep" href="' + r(gc.href) + '">' + gc.label + '</a></li>';
        }).join('');

        return (
          '<li class="nav-parent">' +
            '<a class="nav-subitem nav-subitem--parent" href="' + r(child.href) + '">' +
              '<span>' + child.label + '</span>' +
              '<i data-lucide="chevron-right" class="nav-caret-right"></i>' +
            '</a>' +
            '<ul class="nav-flyout">' + subItems + '</ul>' +
          '</li>'
        );
      }).join('');

      return (
        '<li class="nav-dropdown">' +
          '<button type="button" class="nav-item nav-item--has-children" aria-haspopup="true" aria-expanded="false">' +
            item.label +
            '<i data-lucide="chevron-down" class="nav-caret-down"></i>' +
          '</button>' +
          '<ul class="nav-menu">' + childItems + '</ul>' +
        '</li>'
      );
    }).join('');
  }

  /* ═══════════════════════════════════════════════════════
     MOBILE ACCORDION — nested collapsible groups
     ═══════════════════════════════════════════════════════ */
  function buildMobileAccordion() {
    return NAV_STRUCTURE.map(function (item, idx) {
      const hasChildren = item.children && item.children.length;
      const id = 'mob-group-' + idx;

      if (!hasChildren) {
        return (
          '<li class="mob-item">' +
            '<a class="mob-link" href="' + r(item.href) + '">' + item.label + '</a>' +
          '</li>'
        );
      }

      const brandsMarkup = item.children.map(function (child, cidx) {
        const hasGrand = child.children && child.children.length;
        const cid = 'mob-sub-' + idx + '-' + cidx;

        if (!hasGrand) {
          return (
            '<li class="mob-subitem">' +
              '<a class="mob-sublink" href="' + r(child.href) + '">' + child.label + '</a>' +
            '</li>'
          );
        }

        const modelsMarkup = child.children.map(function (gc) {
          return (
            '<li class="mob-modelitem">' +
              '<a class="mob-modellink" href="' + r(gc.href) + '">' + gc.label + '</a>' +
            '</li>'
          );
        }).join('');

        return (
          '<li class="mob-subgroup">' +
            '<button type="button" class="mob-sublink mob-sublink--toggle" ' +
                    'data-target="' + cid + '" aria-expanded="false">' +
              '<span>' + child.label + '</span>' +
              '<i data-lucide="chevron-down" class="mob-caret"></i>' +
            '</button>' +
            '<ul class="mob-models" id="' + cid + '">' + modelsMarkup + '</ul>' +
          '</li>'
        );
      }).join('');

      return (
        '<li class="mob-group">' +
          '<button type="button" class="mob-link mob-link--toggle" ' +
                  'data-target="' + id + '" aria-expanded="false">' +
            '<span>' + item.label + '</span>' +
            '<i data-lucide="chevron-down" class="mob-caret"></i>' +
          '</button>' +
          '<ul class="mob-sublist" id="' + id + '">' + brandsMarkup + '</ul>' +
        '</li>'
      );
    }).join('');
  }

  /* ═══════════════════════════════════════════════════════
     TEMPLATE
     ═══════════════════════════════════════════════════════ */
  function template() {
    const logoSrc = r('assets/img/logo.png');
    const desktopNav = buildDesktopNav();
    const drawerItems = buildMobileAccordion();

    return `
      <nav class="site-nav" aria-label="Primary">
        <div class="nav-container">

          <!-- LEFT: Logo -->
          <a class="nav-brand" href="${r('index.html')}" aria-label="IT Zone Electronics \u2014 Home">
            <img class="nav-logo" src="${logoSrc}" alt="IT Zone Electronics"
                 decoding="async" fetchpriority="high">
          </a>

          <!-- CENTER: Nav links -->
          <ul class="nav-list" id="desktop-nav">
            ${desktopNav}
          </ul>

          <!-- RIGHT: Search / Call / Menu -->
          <div class="nav-end">
            <button type="button" class="nav-icon-btn" id="nav-search-toggle"
                    aria-label="Search" aria-expanded="false" aria-controls="nav-search-panel">
              <i data-lucide="search"></i>
            </button>

            <a href="${PHONE_TEL}" class="nav-icon-btn nav-icon-btn--phone" aria-label="Call ${PHONE_DISPLAY}">
              <i data-lucide="phone"></i>
            </a>

            <a href="${PHONE_TEL}" class="nav-call-btn">
              <i data-lucide="phone"></i>
              <span>${PHONE_DISPLAY}</span>
            </a>

            <button type="button" class="nav-menu-btn" id="nav-menu-toggle"
                    aria-label="Open menu" aria-expanded="false" aria-controls="mobile-drawer">
              <i data-lucide="menu"></i>
            </button>
          </div>

        </div>

        <!-- Search panel (drops below navbar) -->
        <div class="nav-search-panel" id="nav-search-panel" aria-hidden="true">
          <form class="nav-search-form" role="search" onsubmit="return false;">
            <i data-lucide="search" class="nav-search-icon"></i>
            <input type="search" id="nav-search-input" class="nav-search-input"
                   placeholder="Search laptops, PCs, monitors\u2026" autocomplete="off">
            <button type="button" class="nav-search-close" id="nav-search-close" aria-label="Close search">
              <i data-lucide="x"></i>
            </button>
          </form>
        </div>
      </nav>

      <!-- Mobile drawer -->
      <aside class="mobile-drawer" id="mobile-drawer" aria-hidden="true" aria-label="Menu">
        <header class="mobile-drawer-head">
          <a class="mobile-drawer-brand" href="${r('index.html')}" aria-label="Home">
            <img class="mobile-drawer-logo" src="${logoSrc}" alt="IT Zone Electronics" decoding="async">
          </a>
          <button type="button" class="mobile-drawer-close" id="mobile-drawer-close" aria-label="Close menu">
            <i data-lucide="x"></i>
          </button>
        </header>

        <nav class="mobile-drawer-nav">
          <ul class="mobile-drawer-list">
            ${drawerItems}
          </ul>
        </nav>

        <footer class="mobile-drawer-foot">
          <a href="${PHONE_TEL}" class="mobile-drawer-call">
            <i data-lucide="phone"></i>
            <span>Call ${PHONE_DISPLAY}</span>
          </a>
        </footer>
      </aside>

      <div class="mobile-drawer-backdrop" id="mobile-drawer-backdrop" hidden></div>
    `;
  }

  /* ═══════════════════════════════════════════════════════
     LOGO FALLBACK
     ═══════════════════════════════════════════════════════ */
  function attachLogoFallback(root) {
    root.querySelectorAll('img.nav-logo, img.mobile-drawer-logo').forEach(function (img) {
      img.addEventListener('error', function () {
        const wrapper = document.createElement('div');
        const cls = img.classList.contains('mobile-drawer-logo') ? 'mobile-drawer-logo' : 'nav-logo';
        wrapper.innerHTML = inlineLogoSVG(cls).trim();
        img.replaceWith(wrapper.firstElementChild);
      }, { once: true });
    });
  }

  /* ═══════════════════════════════════════════════════════
     WIRE
     ═══════════════════════════════════════════════════════ */
  function wire(root) {
    const searchToggle = root.querySelector('#nav-search-toggle');
    const searchPanel  = root.querySelector('#nav-search-panel');
    const searchClose  = root.querySelector('#nav-search-close');
    const searchInput  = root.querySelector('#nav-search-input');

    const menuToggle   = root.querySelector('#nav-menu-toggle');
    const drawer       = root.querySelector('#mobile-drawer');
    const drawerClose  = root.querySelector('#mobile-drawer-close');
    const drawerBack   = root.querySelector('#mobile-drawer-backdrop');

    const lockScroll = function (on) { document.documentElement.style.overflow = on ? 'hidden' : ''; };

    /* ── Desktop dropdowns ─────────────────────────────── */
    function closeAllDropdowns() {
      root.querySelectorAll('.nav-dropdown.is-open').forEach(function (dd) {
        dd.classList.remove('is-open');
        const b = dd.querySelector('.nav-item--has-children');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }

    root.querySelectorAll('.nav-dropdown').forEach(function (dd) {
      const trigger = dd.querySelector('.nav-item--has-children');
      if (!trigger) return;
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const wasOpen = dd.classList.contains('is-open');
        closeAllDropdowns();
        if (!wasOpen) {
          dd.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });

    document.addEventListener('click', function (e) {
      if (e.target.closest('.nav-dropdown')) return;
      closeAllDropdowns();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllDropdowns();
    });

    /* ── Search panel ──────────────────────────────────── */
    function openSearch() {
      closeAllDropdowns();
      searchPanel.classList.add('is-open');
      searchPanel.setAttribute('aria-hidden', 'false');
      if (searchToggle) searchToggle.setAttribute('aria-expanded', 'true');
      window.setTimeout(function () { if (searchInput) searchInput.focus(); }, 180);
    }
    function closeSearch() {
      searchPanel.classList.remove('is-open');
      searchPanel.setAttribute('aria-hidden', 'true');
      if (searchToggle) searchToggle.setAttribute('aria-expanded', 'false');
    }

    if (searchToggle) {
      searchToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        searchPanel.classList.contains('is-open') ? closeSearch() : openSearch();
      });
    }
    if (searchClose) searchClose.addEventListener('click', closeSearch);

    document.addEventListener('click', function (e) {
      if (!searchPanel.classList.contains('is-open')) return;
      if (searchPanel.contains(e.target)) return;
      if (searchToggle && searchToggle.contains(e.target)) return;
      closeSearch();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && searchPanel.classList.contains('is-open')) {
        closeSearch();
        if (searchToggle) searchToggle.focus();
      }
    });

    /* Search submit */
    if (searchInput) {
      searchInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const q = searchInput.value.trim();
        if (!q) return;
        window.location.href = r('pages/inventory.html') + '?q=' + encodeURIComponent(q);
      });
    }

    /* ── Mobile drawer ─────────────────────────────────── */
    if (menuToggle && drawer && drawerBack) {
      const setIcon = function (el, name) {
        el.innerHTML = '<i data-lucide="' + name + '"></i>';
        NS.renderIcons?.(el);
      };

      /* Accordion toggle behavior */
      drawer.querySelectorAll('.mob-link--toggle, .mob-sublink--toggle').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          const targetId = btn.dataset.target;
          const panel = drawer.querySelector('#' + targetId);
          if (!panel) return;

          const isOpen = btn.getAttribute('aria-expanded') === 'true';

          /* Close siblings at the same level */
          const parentList = btn.closest('ul');
          if (parentList) {
            const selector = ':scope > li > .mob-link--toggle[aria-expanded="true"], ' +
                             ':scope > li > .mob-sublink--toggle[aria-expanded="true"]';
            parentList.querySelectorAll(selector).forEach(function (sib) {
              if (sib === btn) return;
              sib.setAttribute('aria-expanded', 'false');
              const sibPanel = drawer.querySelector('#' + sib.dataset.target);
              if (sibPanel) sibPanel.classList.remove('is-open');
            });
          }

          btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
          panel.classList.toggle('is-open', !isOpen);
        });
      });

      const openDrawer = function () {
        closeSearch();
        closeAllDropdowns();
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        drawerBack.hidden = false;
        void drawerBack.offsetWidth;
        drawerBack.classList.add('is-open');
        menuToggle.setAttribute('aria-expanded', 'true');
        setIcon(menuToggle, 'x');
        lockScroll(true);
      };
      const closeDrawer = function () {
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        drawerBack.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        setIcon(menuToggle, 'menu');
        lockScroll(false);
        window.setTimeout(function () { drawerBack.hidden = true; }, 250);
      };

      menuToggle.addEventListener('click', function (e) {
        e.preventDefault();
        drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
      });
      if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
      drawerBack.addEventListener('click', closeDrawer);

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
          closeDrawer();
          menuToggle.focus();
        }
      });

      /* Auto-close on resize to desktop */
      const mq = window.matchMedia('(min-width: 992px)');
      const mqHandler = function (e) {
        if (e.matches) {
          if (drawer.classList.contains('is-open')) closeDrawer();
          if (searchPanel.classList.contains('is-open')) closeSearch();
        }
      };
      if (mq.addEventListener) mq.addEventListener('change', mqHandler);
      else if (mq.addListener) mq.addListener(mqHandler);
    }
  }

  /* ═══════════════════════════════════════════════════════
     MOUNT
     ═══════════════════════════════════════════════════════ */
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

  NS.Navbar = { mount: mount };
})();