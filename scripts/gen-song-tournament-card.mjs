#!/usr/bin/env node
// Renders the hub card for Song Tournament (public/images/projects/song-tournament.webp):
// a neon eight-song bracket (each song row marked with a music note) narrowing to a trophy
// inscribed CHAMP, in the app's own dark style. The app
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

// An eighth note whose head sits at (x, y), `h` tall.
function note(x, y, h, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.ellipse(x, y, h * 0.24, h * 0.17, -0.45, 0, Math.PI * 2); ctx.fill();
  const sx = x + h * 0.2;
  ctx.fillRect(sx - h * 0.04, y - h, h * 0.08, h);
  ctx.lineWidth = h * 0.09;
  ctx.beginPath();
  ctx.moveTo(sx, y - h);
  ctx.quadraticCurveTo(sx + h * 0.45, y - h * 0.72, sx + h * 0.28, y - h * 0.38);
  ctx.stroke();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const CARD_W = 146, ROW = 34, CARD_H = ROW * 2 + 10, COL_GAP = 40;
const cols = [38, 38 + CARD_W + COL_GAP, 38 + 2 * (CARD_W + COL_GAP)];
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
ctx.moveTo(cols[2] + CARD_W, finalY); ctx.lineTo(cols[2] + CARD_W + 34, finalY);
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
    // the song: a note, then its "title"
    ctx.save();
    if (win) { ctx.shadowColor = "rgba(110, 231, 183, 0.7)"; ctx.shadowBlur = 8; }
    note(x + 18, ry + ROW / 2 + 6, 17, win ? "#6ee7b7" : "#71717a");
    ctx.restore();
    ctx.fillStyle = win ? "#6ee7b7" : "#71717a";
    roundRect(x + 34, ry + ROW / 2 - 5, (CARD_W - 70) * len[row], 10, 5);
    ctx.fill();
    ctx.fillStyle = win ? "#6ee7b7" : "#52525b";
    roundRect(x + CARD_W - 26, ry + ROW / 2 - 5, 12, 10, 3);
    ctx.fill();
  }
}));

// trophy: a glowing gold cup drawn from shapes, with CHAMP engraved on the cup
const tx = cols[2] + CARD_W + 116, ty = finalY + 6;
const gold = ctx.createLinearGradient(tx - 70, ty - 90, tx + 70, ty + 80);
gold.addColorStop(0, "#fde68a");
gold.addColorStop(1, "#f59e0b");
ctx.save();
ctx.shadowColor = "rgba(252, 211, 77, 0.75)";
ctx.shadowBlur = 40;
ctx.fillStyle = gold;
ctx.strokeStyle = gold;
ctx.lineWidth = 12;
ctx.beginPath(); // handles
ctx.arc(tx - 66, ty - 52, 24, Math.PI * 0.5, Math.PI * 1.5);
ctx.stroke();
ctx.beginPath();
ctx.arc(tx + 66, ty - 52, 24, Math.PI * 1.5, Math.PI * 0.5);
ctx.stroke();
ctx.beginPath(); // cup
ctx.moveTo(tx - 66, ty - 92);
ctx.lineTo(tx + 66, ty - 92);
ctx.quadraticCurveTo(tx + 62, ty + 4, tx, ty + 16);
ctx.quadraticCurveTo(tx - 62, ty + 4, tx - 66, ty - 92);
ctx.fill();
ctx.fillRect(tx - 10, ty + 12, 20, 34); // stem
roundRect(tx - 44, ty + 42, 88, 22, 6); // base
ctx.fill();
ctx.restore();

// the engraving: dark letters with a light lower edge, as if cut into the gold
ctx.font = 'bold 26px "Helvetica Neue", Helvetica, Arial, sans-serif';
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillStyle = "rgba(255, 250, 220, 0.55)";
ctx.fillText("CHAMP", tx, ty - 58 + 1.5);
ctx.fillStyle = "#7c2d12";
ctx.fillText("CHAMP", tx, ty - 58);

const webp = await sharp(c.toBuffer("image/png")).webp({ quality: 86 }).toBuffer();
fs.writeFileSync(OUT, webp);
console.log(`song-tournament.webp ${W}×${H}  ${(webp.length / 1024).toFixed(0)} KB`);
