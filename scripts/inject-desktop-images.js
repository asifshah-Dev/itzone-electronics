// scripts/inject-desktop-images.js
/* ─────────────────────────────────────────────────────────
   Injects images ONLY into the `desktops` array of pcs.json.

   Run: node scripts/inject-desktop-images.js
   ───────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PRODUCTS_DIR = path.join(ROOT, 'assets', 'img', 'products');
const DATA_DIR = path.join(ROOT, 'data');
const PCS_FILE = path.join(DATA_DIR, 'pcs.json');

const BASE = 'assets/img/products/';

if (!fs.existsSync(PRODUCTS_DIR)) {
  console.error('❌ assets/img/products/ does not exist.');
  process.exit(1);
}

/* ── Collect desktop image files (pc-d-XX-N) ────────────── */
const byId = {};

fs.readdirSync(PRODUCTS_DIR).forEach(f => {
  const m = f.match(/^(pc-d-\d+)-(\d+)\.(jpe?g|png|webp|avif)$/i);
  if (!m) return;

  const id   = m[1];
  const num  = parseInt(m[2], 10);
  const ext  = m[3].toLowerCase();
  const priority = { jpg: 1, jpeg: 1, png: 2, webp: 3, avif: 4 }[ext] || 9;

  if (!byId[id]) byId[id] = {};
  if (!byId[id][num] || priority < byId[id][num].priority) {
    byId[id][num] = { file: BASE + f, priority };
  }
});

Object.keys(byId).forEach(id => {
  const sorted = Object.keys(byId[id])
    .map(n => parseInt(n, 10))
    .sort((a, b) => a - b)
    .map(n => byId[id][n].file);
  byId[id] = sorted;
});

console.log('── Desktop images found ────────────');
Object.keys(byId).sort().forEach(id => {
  console.log(`  ${id} → ${byId[id].length} image${byId[id].length > 1 ? 's' : ''}`);
});
console.log('');

if (Object.keys(byId).length === 0) {
  console.error('❌ No desktop images found. Expected: pc-d-01-1.jpg etc.');
  process.exit(1);
}

/* ── Load pcs.json ──────────────────────────────────────── */
const pcs = JSON.parse(fs.readFileSync(PCS_FILE, 'utf8'));
const desktops = pcs.desktops || [];

/* ── Update desktops only ───────────────────────────────── */
let updated = 0;
const skipped = [];

desktops.forEach(dt => {
  if (byId[dt.id] && byId[dt.id].length) {
    dt.images = byId[dt.id];
    updated++;
  } else {
    skipped.push(dt.id);
  }
});

fs.writeFileSync(PCS_FILE, JSON.stringify(pcs, null, 2));

console.log(`✅ Updated ${updated} / ${desktops.length} desktops`);
if (skipped.length) {
  console.log(`\n⚠️  Skipped (no images found): ${skipped.join(', ')}`);
}

console.log('\n────────────────────────────────────');
console.log('📁 data/pcs.json updated.');
console.log('   (Laptops, tiny PCs, and monitors untouched.)');