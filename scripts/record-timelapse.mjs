#!/usr/bin/env node

/**
 * Renders the crossword timelapse to an MP4 video file.
 *
 * Usage:
 *   node scripts/record-timelapse.mjs [output.mp4]
 *
 * Requires: ffmpeg, canvas (npm)
 */

import { createCanvas } from "canvas";
import { readFileSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUZZLE_PATH = resolve(__dirname, "../src/data/the-crossword/puzzle.json");
const OUTPUT = resolve(process.argv[2] || "timelapse.mp4");
const FRAMES_DIR = resolve(__dirname, "../.timelapse-frames");

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const FRAMES_PER_SOLVE = 3;
const HOLD_FRAMES = FPS * 3;
const CELL_SIZE = 40;
const BG_COLOR = "#fef9e7";

const API_KEY = "AIzaSyCm_YS8q1ql49MXps6E7PAeqfJy1ILtKiE";
const PROJECT = "the-crossword-680f8";
const PUZZLE_ID = "puzzle-001";

// --- Fetch data from Firestore REST API ---

async function fetchCollection(path) {
  const docs = [];
  let pageToken = null;
  while (true) {
    let url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}?key=${API_KEY}&pageSize=300`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const resp = await fetch(url);
    const data = await resp.json();
    docs.push(...(data.documents || []));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return docs;
}

function parseValue(v) {
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return parseInt(v.integerValue);
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v)
    return (v.arrayValue.values || []).map(parseValue);
  return null;
}

function parseDoc(doc) {
  const obj = {};
  for (const [k, v] of Object.entries(doc.fields || {})) {
    obj[k] = parseValue(v);
  }
  obj._id = doc.name.split("/").pop();
  return obj;
}

console.log("Fetching solve history...");
const historyDocs = await fetchCollection(`puzzles/${PUZZLE_ID}/solveHistory`);
const history = historyDocs
  .map(parseDoc)
  .sort((a, b) => a.solveSequence - b.solveSequence);
console.log(`  ${history.length} solve events`);

console.log("Loading puzzle data...");
const puzzle = JSON.parse(readFileSync(PUZZLE_PATH, "utf-8"));
const entryMap = new Map();
for (const e of puzzle.entries) {
  entryMap.set(e.id, e);
}
console.log(`  ${entryMap.size} entries`);

// --- Compute grid bounds ---

let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
for (const entry of entryMap.values()) {
  for (let i = 0; i < entry.length; i++) {
    const r = entry.direction === "down" ? entry.row + i : entry.row;
    const c = entry.direction === "across" ? entry.col + i : entry.col;
    if (r < minRow) minRow = r;
    if (r > maxRow) maxRow = r;
    if (c < minCol) minCol = c;
    if (c > maxCol) maxCol = c;
  }
}

const boundsW = maxCol - minCol + 1;
const boundsH = maxRow - minRow + 1;
const pad = 40;
const availW = WIDTH - pad * 2;
const availH = HEIGHT - pad * 2;
const scale = Math.min(availW / (boundsW * CELL_SIZE), availH / (boundsH * CELL_SIZE));
const offsetX = pad + (availW - boundsW * CELL_SIZE * scale) / 2 - minCol * CELL_SIZE * scale;
const offsetY = pad + (availH - boundsH * CELL_SIZE * scale) / 2 - minRow * CELL_SIZE * scale;
const cellPx = CELL_SIZE * scale;

// --- Color gradient (matches TimelapsePlayer.tsx) ---

function solveColor(index, total) {
  const t = total > 1 ? index / (total - 1) : 0;
  const r = Math.round(200 - t * 158);
  const g = Math.round(220 - t * 120);
  const b = Math.round(240 - t * 20);
  return `rgb(${r},${g},${b})`;
}

// --- Precompute all grid cells ---

const allGridCells = [];
for (const entry of entryMap.values()) {
  for (let i = 0; i < entry.length; i++) {
    const r = entry.direction === "down" ? entry.row + i : entry.row;
    const c = entry.direction === "across" ? entry.col + i : entry.col;
    allGridCells.push({ r, c });
  }
}

// --- Render frames ---

mkdirSync(FRAMES_DIR, { recursive: true });

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");

const filled = new Map();
let frameNum = 0;
const totalFrames = (history.length + 1) * FRAMES_PER_SOLVE + HOLD_FRAMES;

console.log(`\nRendering ${history.length} solves → ${totalFrames} frames (${(totalFrames / FPS).toFixed(1)}s)`);

function drawFrame() {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (const { r, c } of allGridCells) {
    ctx.fillStyle = "#eee8d5";
    ctx.fillRect(offsetX + c * cellPx, offsetY + r * cellPx, cellPx, cellPx);
  }

  for (const [key, { color, letter }] of filled) {
    const [r, c] = key.split(",").map(Number);
    const x = offsetX + c * cellPx;
    const y = offsetY + r * cellPx;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, cellPx, cellPx);

    if (cellPx > 6) {
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${cellPx * 0.5}px Nunito, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letter, x + cellPx / 2, y + cellPx / 2 + 1);
    }
  }

  if (cellPx > 1) {
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 0.5;
    for (const { r, c } of allGridCells) {
      ctx.strokeRect(offsetX + c * cellPx, offsetY + r * cellPx, cellPx, cellPx);
    }
  }
}

function writeFrame() {
  const padded = String(frameNum).padStart(6, "0");
  writeFileSync(`${FRAMES_DIR}/frame_${padded}.png`, canvas.toBuffer("image/png"));
  frameNum++;
}

// Frame 0: empty grid
drawFrame();
for (let r = 0; r < FRAMES_PER_SOLVE; r++) writeFrame();

// Each solve
for (let i = 0; i < history.length; i++) {
  const event = history[i];
  const entry = entryMap.get(event.entryId);
  if (entry) {
    const color = solveColor(i, history.length);
    for (let j = 0; j < entry.length; j++) {
      const r = entry.direction === "down" ? entry.row + j : entry.row;
      const c = entry.direction === "across" ? entry.col + j : entry.col;
      filled.set(`${r},${c}`, { color, letter: entry.word[j] });
    }
  }
  drawFrame();
  for (let r = 0; r < FRAMES_PER_SOLVE; r++) writeFrame();

  if ((i + 1) % 100 === 0 || i === history.length - 1) {
    process.stdout.write(`\r  Rendered ${i + 1}/${history.length} solves (frame ${frameNum}/${totalFrames})`);
  }
}

// Hold on final frame
for (let r = 0; r < HOLD_FRAMES; r++) writeFrame();
console.log("");

// --- Encode with ffmpeg ---

console.log(`\nEncoding to ${OUTPUT}...`);
execSync(
  `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}/frame_%06d.png" -c:v libx264 -pix_fmt yuv420p -preset medium -crf 18 "${OUTPUT}"`,
  { stdio: "inherit" },
);

// Cleanup
rmSync(FRAMES_DIR, { recursive: true, force: true });

console.log(`\nDone! Video saved to ${OUTPUT}`);
