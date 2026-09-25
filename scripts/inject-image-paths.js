// scripts/inject-image-paths.js
/* ─────────────────────────────────────────────────────────
   Scans assets/img/products/ for <id>-<n>.jpg files and
   injects them as `images: [...]` arrays into laptops.json
   and pcs.json.

   - Items with existing images are updated
   - Items without images are left untouched
   - Handles 1, 2, or 3 images per item

   Run: node scripts/inject-image-paths.js
   ───────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PRODUCTS_DIR = path.join(ROOT, 'assets', 'img', 'products');
const DATA_DIR = path.join(ROOT, 'data');

const BASE = 'assets/img/products/';

if (!fs.existsSync(PRODUCTS_DIR)) {
  console.error('❌ assets/img/products/ does not exist.');
  process.exit(1);
}

/* ── Group files by product id ──────────────────────────── */
const byId = {};
fs.readdirSync(PRODUCTS_DIR).forEach(f => {
  const m = f.match(/^(.+?)-(\d+)\.(jpe?g|png|webp|avif)$/i);
  if (!m) return;

  const id   = m[1];
  const num  = parseInt(m[2], 10);
  const ext  = m[3].toLowerCase();
  const priority = { jpg: 1, jpeg: 1, png: 2, webp: 3, avif: 4 }[ext] || 9;

  if (!byId[id]) byId[id] = {};
  /* Prefer jpg if multiple formats exist for the same slot */
  if (!byId[id][num] || priority < byId[id][num].priority) {
    byId[id][num] = { file: BASE + f, priority };
  }
});

/* Sort each product's images by numeric suffix */
Object.keys(byId).forEach(id => {
  const sorted = Object.keys(byId[id])
    .map(n => parseInt(n, 10))
    .sort((a, b) => a - b)
    .map(n => byId[id][n].file);
  byId[id] = sorted;
});

/* ── Attach to items ────────────────────────────────────── */
function attach(items) {
  let updated = 0;
  const next = items.map(item => {
    if (byId[item.id] && byId[item.id].length) {
      item.images = byId[item.id];
      updated++;
    }
    return item;
  });
  return { items: next, updated };
}

/* ── Laptops ────────────────────────────────────────────── */
const laptopsPath = path.join(DATA_DIR, 'laptops.json');
const laptops = JSON.parse(fs.readFileSync(laptopsPath, 'utf8'));
const laptopsRes = attach(laptops);
fs.writeFileSync(laptopsPath, JSON.stringify(laptopsRes.items, null, 2));
console.log(`✅ Laptops: ${laptopsRes.updated} / ${laptops.length} items now have images[]`);

/* ── PCs ────────────────────────────────────────────────── */
const pcsPath = path.join(DATA_DIR, 'pcs.json');
const pcs = JSON.parse(fs.readFileSync(pcsPath, 'utf8'));

let totalPCs = 0, updatedPCs = 0;

['desktops', 'tiny', 'monitors'].forEach(key => {
  const arr = pcs[key] || [];
  totalPCs += arr.length;
  const res = attach(arr);
  pcs[key] = res.items;
  updatedPCs += res.updated;
});
fs.writeFileSync(pcsPath, JSON.stringify(pcs, null, 2));
console.log(`✅ PCs:     ${updatedPCs} / ${totalPCs} items now have images[]`);

/* ── List every id that got images ─────────────────────── */
console.log('\n── Images matched ──────────────────');
Object.keys(byId).sort().forEach(id => {
  console.log(`  ${id} → ${byId[id].length} image${byId[id].length > 1 ? 's' : ''}`);
});

console.log('\n📁 Done. Refresh the site.');