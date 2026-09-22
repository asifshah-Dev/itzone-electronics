// scripts/download-images.js
/* ─────────────────────────────────────────────────────────
   Downloads 3 product images per item.

   Strategy:
     1. Build a targeted search on the manufacturer's site
        (site:dell.com, site:hp.com, site:lenovo.com)
     2. Extract product-page URLs from the results
     3. For each product page, extract <img> URLs that
        look like product shots
     4. Download up to 3 distinct images per item
   ───────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'img', 'products');
const DATA_DIR = path.join(ROOT, 'data');
const IMAGES_PER_ITEM = 3;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/* ── HTTP helpers ───────────────────────────────────────── */
function httpGet(url, opts, depth) {
  opts = opts || {};
  depth = depth || 0;
  if (depth > 5) return Promise.reject(new Error('too many redirects'));

  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: Object.assign({
        'User-Agent':      UA,
        'Accept':          opts.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }, opts.headers || {}),
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, url).href;
        res.resume();
        return resolve(httpGet(next, opts, depth + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({ body: buf, headers: res.headers });
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
  });
}

async function fetchText(url) {
  const r = await httpGet(url);
  return r.body.toString('utf8');
}

async function downloadBinary(url, dest) {
  const r = await httpGet(url, {
    accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
    headers: { 'Referer': 'https://www.google.com/' },
  });
  const ct = r.headers['content-type'] || '';
  if (!/^image\//.test(ct)) throw new Error('not an image: ' + ct);
  if (r.body.length < 5000) throw new Error('image too small');
  fs.writeFileSync(dest, r.body);
  return r.body.length;
}

/* ── Build the manufacturer domain for a brand ──────────── */
function brandDomain(brand) {
  const b = (brand || '').toUpperCase();
  if (b === 'DELL') return 'dell.com';
  if (b === 'HP') return 'hp.com';
  if (b === 'LENOVO') return 'lenovo.com';
  if (b === 'LG') return 'lg.com';
  if (b === 'ACER') return 'acer.com';
  return null;
}

/* ── Extract product page URLs from a Bing HTML page ────── */
function extractBingLinks(html) {
  const out = new Set();
  /* Bing wraps results in <a href="..."> — often in a specific class */
  const re = /<a[^>]+href="(https?:\/\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const u = m[1];
    if (/bing\.com|microsoft\.com|go\.microsoft/.test(u)) continue;
    out.add(u);
  }
  return [...out];
}

/* ── Extract candidate product-image URLs from a product page ── */
function extractImageUrls(html, brand) {
  const urls = new Set();

  /* Try to find JSON-embedded image URLs first (highest quality) */
  const jsonPatterns = [
    /"imageUrl"\s*:\s*"(https?:\\?\/\\?\/[^"\\]+)"/g,
    /"image"\s*:\s*"(https?:\\?\/\\?\/[^"\\]+\.(?:jpg|jpeg|png|webp))/gi,
    /"largeImage"\s*:\s*"(https?:\\?\/\\?\/[^"\\]+)"/g,
    /"mediumImage"\s*:\s*"(https?:\\?\/\\?\/[^"\\]+)"/g,
  ];
  for (const re of jsonPatterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      const raw = m[1].replace(/\\\//g, '/');
      urls.add(raw);
    }
  }

  /* Then look for <img src> or <img data-src> */
  const imgPatterns = [
    /<img[^>]+(?:data-src|data-lazy-src|src)="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"/gi,
    /<source[^>]+srcset="(https?:\/\/[^\s"]+\.(?:jpg|jpeg|png|webp))/gi,
  ];
  for (const re of imgPatterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      urls.add(m[1]);
    }
  }

  /* Filter out obvious non-product shots */
  const filtered = [...urls].filter(u => {
    const low = u.toLowerCase();
    if (/logo|icon|sprite|placeholder|banner|badge|flag|social|avatar/i.test(low)) return false;
    if (/\.svg($|\?)/i.test(u)) return false;
    return true;
  });

  /* Prefer URLs that contain brand or model keywords */
  const brandLow = (brand || '').toLowerCase();
  return filtered.sort((a, b) => {
    const aScore = (a.toLowerCase().includes(brandLow) ? 10 : 0) +
                   (/product|hero|gallery|feature/i.test(a) ? 5 : 0) +
                   (a.length < 200 ? 2 : 0);
    const bScore = (b.toLowerCase().includes(brandLow) ? 10 : 0) +
                   (/product|hero|gallery|feature/i.test(b) ? 5 : 0) +
                   (b.length < 200 ? 2 : 0);
    return bScore - aScore;
  });
}

/* ── Search Bing for a specific brand's product pages ──── */
async function findProductPages(item) {
  const domain = brandDomain(item.brand);
  if (!domain) throw new Error('unknown brand: ' + item.brand);

  const q = encodeURIComponent(`site:${domain} ${item.brand} ${item.model} specifications`);
  const url = 'https://www.bing.com/search?q=' + q;
  const html = await fetchText(url);
  const links = extractBingLinks(html);
  const brandLinks = links.filter(l => l.includes(domain));
  if (!brandLinks.length) throw new Error('no product pages found');
  return brandLinks.slice(0, 4);
}

/* ── Try to download N distinct images from a set of pages ── */
async function collectImages(item) {
  const pages = await findProductPages(item);
  const downloaded = [];
  const seenUrls = new Set();

  for (const page of pages) {
    if (downloaded.length >= IMAGES_PER_ITEM) break;

    let html;
    try { html = await fetchText(page); }
    catch (e) { continue; }

    const candidates = extractImageUrls(html, item.brand);
    for (const imgUrl of candidates) {
      if (downloaded.length >= IMAGES_PER_ITEM) break;
      if (seenUrls.has(imgUrl)) continue;
      seenUrls.add(imgUrl);

      const ext = '.jpg';                       /* normalize to jpg for GitHub Pages */
      const num = downloaded.length + 1;
      const dest = path.join(OUT_DIR, `${item.id}-${num}${ext}`);

      try {
        const size = await downloadBinary(imgUrl, dest);
        if (size > 8000) {
          downloaded.push({ num, url: imgUrl, size });
        } else {
          fs.unlinkSync(dest);
        }
      } catch (e) {
        try { fs.unlinkSync(dest); } catch (_) {}
      }
    }
  }

  return downloaded;
}

/* ── Main ───────────────────────────────────────────────── */
async function main() {
  console.log('🖼️  Downloading 3 images per product...\n');

  const laptops = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'laptops.json'), 'utf8'));
  const pcs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'pcs.json'), 'utf8'));

  const all = []
    .concat(laptops)
    .concat(pcs.desktops || [])
    .concat(pcs.tiny || [])
    .concat(pcs.monitors || []);

  let okItems = 0, partialItems = 0, failedItems = 0;
  const failures = [];

  for (const item of all) {
    process.stdout.write(`  ⏳ ${item.id} (${item.brand} ${item.model})... `);

    try {
      const found = await collectImages(item);
      if (found.length === 0) {
        console.log('❌ no images');
        failedItems++;
        failures.push(item.id);
      } else if (found.length < IMAGES_PER_ITEM) {
        console.log(`⚠️  only ${found.length}/${IMAGES_PER_ITEM} images`);
        partialItems++;
      } else {
        console.log(`✅ ${found.length} images`);
        okItems++;
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failedItems++;
      failures.push(item.id);
    }

    /* Be polite — 1.2s between items */
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log('\n────────────────────────────────────');
  console.log(`✅ Full success (3 images):  ${okItems}`);
  console.log(`⚠️  Partial (1–2 images):     ${partialItems}`);
  console.log(`❌ Failed (0 images):         ${failedItems}`);

  if (failures.length) {
    console.log(`\nFailed IDs: ${failures.join(', ')}`);
    console.log(`\nYou can manually add images for these items by saving them as:`);
    console.log(`  assets/img/products/<id>-1.jpg`);
    console.log(`  assets/img/products/<id>-2.jpg`);
    console.log(`  assets/img/products/<id>-3.jpg`);
  }
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});