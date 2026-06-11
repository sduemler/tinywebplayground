#!/usr/bin/env node

/**
 * Generates a self-contained HTML "answer key" preview of a built puzzle:
 * the full grid revealed (every cell + letter + clue number) plus the Across/
 * Down clue lists with answers. For QA before launch — read from puzzle.json,
 * touches nothing live (no Firebase). Open the output file in a browser.
 *
 * Usage:
 *   npm run preview-crossword
 *   node scripts/preview-puzzle.mjs [path/to/puzzle.json] [out.html]
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = resolve(__dirname, process.argv[2] || "../src/data/the-crossword/puzzle.json");
const OUTPUT = resolve(__dirname, process.argv[3] || "../puzzle-preview.html");

const puzzle = JSON.parse(readFileSync(INPUT, "utf-8"));
const { gridWidth, gridHeight, entries } = puzzle;

const CELL = 24;
const PAD = 2;

// Place every letter, and record which entry(ies) occupy each cell.
const cells = new Map(); // "r,c" -> { letter }
for (const e of entries) {
  for (let i = 0; i < e.length; i++) {
    const r = e.direction === "down" ? e.row + i : e.row;
    const c = e.direction === "across" ? e.col + i : e.col;
    cells.set(`${r},${c}`, { letter: e.word[i] });
  }
}

// Standard crossword numbering: number each unique start cell in row-major order.
const startCells = new Map(); // "r,c" -> number (assigned after sort)
for (const e of entries) startCells.set(`${e.row},${e.col}`, null);
let n = 0;
const ordered = [...startCells.keys()].sort((a, b) => {
  const [ar, ac] = a.split(",").map(Number);
  const [br, bc] = b.split(",").map(Number);
  return ar - br || ac - bc;
});
for (const key of ordered) startCells.set(key, ++n);
const numberFor = (e) => startCells.get(`${e.row},${e.col}`);

// --- Build the SVG grid ---
const svgW = gridWidth * CELL;
const svgH = gridHeight * CELL;
let rects = "";
for (const [key, cell] of cells) {
  const [r, c] = key.split(",").map(Number);
  const x = c * CELL;
  const y = r * CELL;
  const num = startCells.get(key);
  rects +=
    `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="#fffdf5" stroke="#d8c489" stroke-width="0.5"/>` +
    (num ? `<text x="${x + 1.5}" y="${y + 6}" font-size="7" fill="#8c6d4f">${num}</text>` : "") +
    `<text x="${x + CELL / 2}" y="${y + CELL / 2 + 5}" font-size="13" font-weight="700" text-anchor="middle" fill="#3b2a1a">${cell.letter}</text>`;
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" ` +
  `viewBox="${-PAD} ${-PAD} ${svgW + PAD * 2} ${svgH + PAD * 2}" ` +
  `style="max-width:100%;height:auto;background:#fef9e7;">${rects}</svg>`;

// --- Build the clue lists ---
const esc = (s) => String(s).replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));
function clueRow(e) {
  const badges =
    `<span class="badge style-${e.style}">${e.style}</span>` +
    `<span class="badge cat">${esc(e.category)}</span>` +
    (e.media ? `<span class="badge media">media: ${esc(e.media.type)}</span>` : "");
  return `<li><b>${numberFor(e)}.</b> ${esc(e.clue)} <span class="ans">${esc(e.word)}</span> ${badges}</li>`;
}
const across = entries
  .filter((e) => e.direction === "across")
  .sort((a, b) => numberFor(a) - numberFor(b))
  .map(clueRow)
  .join("");
const down = entries
  .filter((e) => e.direction === "down")
  .sort((a, b) => numberFor(a) - numberFor(b))
  .map(clueRow)
  .join("");

// --- Stats for the header ---
const byCat = {};
let media = 0;
const byStyle = { crossword: 0, jeopardy: 0 };
for (const e of entries) {
  byCat[e.category] = (byCat[e.category] || 0) + 1;
  if (e.media) media++;
  byStyle[e.style] = (byStyle[e.style] || 0) + 1;
}
const catLines = Object.entries(byCat)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `${esc(k)}: ${v}`)
  .join(" · ");

const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Puzzle preview — ${entries.length} entries</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; background:#fef9e7; color:#3b2a1a; margin:0; padding:24px; }
  h1 { font-size:20px; } h2 { margin-top:32px; }
  .meta { color:#8c6d4f; font-size:13px; line-height:1.6; max-width:1000px; }
  .gridwrap { overflow:auto; border:1px solid #e4d4a0; border-radius:8px; margin:16px 0; background:#fef9e7; }
  .cols { display:grid; grid-template-columns:1fr 1fr; gap:24px; max-width:1400px; }
  ul { list-style:none; padding:0; margin:0; font-size:13px; }
  li { padding:4px 0; border-bottom:1px solid #f0e6c8; }
  .ans { font-weight:700; color:#c97b2e; margin-left:4px; }
  .badge { display:inline-block; font-size:10px; padding:1px 6px; border-radius:8px; margin-left:4px; vertical-align:middle; }
  .style-crossword { background:#f5e6c8; color:#6b3a2e; }
  .style-jeopardy { background:#6b3a2e; color:#fef5e4; }
  .cat { background:#e4d4a0; color:#3b2a1a; }
  .media { background:#c97b2e; color:#fff; }
  .hint { color:#8c6d4f; font-size:12px; }
</style></head><body>
<h1>🐱 Puzzle preview — full answer key</h1>
<div class="meta">
  <b>${entries.length}</b> entries · grid <b>${gridWidth}×${gridHeight}</b> ·
  crossword <b>${byStyle.crossword}</b> / jeopardy <b>${byStyle.jeopardy}</b> ·
  media <b>${media}</b><br>
  ${catLines}
</div>
<p class="hint">Tip: pinch/ctrl-scroll to zoom the grid. This file is generated from puzzle.json — it is the FULL solution, for your eyes only.</p>
<div class="gridwrap">${svg}</div>
<div class="cols">
  <div><h2>Across (${entries.filter((e) => e.direction === "across").length})</h2><ul>${across}</ul></div>
  <div><h2>Down (${entries.filter((e) => e.direction === "down").length})</h2><ul>${down}</ul></div>
</div>
</body></html>`;

writeFileSync(OUTPUT, html);
console.log(`Wrote ${OUTPUT}`);
console.log(`  ${entries.length} entries, grid ${gridWidth}×${gridHeight}`);
console.log(`Open it: open "${OUTPUT}"`);
