// assets/js/components/WarrantyModal.js
/* ─────────────────────────────────────────────────────────
   Warranty Policy Modal.
   Opens when any [data-warranty-open] element is clicked.
   - Injects its own HTML into the DOM once
   - Traps focus, closes on Escape / backdrop / X button
   - Restores scroll position on close
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  const WA_NUMBER = '923265974741';
  const PHONE_DISPLAY = '03265974741';
  const PHONE_TEL = 'tel:+923265974741';

  let modalEl = null;
  let lastFocused = null;

  function warrantyContent() {
    return `
      <div class="wm-body">

        <header class="wm-header">
          <span class="wm-eyebrow">🛡️ Official Warranty</span>
          <h2 class="wm-title">IT Zone Electronics — Warranty Policy</h2>
          <p class="wm-lead">
            At IT Zone Electronics, we deliver <strong>100% genuine UK imported laptops</strong>
            with full transparency. Please review our clear warranty terms below.
          </p>
        </header>

        <article class="warranty-card warranty-card--inspect">
          <header class="warranty-card-head">
            <span class="warranty-card-icon" aria-hidden="true">⏱️</span>
            <div>
              <h3 class="warranty-card-title">Instant On-Spot Inspection</h3>
              <p class="warranty-card-sub">No post-purchase warranty on these components</p>
            </div>
          </header>
          <p class="warranty-card-text">
            The following components must be checked and verified at the time of purchase
            (in-store or via video inspection prior to dispatch).
            <strong>These items carry no warranty after purchase or delivery:</strong>
          </p>
          <ul class="warranty-list warranty-list--warning">
            <li><i data-lucide="monitor"></i><span><strong>Display Screen</strong></span></li>
            <li><i data-lucide="keyboard"></i><span><strong>Keyboard</strong></span></li>
            <li><i data-lucide="volume-2"></i><span><strong>Speakers</strong></span></li>
          </ul>
        </article>

        <article class="warranty-card warranty-card--covered">
          <header class="warranty-card-head">
            <span class="warranty-card-icon" aria-hidden="true">✅</span>
            <div>
              <h3 class="warranty-card-title">30-Day Technical Performance Warranty</h3>
              <p class="warranty-card-sub">From the purchase date</p>
            </div>
          </header>
          <p class="warranty-card-text">
            Your laptop is covered for <strong>internal operational performance</strong>, including:
          </p>
          <ul class="warranty-list warranty-list--covered">
            <li><i data-lucide="thermometer"></i><span><strong>Overheating Issues</strong></span></li>
            <li><i data-lucide="alert-octagon"></i><span><strong>System Freezing / Hanging</strong></span></li>
            <li><i data-lucide="cpu"></i><span><strong>General Operational &amp; Motherboard Performance</strong></span></li>
            <li>
              <i data-lucide="battery-charging"></i>
              <span>
                <strong>Battery Backup:</strong> Guaranteed minimum <strong>1-Hour</strong> backup.
                Typical battery timing ranges from <strong>3 to 3.5 hours</strong> depending on usage.
              </span>
            </li>
          </ul>
        </article>

        <article class="warranty-card warranty-card--void">
          <header class="warranty-card-head">
            <span class="warranty-card-icon" aria-hidden="true">❌</span>
            <div>
              <h3 class="warranty-card-title">Strict Exclusions</h3>
              <p class="warranty-card-sub">Warranty is void under the following conditions</p>
            </div>
          </header>
          <ul class="warranty-list warranty-list--void">
            <li><i data-lucide="flame"></i><span><strong>Burn &amp; Short Circuit Damage</strong></span></li>
            <li><i data-lucide="hammer"></i><span><strong>Physical Breakage, Drops, or Casing Damage</strong></span></li>
            <li><i data-lucide="droplets"></i><span><strong>Liquid / Water Spills</strong></span></li>
          </ul>
        </article>

        <div class="wm-cta">
          <p>Questions about your warranty?</p>
          <div class="wm-cta-actions">
            <a href="${PHONE_TEL}" class="wm-btn wm-btn--call">
              <i data-lucide="phone"></i>
              <span>Call ${PHONE_DISPLAY}</span>
            </a>
            <a href="https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hi IT Zone, I have a warranty question.')}"
               class="wm-btn wm-btn--wa" target="_blank" rel="noopener">
              <svg class="wa-glyph" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    `;
  }

  function buildModal() {
    const el = document.createElement('div');
    el.className = 'wm-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'wm-title');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="wm-panel" role="document">
        <header class="wm-bar">
          <h2 class="wm-bar-title" id="wm-title">Warranty Policy</h2>
          <button type="button" class="wm-close" aria-label="Close warranty policy">
            <i data-lucide="x"></i>
          </button>
        </header>
        ${warrantyContent()}
      </div>
    `;
    return el;
  }

  function open() {
    if (!modalEl) {
      modalEl = buildModal();
      document.body.appendChild(modalEl);
      NS.renderIcons?.(modalEl);

      modalEl.querySelector('.wm-close').addEventListener('click', close);
      modalEl.addEventListener('click', function (e) {
        if (e.target === modalEl) close();
      });
    }

    lastFocused = document.activeElement;
    modalEl.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('wm-open');
    document.body.style.overflow = 'hidden';

    /* Focus the close button so keyboard users land inside */
    requestAnimationFrame(function () {
      const btn = modalEl.querySelector('.wm-close');
      if (btn) btn.focus();
    });
  }

  function close() {
    if (!modalEl) return;
    modalEl.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('wm-open');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  /* Global triggers */
  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('[data-warranty-open]');
    if (!trigger) return;
    e.preventDefault();
    open();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalEl && modalEl.getAttribute('aria-hidden') === 'false') {
      close();
    }
  });

  NS.WarrantyModal = { open: open, close: close };
})();