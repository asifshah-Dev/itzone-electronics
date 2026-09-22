// scripts/inject-image-paths.js
/* ─────────────────────────────────────────────────────────
   Adds an `image` field to every item in laptops.json and pcs.json
   based on what's actually in assets/img/products/.

   Run: node scripts/inject-image-paths.js
   ───────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PRODUCTS_DIR = path.join(ROOT, 'assets', 'img', 'products');
const DATA_DIR = path.join(ROOT, 'data');

const IMAGE_BASE = 'assets/img/products/';

/* List all downloaded image files */
const files = fs.existsSync(PRODUCTS_DIR) ? fs.readdirSync(PRODUCTS_DIR) : [];
const imageById = {};
files.forEach(f => {
  const id = f.replace(/\.[^.]+$/, ''); // strip extension
  imageById[id] = IMAGE_BASE + f;
});

function attach(items) {
  return items.map(item => {
    if (imageById[item.id]) {
      item.image = imageById[item.id];
    }
    return item;
  });
}

/* Laptops */
const laptopsPath = path.join(DATA_DIR, 'laptops.json');
const laptops = JSON.parse(fs.readFileSync(laptopsPath, 'utf8'));
const updatedLaptops = attach(laptops);
fs.writeFileSync(laptopsPath, JSON.stringify(updatedLaptops, null, 2));
console.log(`✅ Updated ${updatedLaptops.filter(l => l.image).length} / ${laptops.length} laptops`);

/* PCs */
const pcsPath = path.join(DATA_DIR, 'pcs.json');
const pcs = JSON.parse(fs.readFileSync(pcsPath, 'utf8'));
pcs.desktops = attach(pcs.desktops || []);
pcs.tiny     = attach(pcs.tiny || []);
pcs.monitors = attach(pcs.monitors || []);
fs.writeFileSync(pcsPath, JSON.stringify(pcs, null, 2));
console.log(`✅ Updated ${(pcs.desktops.filter(x => x.image).length +
                            pcs.tiny.filter(x => x.image).length +
                            pcs.monitors.filter(x => x.image).length)} / ${(pcs.desktops.length + pcs.tiny.length + pcs.monitors.length)} PCs`);

console.log('\n📁 Both JSONs updated with image paths.');