// scripts/inject-laptop-images.js
/* ─────────────────────────────────────────────────────────
   Injects images ONLY into laptops.json.

   Scans assets/img/products/ for lap-XXX-N.jpg files and
   updates only matching laptops. Preserves existing images
   for any laptop that doesn't have new files.

   Run: node scripts/inject-laptop-images.js
   ───────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PRODUCTS_DIR = path.join(ROOT, 'assets', 'img', 'products');
const DATA_DIR = path.join(ROOT, 'data');
const LAPTOPS_FILE = path.join(DATA_DIR, 'laptops.json');

const BASE = 'assets/img/products/';

if (!fs.existsSync(PRODUCTS_DIR)) {
  console.error('❌ assets/img/products/ does not exist.');
  process.exit(1);
}

/* ── Collect laptop image files ─────────────────────────── */
const byId = {};

fs.readdirSync(PRODUCTS_DIR).forEach(f => {
  /* Match lap-XXX-N.ext — three-digit id */
  const m = f.match(/^(lap-\d{3})-(\d+)\.(jpe?g|png|webp|avif)$/i);
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

/* ── Summary ────────────────────────────────────────────── */
console.log('── Laptop images found ─────────────');
Object.keys(byId).sort().forEach(id => {
  console.log(`  ${id} → ${byId[id].length} image${byId[id].length > 1 ? 's' : ''}`);
});
console.log('');

if (Object.keys(byId).length === 0) {
  console.error('❌ No laptop images found. Expected: lap-001-1.jpg etc.');
  process.exit(1);
}

/* ── Load laptops.json ──────────────────────────────────── */
if (!fs.existsSync(LAPTOPS_FILE)) {
  console.error('❌ data/laptops.json not found.');
  process.exit(1);
}

const laptops = JSON.parse(fs.readFileSync(LAPTOPS_FILE, 'utf8'));

/* ── Update laptops ─────────────────────────────────────── */
let updated = 0;
let kept = 0;
const missing = [];

laptops.forEach(lap => {
  if (byId[lap.id] && byId[lap.id].length) {
    lap.images = byId[lap.id];
    updated++;
  } else if (Array.isArray(lap.images) && lap.images.length) {
    /* Has images from before, not touching */
    kept++;
  } else {
    missing.push(lap.id);
  }
});

fs.writeFileSync(LAPTOPS_FILE, JSON.stringify(laptops, null, 2));

console.log(`✅ Updated with NEW images: ${updated}`);
console.log(`📁 Kept existing images:    ${kept}`);
if (missing.length) {
  console.log(`\n⚠️  Still without images: ${missing.join(', ')}`);
}

console.log('\n────────────────────────────────────');
console.log('📁 data/laptops.json updated.');
console.log('   (pcs.json untouched.)');