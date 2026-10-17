#!/usr/bin/env node
// Renders the hub card for Song Tournament (public/images/projects/song-tournament.webp):
// a neon eight-song bracket narrowing to a trophy, in the app's own dark style. The app
// itself lives on its own site; see `externalUrl` in src/data/projects.ts.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { createCanvas } from "canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/images/projects/song-tournament.webp");

// The hub shows card images at roughly 1.16:1 with object-fit: cover.
const W = 800, H = 690;
const c = createCanvas(W, H);
const ctx = c.getContext("2d");

const bg = ctx.createRadialGradient(W * 0.55, H * 0.5, 40, W * 0.55, H * 0.5, W * 0.8);
bg.addColorStop(0, "#1e1030");
bg.addColorStop(1, "#09090b");
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const CARD_W = 150, ROW = 34, CARD_H = ROW * 2 + 10, COL_GAP = 46;
const cols = [70, 70 + CARD_W + COL_GAP, 70 + 2 * (CARD_W + COL_GAP)];
const top = 90, span = H - 2 * top;
// match centres per round: 4 → 2 → 1
const centres = [
  [0, 1, 2, 3].map((i) => top + span * (i + 0.5) / 4),
  [0, 1].map((i) => top + span * (i + 0.5) / 2),
  [top + span / 2],
];
// which row won each match (0 = top, 1 = bottom)
const winners = [[0, 1, 1, 0], [1, 0], [0]];
// bar lengths so the "song titles" look like varied text
const lengths = [[0.72, 0.55], [0.6, 0.8], [0.5, 0.68], [0.76, 0.58], [0.66, 0.74], [0.8, 0.52], [0.7, 0.62]];

// connectors
ctx.strokeStyle = "rgba(167, 139, 250, 0.45)";
ctx.lineWidth = 3;
for (let r = 0; r < 2; r++) {
  centres[r].forEach((y1, i) => {
    const y2 = centres[r + 1][Math.floor(i / 2)];
    const x1 = cols[r] + CARD_W, x2 = cols[r + 1], mid = x1 + COL_GAP / 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(mid, y1); ctx.lineTo(mid, y2); ctx.lineTo(x2, y2);
    ctx.stroke();
  });
}
const finalY = centres[2][0];
ctx.beginPath();
ctx.moveTo(cols[2] + CARD_W, finalY); ctx.lineTo(cols[2] + CARD_W + 40, finalY);
ctx.stroke();

let k = 0;
centres.forEach((ys, r) => ys.forEach((cy, i) => {
  const x = cols[r], y = cy - CARD_H / 2;
  const isFinal = r === 2;
  ctx.save();
  ctx.shadowColor = isFinal ? "rgba(232, 121, 249, 0.6)" : "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = isFinal ? 28 : 12;
  ctx.fillStyle = "#18181b";
  roundRect(x, y, CARD_W, CARD_H, 12);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = isFinal ? "rgba(232, 121, 249, 0.85)" : "#3f3f46";
  ctx.lineWidth = 2;
  roundRect(x, y, CARD_W, CARD_H, 12);
  ctx.stroke();
  const len = lengths[k++ % lengths.length];
  for (let row = 0; row < 2; row++) {
    const ry = y + 5 + row * ROW;
    const win = winners[r][i] === row;
    if (win) {
      ctx.fillStyle = "rgba(16, 185, 129, 0.16)";
      ctx.fillRect(x + 2, ry, CARD_W - 4, ROW);
    }
    if (row === 1) { ctx.fillStyle = "#27272a"; ctx.fillRect(x + 10, ry, CARD_W - 20, 2); }
    ctx.fillStyle = win ? "#6ee7b7" : "#71717a";
    roundRect(x + 14, ry + ROW / 2 - 5, (CARD_W - 50) * len[row], 10, 5);
    ctx.fill();
    ctx.fillStyle = win ? "#6ee7b7" : "#52525b";
    roundRect(x + CARD_W - 26, ry + ROW / 2 - 5, 12, 10, 3);
    ctx.fill();
  }
}));

// trophy: a glowing gold cup drawn from shapes (no emoji font needed)
const tx = cols[2] + CARD_W + 92, ty = finalY;
ctx.save();
ctx.shadowColor = "rgba(252, 211, 77, 0.8)";
ctx.shadowBlur = 36;
const gold = ctx.createLinearGradient(tx - 40, ty - 50, tx + 40, ty + 50);
gold.addColorStop(0, "#fde68a");
gold.addColorStop(1, "#f59e0b");
ctx.fillStyle = gold;
ctx.strokeStyle = gold;
ctx.lineWidth = 9;
ctx.beginPath(); // cup
ctx.moveTo(tx - 38, ty - 50);
ctx.lineTo(tx + 38, ty - 50);
ctx.quadraticCurveTo(tx + 36, ty + 6, tx, ty + 14);
ctx.quadraticCurveTo(tx - 36, ty + 6, tx - 38, ty - 50);
ctx.fill();
ctx.beginPath(); ctx.arc(tx - 40, ty - 28, 17, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); // handles
ctx.beginPath(); ctx.arc(tx + 40, ty - 28, 17, Math.PI * 1.5, Math.PI * 0.5); ctx.stroke();
ctx.fillRect(tx - 7, ty + 10, 14, 26); // stem
roundRect(tx - 30, ty + 34, 60, 16, 4); // base
ctx.fill();
ctx.restore();

// a few music notes drifting up from the trophy
ctx.fillStyle = "rgba(125, 211, 252, 0.9)";
ctx.shadowColor = "rgba(56, 189, 248, 0.8)";
ctx.shadowBlur = 14;
for (const [nx, ny, s] of [[tx - 30, ty - 110, 1], [tx + 22, ty - 150, 0.8], [tx - 6, ty - 200, 0.65]]) {
  ctx.beginPath(); ctx.ellipse(nx, ny, 11 * s, 8 * s, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(nx + 8 * s, ny - 38 * s, 4 * s, 38 * s);
  ctx.beginPath();
  ctx.moveTo(nx + 12 * s, ny - 38 * s);
  ctx.quadraticCurveTo(nx + 30 * s, ny - 28 * s, nx + 22 * s, ny - 14 * s);
  ctx.lineWidth = 4 * s; ctx.strokeStyle = ctx.fillStyle; ctx.stroke();
}

const webp = await sharp(c.toBuffer("image/png")).webp({ quality: 86 }).toBuffer();
fs.writeFileSync(OUT, webp);
console.log(`song-tournament.webp ${W}×${H}  ${(webp.length / 1024).toFixed(0)} KB`);
