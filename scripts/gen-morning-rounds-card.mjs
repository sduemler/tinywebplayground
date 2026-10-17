#!/usr/bin/env node
// Renders the hub card for Morning Rounds (public/images/projects/morning-rounds.webp):
// a sunrise over a 4×4 board of game tiles (some already ticked off) beside a steaming mug.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { createCanvas } from "canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/images/projects/morning-rounds.webp");

// The hub shows card images at roughly 1.16:1 with object-fit: cover.
const W = 800, H = 690;
const c = createCanvas(W, H);
const ctx = c.getContext("2d");

const sky = ctx.createLinearGradient(0, 0, 0, H);
sky.addColorStop(0, "#f6c98a");
sky.addColorStop(0.55, "#fbe3b8");
sky.addColorStop(1, "#fef5e4");
ctx.fillStyle = sky;
ctx.fillRect(0, 0, W, H);

// the sun, half up behind everything
const sunX = W * 0.5, sunY = H * 0.42;
const glow = ctx.createRadialGradient(sunX, sunY, 60, sunX, sunY, 380);
glow.addColorStop(0, "rgba(255, 214, 140, 0.9)");
glow.addColorStop(1, "rgba(255, 214, 140, 0)");
ctx.fillStyle = glow;
ctx.fillRect(0, 0, W, H);
ctx.fillStyle = "#f0a04b";
ctx.beginPath(); ctx.arc(sunX, sunY, 150, Math.PI, 0); ctx.fill();
ctx.strokeStyle = "rgba(240, 160, 75, 0.55)";
ctx.lineWidth = 10;
ctx.lineCap = "round";
for (let i = 0; i <= 8; i++) {
  const a = Math.PI + (Math.PI * i) / 8;
  ctx.beginPath();
  ctx.moveTo(sunX + Math.cos(a) * 180, sunY + Math.sin(a) * 180);
  ctx.lineTo(sunX + Math.cos(a) * 225, sunY + Math.sin(a) * 225);
  ctx.stroke();
}
// horizon: a tabletop
ctx.fillStyle = "#c98d55";
ctx.fillRect(0, sunY, W, H - sunY);
ctx.fillStyle = "rgba(107, 58, 46, 0.18)";
ctx.fillRect(0, sunY, W, 10);

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// the board: one tile per starter game, colors from TAG_COLORS
const tiles = [
  ["W", "#b5562f", 1], ["Co", "#b5562f", 1], ["St", "#b5562f", 1], ["Mi", "#9a4a2a", 1],
  ["Q", "#b5562f", 1], ["Wa", "#b5562f", 0], ["Sq", "#b5562f", 1], ["Cx", "#b5562f", 0],
  ["Wo", "#6f7a3a", 1], ["G", "#6f7a3a", 0], ["Tr", "#6f7a3a", 0], ["F", "#7a4a5a", 0],
  ["B", "#8a5470", 0], ["$", "#b8892b", 0], ["=", "#a0782a", 0], ["IG", "#5e6b4a", 0],
];
const T = 84, GAP = 14, bx = 70, by = 250;
// paper under the board
// paper and tiles share one slight tilt about the board's centre
const BOARD = 4 * T + 3 * GAP;
ctx.save();
ctx.translate(bx + BOARD / 2, by + BOARD / 2);
ctx.rotate(-0.035);
ctx.translate(-bx - BOARD / 2, -by - BOARD / 2);
ctx.save();
ctx.translate(bx + BOARD / 2, by + BOARD / 2);
ctx.shadowColor = "rgba(59, 42, 26, 0.3)";
ctx.shadowBlur = 24;
ctx.shadowOffsetY = 10;
ctx.fillStyle = "#fffdf5";
const PW = 4 * T + 3 * GAP + 52;
roundRect(-PW / 2, -PW / 2, PW, PW, 18);
ctx.fill();
ctx.restore();

ctx.textAlign = "center";
ctx.textBaseline = "middle";
tiles.forEach(([label, color, done], i) => {
  const x = bx + (i % 4) * (T + GAP), y = by + Math.floor(i / 4) * (T + GAP);
  if (done) {
    roundRect(x + 2, y + 2, T - 4, T - 4, 14);
    ctx.fillStyle = "#fef5e4";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x + T * 0.28, y + T * 0.52);
    ctx.lineTo(x + T * 0.44, y + T * 0.68);
    ctx.lineTo(x + T * 0.73, y + T * 0.34);
    ctx.stroke();
  } else {
    roundRect(x, y, T, T, 14);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
    ctx.fillRect(x + 6, y + T - 7, T - 12, 7);
    ctx.font = 'bold 34px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = "#fef5e4";
    ctx.fillText(label, x + T / 2, y + T / 2 - 2);
  }
});
ctx.restore();

// the mug
const mx = 610, my = 470;
ctx.save();
ctx.shadowColor = "rgba(59, 42, 26, 0.3)";
ctx.shadowBlur = 20;
ctx.shadowOffsetY = 10;
ctx.fillStyle = "#6b3a2e";
roundRect(mx - 80, my - 70, 160, 170, 26);
ctx.fill();
ctx.restore();
ctx.strokeStyle = "#6b3a2e";
ctx.lineWidth = 22;
ctx.beginPath();
ctx.arc(mx + 84, my + 10, 38, -Math.PI / 2, Math.PI / 2);
ctx.stroke();
ctx.fillStyle = "#4a2418";
ctx.beginPath(); ctx.ellipse(mx, my - 66, 70, 14, 0, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#c97b2e";
roundRect(mx - 80, my + 2, 160, 18, 0);
ctx.fill();
// steam
ctx.strokeStyle = "rgba(255, 253, 245, 0.85)";
ctx.lineWidth = 9;
ctx.lineCap = "round";
[-30, 0, 30].forEach((dx, i) => {
  const sx = mx + dx, sy = my - 96;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.bezierCurveTo(sx - 22, sy - 30, sx + 22, sy - 52, sx, sy - 84 - i * 6);
  ctx.stroke();
});

const webp = await sharp(c.toBuffer("image/png")).webp({ quality: 86 }).toBuffer();
fs.writeFileSync(OUT, webp);
console.log(`morning-rounds.webp ${W}×${H}  ${(webp.length / 1024).toFixed(0)} KB`);
