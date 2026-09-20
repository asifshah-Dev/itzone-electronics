// assets/js/pages/pcs.page.js
/* ─────────────────────────────────────────────────────────
   PCs & Monitors page — initial render.
   Full card grid lands in a later step.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';
  const NS = (window.ITZone = window.ITZone || {});

  function formatPKR(n) {
    return 'PKR ' + new Intl.NumberFormat('en-PK').format(n);
  }

  function cardTemplate(item, type) {
    const specs = [];
    if (item.cpu) specs.push({ icon: 'cpu', text: item.cpu });
    if (item.ram) specs.push({ icon: 'memory-stick', text: item.ram + 'GB RAM' });
    if (item.hdd) specs.push({ icon: 'hard-drive', text: item.hdd });
    if (item.gpu) specs.push({ icon: 'zap', text: item.gpu });
    if (item.resolution) specs.push({ icon: 'monitor', text: item.resolution });
    if (item.size) specs.push({ icon: 'maximize', text: item.size });

    return `
      <div class="col-12 col-sm-6 col-lg-4">
        <article class="product-card" data-id="${item.id}" data-type="${type}">
          <span class="brand-badge">${item.brand}</span>
          <h3 class="model-name">${item.model}</h3>
          <ul class="spec-list">
            ${specs.map(s => `<li><i data-lucide="${s.icon}"></i> ${s.text}</li>`).join('')}
          </ul>
          <footer class="d-flex justify-content-between align-items-center">
            <span class="price-tag">${formatPKR(item.price)}</span>
            <button class="card-btn" data-action="add-to-cart">
              <i data-lucide="shopping-bag"></i> Add
            </button>
          </footer>
        </article>
      </div>
    `;
  }

  async function init() {
    const grid = document.getElementById('pcs-grid');
    if (!grid) return;

    try {
      const data = await NS.Data.pcs();
      const all = [
        ...data.desktops.map(i => ({ ...i, _type: 'Desktop' })),
        ...data.tiny.map(i => ({ ...i, _type: 'Tiny PC' })),
        ...data.monitors.map(i => ({ ...i, _type: 'Monitor' })),
      ];

      grid.innerHTML = all.map(item => cardTemplate(item, item._type)).join('');
      NS.renderIcons?.(grid);

      console.info(`[IT Zone] Loaded ${all.length} PCs & Monitors items.`);
    } catch (err) {
      console.error('[IT Zone] Failed to load PCs:', err);
      grid.innerHTML = `<p class="text-muted">Could not load data. Check the console.</p>`;
    }
  }

  NS.pcsPage = { init };
})();