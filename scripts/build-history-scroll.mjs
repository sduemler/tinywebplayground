#!/usr/bin/env node
// Builds the parchment-scroll artwork for /projects/history-of-the-world from
// two CC0 (public-domain) images on PublicDomainPictures.net:
//
//   • "Parchment roll paper background" by Martina Stokow (image 667614) —
//     a tall parchment sheet with a rolled top, curled/frayed sides and aged
//     stains. We slice it into a top cap (the roll) and a middle band that is
//     mirrored top-to-bottom so it tiles vertically forever with no seam.
//   • "Torn white paper png" (image 677466) — a real torn paper strip. Its
//     fibrous left edge is straightened, rotated and turned into the ragged
//     bottom edge where the scroll "trails off".
//
// It also renders the hub card (public/images/projects/history-of-the-world.webp)
// from those pieces plus the page's OFL fonts.
//
// Sources are cached in scripts/.cache/history-scroll/ (gitignored). Output
// goes to public/images/history-of-the-world/.
//
//   node scripts/build-history-scroll.mjs

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CACHE = path.join(ROOT, "scripts/.cache/history-scroll");
const OUT = path.join(ROOT, "public/images/history-of-the-world");

const SOURCES = {
  parchment:
    "https://www.publicdomainpictures.net/pictures/670000/velka/pergament-rolle-papier-hintergrund.png",
  torn: "https://www.publicdomainpictures.net/pictures/680000/velka/torn-white-paper-png.png",
};

// Output width of every scroll piece; CSS scales them to the scroll's width.
const OUT_W = 1100;

async function fetchSource(name, url, filename = `${name}.png`) {
  const file = path.join(CACHE, filename);
  if (!fs.existsSync(file)) {
    console.log(`Downloading ${name}…`);
    const res = await fetch(url, { headers: { "User-Agent": "tinywebplayground build script" } });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return file;
}

/** Bounding box of pixels whose alpha exceeds `min`. */
function alphaBBox({ data, info }, min = 8) {
  const { width, height, channels } = info;
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > min) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

async function buildParchment(file) {
  const raw = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const box = alphaBBox(raw);
  const trimmed = await sharp(file).extract(box).png().toBuffer();

  // Rows (in the trimmed image) that bound the rolled top and the tile band.
  // The roll finishes ~130px down; the band stops above the bottom rolls.
  const CAP_END = 170;
  const BAND_END = 1400;

  const cap = await sharp(trimmed)
    .extract({ left: 0, top: 0, width: box.width, height: CAP_END })
    .resize({ width: OUT_W })
    .webp({ quality: 82, alphaQuality: 90 })
    .toBuffer();

  const bandH = BAND_END - CAP_END;
  const band = await sharp(trimmed)
    .extract({ left: 0, top: CAP_END, width: box.width, height: bandH })
    .png()
    .toBuffer();
  const flipped = await sharp(band).flip().png().toBuffer();
  // [band ; mirror(band)] — the last row of the mirror equals the first row of
  // the band, so repeating this vertically never shows a seam.
  const tile = await sharp({
    create: { width: box.width, height: bandH * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: band, top: 0, left: 0 },
      { input: flipped, top: bandH, left: 0 },
    ])
    .png()
    .toBuffer();
  const tileOut = await sharp(tile).resize({ width: OUT_W }).webp({ quality: 80, alphaQuality: 90 }).toBuffer();

  fs.writeFileSync(path.join(OUT, "scroll-top.webp"), cap);
  fs.writeFileSync(path.join(OUT, "scroll-tile.webp"), tileOut);
  const capMeta = await sharp(cap).metadata();
  const tileMeta = await sharp(tileOut).metadata();
  console.log(`scroll-top.webp  ${capMeta.width}×${capMeta.height}  ${(cap.length / 1024).toFixed(0)} KB`);
  console.log(`scroll-tile.webp ${tileMeta.width}×${tileMeta.height}  ${(tileOut.length / 1024).toFixed(0)} KB`);
  return { trimmed, box };
}

/**
 * Straighten the torn strip's left edge (keep the fine fray, remove the big
 * diagonal drift), then rotate it so paper is on top and air is below. The
 * result is an alpha mask of the *air* — CSS paints the page background
 * through it over the bottom of the scroll, which reads as a torn-off end.
 */
async function buildTornBottom(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const a = (x, y) => data[(y * width + x) * channels + 3];

  // Use the stretch of the left edge that's torn along its whole length.
  const Y0 = 260, Y1 = 1800;
  const edge = [];
  for (let y = Y0; y < Y1; y++) {
    let x = 0;
    while (x < width && a(x, y) < 128) x++;
    edge.push(x);
  }
  // Heavy moving-average = the drift; edge − drift = the fray we keep.
  const R = 120;
  const drift = edge.map((_, i) => {
    let s = 0, n = 0;
    for (let j = Math.max(0, i - R); j <= Math.min(edge.length - 1, i + R); j++) { s += edge[j]; n++; }
    return s / n;
  });

  const HALF = 70; // px either side of the straightened edge to keep
  const W = HALF * 2, H = Y1 - Y0;
  const out = Buffer.alloc(W * H);
  for (let i = 0; i < H; i++) {
    const y = Y0 + i;
    const base = Math.round(drift[i]) - HALF;
    for (let k = 0; k < W; k++) {
      const x = base + k;
      const alpha = x < 0 ? 0 : x >= width ? 255 : a(x, y);
      out[i * W + k] = 255 - alpha; // invert: opaque where there is NO paper
    }
  }
  // Cross-fade the two ends so the strip can repeat horizontally, too.
  const FADE = 80;
  for (let i = 0; i < FADE; i++) {
    const t = i / FADE;
    for (let k = 0; k < W; k++) {
      const top = out[i * W + k];
      const bot = out[(H - FADE + i) * W + k];
      out[i * W + k] = Math.round(bot * (1 - t) + top * t);
    }
  }
  // Transpose so the edge runs horizontally: strip row i → column i, and the
  // air (left side, k = 0) lands on the bottom row.
  const L = H - FADE;
  const rgbaRaw = Buffer.alloc(L * W * 4);
  for (let i = 0; i < L; i++) {
    for (let k = 0; k < W; k++) {
      const o = ((W - 1 - k) * L + i) * 4;
      rgbaRaw[o] = rgbaRaw[o + 1] = rgbaRaw[o + 2] = 255;
      rgbaRaw[o + 3] = out[i * W + k];
    }
  }
  // The first/last few dozen columns never reach the tear line — trim them so
  // the mask covers the full width of the scroll.
  const TRIM = 60;
  const rgba = await sharp(rgbaRaw, { raw: { width: L, height: W, channels: 4 } })
    .extract({ left: TRIM, top: 0, width: L - TRIM * 2, height: W })
    .resize({ width: OUT_W })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(OUT, "torn-bottom-mask.png"), rgba);
  const m = await sharp(rgba).metadata();
  console.log(`torn-bottom-mask.png ${m.width}×${m.height}  ${(rgba.length / 1024).toFixed(0)} KB`);
}

fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const parchment = await fetchSource("parchment", SOURCES.parchment);
const torn = await fetchSource("torn", SOURCES.torn);
const { trimmed: fullSheet } = await buildParchment(parchment);
await buildTornBottom(torn);

// ── Hub card (public/images/projects/history-of-the-world.webp) ─────────────
// The whole parchment sheet (rolled top and bottom, curled sides) as a single
// opened scroll on the dark desk, with the title stacked in the page's
// calligraphy font. The hub shows card images at roughly 1.16:1 with
// object-fit: cover, so the canvas matches that and keeps the scroll centred.
const FONTS = {
  "PinyonScript-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/pinyonscript/PinyonScript-Regular.ttf",
};

async function buildCard(sheetPng) {
  const { createCanvas, loadImage, registerFont } = await import("canvas");
  for (const [name, url] of Object.entries(FONTS)) await fetchSource(name.replace(/\.ttf$/, ""), url, name);
  registerFont(path.join(CACHE, "PinyonScript-Regular.ttf"), { family: "Pinyon Script" });

  const sheet = await loadImage(sheetPng);
  const W = 800, H = 690;
  const c = createCanvas(W, H);
  const g = c.getContext("2d");
  const glow = g.createRadialGradient(W / 2, H * 0.4, 40, W / 2, H * 0.4, W * 0.75);
  glow.addColorStop(0, "#3a2717");
  glow.addColorStop(1, "#1a110b");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  // The scroll, widened to nearly fill the card. The left and right edges
  // (with their curls) keep their true proportions; only the plain middle of
  // the sheet is stretched, which also lengthens the rolled ends naturally.
  const MARGIN_X = 22, MARGIN_Y = 20;
  const sw = W - MARGIN_X * 2, sh = H - MARGIN_Y * 2;
  const scale = sh / sheet.height;
  const edgeSrc = sheet.width * 0.22;
  const edgeDst = edgeSrc * scale;
  const paper = createCanvas(sw, sh);
  const p = paper.getContext("2d");
  p.drawImage(sheet, 0, 0, edgeSrc, sheet.height, 0, 0, edgeDst + 1, sh);
  p.drawImage(sheet, edgeSrc, 0, sheet.width - edgeSrc * 2, sheet.height, edgeDst, 0, sw - edgeDst * 2 + 1, sh);
  p.drawImage(sheet, sheet.width - edgeSrc, 0, edgeSrc, sheet.height, sw - edgeDst, 0, edgeDst, sh);

  g.save();
  g.shadowColor = "rgba(0,0,0,0.55)";
  g.shadowBlur = 24;
  g.shadowOffsetY = 8;
  g.drawImage(paper, MARGIN_X, MARGIN_Y);
  g.restore();

  // Title, stacked, in ink — as large as the sheet comfortably allows.
  g.fillStyle = "#3a2413";
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  const lines = [
    { text: "History", size: 168, y: 268, dx: -6 },
    { text: "of the", size: 112, y: 392, dx: 8 },
    { text: "World", size: 180, y: 560, dx: 0 },
  ];
  for (const l of lines) {
    g.font = `${l.size}px "Pinyon Script"`;
    g.fillText(l.text, W / 2 + l.dx, l.y);
  }

  const card = await sharp(c.toBuffer("image/png")).webp({ quality: 86 }).toBuffer();
  const cardPath = path.join(ROOT, "public/images/projects/history-of-the-world.webp");
  fs.writeFileSync(cardPath, card);
  console.log(`history-of-the-world.webp (card) ${W}×${H}  ${(card.length / 1024).toFixed(0)} KB`);
}

await buildCard(fullSheet);
console.log("Done.");
