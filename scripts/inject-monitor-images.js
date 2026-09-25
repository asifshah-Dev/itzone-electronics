// scripts/inject-monitor-images.js
/* ─────────────────────────────────────────────────────────
   Injects images ONLY into the `monitors` array of pcs.json.

   Scans assets/img/products/ for mon-XX-N.jpg files and
   updates only those monitors. Laptops, desktops, and tiny
   PCs are left untouched.

   Run: node scripts/inject-monitor-images.js
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

/* ── Collect monitor image files ────────────────────────── */
const byId = {};

fs.readdirSync(PRODUCTS_DIR).forEach(f => {
  /* Only match mon-XX-N.ext */
  const m = f.match(/^(mon-\d+)-(\d+)\.(jpe?g|png|webp|avif)$/i);
  if (!m) return;

  const id   = m[1];                        /* e.g. "mon-01" */
  const num  = parseInt(m[2], 10);
  const ext  = m[3].toLowerCase();
  const priority = { jpg: 1, jpeg: 1, png: 2, webp: 3, avif: 4 }[ext] || 9;

  if (!byId[id]) byId[id] = {};
  /* Prefer jpg if multiple formats exist for the same slot */
  if (!byId[id][num] || priority < byId[id][num].priority) {
    byId[id][num] = { file: BASE + f, priority };
  }
});

/* Sort each monitor's image slots numerically (1, 2, 3, …) */
Object.keys(byId).forEach(id => {
  const sorted = Object.keys(byId[id])
    .map(n => parseInt(n, 10))
    .sort((a, b) => a - b)
    .map(n => byId[id][n].file);
  byId[id] = sorted;
});

/* ── Summary of what we found ───────────────────────────── */
console.log('── Monitor images found ────────────');
Object.keys(byId).sort().forEach(id => {
  console.log(`  ${id} → ${byId[id].length} image${byId[id].length > 1 ? 's' : ''}`);
});
console.log('');

if (Object.keys(byId).length === 0) {
  console.error('❌ No monitor images found. Expected filenames like: mon-01-1.jpg');
  process.exit(1);
}

/* ── Load pcs.json ──────────────────────────────────────── */
if (!fs.existsSync(PCS_FILE)) {
  console.error('❌ data/pcs.json not found.');
  process.exit(1);
}

const pcs = JSON.parse(fs.readFileSync(PCS_FILE, 'utf8'));
const monitors = pcs.monitors || [];

/* ── Update monitors only ───────────────────────────────── */
let updated = 0;
const skipped = [];

monitors.forEach(mon => {
  if (byId[mon.id] && byId[mon.id].length) {
    mon.images = byId[mon.id];
    updated++;
  } else {
    skipped.push(mon.id);
  }
});

/* ── Save ───────────────────────────────────────────────── */
fs.writeFileSync(PCS_FILE, JSON.stringify(pcs, null, 2));

console.log(`✅ Updated ${updated} / ${monitors.length} monitors`);
if (skipped.length) {
  console.log(`\n⚠️  Skipped (no images found): ${skipped.join(', ')}`);
}

console.log('\n────────────────────────────────────');
console.log('📁 data/pcs.json updated.');
console.log('   (Laptops, desktops, and tiny PCs untouched.)');