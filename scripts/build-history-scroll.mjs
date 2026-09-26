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
await buildParchment(parchment);
await buildTornBottom(torn);

// ── Hub card (public/images/projects/history-of-the-world.webp) ─────────────
// Built from the same parchment pieces plus the page's two OFL fonts, so the
// card matches the page. Fonts are fetched from the google/fonts repo.
const FONTS = {
  "PinyonScript-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/pinyonscript/PinyonScript-Regular.ttf",
  "IMFeENsc28P.ttf": "https://github.com/google/fonts/raw/main/ofl/imfellenglishsc/IMFeENsc28P.ttf",
};

async function buildCard() {
  const { createCanvas, loadImage, registerFont } = await import("canvas");
  for (const [name, url] of Object.entries(FONTS)) await fetchSource(name.replace(/\.ttf$/, ""), url, name);
  registerFont(path.join(CACHE, "PinyonScript-Regular.ttf"), { family: "Pinyon Script" });
  registerFont(path.join(CACHE, "IMFeENsc28P.ttf"), { family: "IM Fell English SC" });

  const png = async (f) => loadImage(await sharp(path.join(OUT, f)).png().toBuffer());
  const top = await png("scroll-top.webp");
  const tile = await png("scroll-tile.webp");

  const W = 800, H = 520;
  const c = createCanvas(W, H);
  const g = c.getContext("2d");
  const glow = g.createRadialGradient(W / 2, 0, 20, W / 2, 0, W * 0.8);
  glow.addColorStop(0, "#3a2717");
  glow.addColorStop(1, "#1f140d");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  const sw = 640, sx = (W - sw) / 2, sy = 26;
  const capH = (top.height * sw) / top.width;
  const tileH = (tile.height * sw) / tile.width;
  g.drawImage(tile, sx, sy + capH - 1, sw, tileH);
  g.drawImage(top, sx, sy, sw, capH);

  const ink = "#3a2413";
  g.fillStyle = ink;
  g.textAlign = "center";
  g.font = '66px "Pinyon Script"';
  g.fillText("History of the World", W / 2, 200);
  g.fillStyle = "#6e4d2c";
  g.font = '21px "IM Fell English SC"';
  g.fillText("4.54 billion years ago — today", W / 2, 250);

  // A little spine with colour-coded rules and a fold marker.
  const spineX = W / 2;
  g.strokeStyle = "rgba(58,36,19,0.8)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(spineX, 286);
  g.lineTo(spineX, H);
  g.stroke();
  const rule = (y, side, color) => {
    const len = 150;
    const x0 = side < 0 ? spineX - len : spineX;
    const grad = g.createLinearGradient(side < 0 ? x0 : x0 + len, 0, side < 0 ? spineX : spineX, 0);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.45, color);
    grad.addColorStop(1, color);
    g.fillStyle = grad;
    g.fillRect(x0, y - 1.5, len, 3);
    g.beginPath();
    g.arc(spineX, y, 7, 0, Math.PI * 2);
    g.fillStyle = color;
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = ink;
    g.stroke();
  };
  rule(318, -1, "#4b4453");
  rule(372, 1, "#3d7a45");
  rule(492, -1, "#c4561a");

  // Fold marker.
  const pw = 210, ph = 40, px = spineX - pw / 2, py = 412;
  g.fillStyle = "#f0d8ac";
  g.fillRect(px - 4, py - 4, pw + 8, ph + 8);
  g.setLineDash([4, 3]);
  g.strokeStyle = "rgba(58,36,19,0.7)";
  g.lineWidth = 1.5;
  g.strokeRect(px, py, pw, ph);
  g.setLineDash([]);
  g.fillStyle = ink;
  g.font = '20px "IM Fell English SC"';
  g.fillText("≈ 900 million years", spineX, py + 26);

  const card = await sharp(c.toBuffer("image/png")).webp({ quality: 84 }).toBuffer();
  const cardPath = path.join(ROOT, "public/images/projects/history-of-the-world.webp");
  fs.writeFileSync(cardPath, card);
  console.log(`history-of-the-world.webp (card) ${W}×${H}  ${(card.length / 1024).toFixed(0)} KB`);
}

await buildCard();
console.log("Done.");
