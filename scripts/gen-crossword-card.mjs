#!/usr/bin/env node

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/images/projects/the-crossword.svg");

// 5x7 pixel font (1 = cell present, 0 = empty)
const FONT = {
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "01010"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
};

const LETTER_W = 5;
const LETTER_H = 7;
const LETTER_GAP = 1;
const ROW_GAP = 2;

// Layout: T of THE aligned over C of CROSS
// CROSS starts at col 0. C starts at col 0.
// THE starts at col 0 so T aligns with C.
// WORD indented 1 letter-width so W aligns under R of CROSS.
const rows = [
  { word: "THE", startCol: 0 },
  { word: "CROSS", startCol: 0 },
  { word: "WORD", startCol: 1 * (LETTER_W + LETTER_GAP) },
];

// Compute grid bounds
let maxCol = 0;
for (const r of rows) {
  const endCol = r.startCol + r.word.length * LETTER_W + (r.word.length - 1) * LETTER_GAP;
  if (endCol > maxCol) maxCol = endCol;
}
const gridW = maxCol;
const gridH = rows.length * LETTER_H + (rows.length - 1) * ROW_GAP;

// Build cell set
const cells = new Set();

function placeWord(word, startCol, startRow) {
  for (let i = 0; i < word.length; i++) {
    const letter = FONT[word[i]];
    const colOff = startCol + i * (LETTER_W + LETTER_GAP);
    for (let r = 0; r < LETTER_H; r++) {
      for (let c = 0; c < LETTER_W; c++) {
        if (letter[r][c] === "1") {
          cells.add(`${startRow + r},${colOff + c}`);
        }
      }
    }
  }
}

rows.forEach((r, i) => {
  const startRow = i * (LETTER_H + ROW_GAP);
  placeWord(r.word, r.startCol, startRow);
});

// Size cells to fill the image
const IMG_W = 800;
const IMG_H = 800;
const PAD = 30;
const availW = IMG_W - PAD * 2;
const availH = IMG_H - PAD * 2;

const cellFromW = Math.floor(availW / gridW);
const cellFromH = Math.floor(availH / gridH);
const CELL = Math.min(cellFromW, cellFromH);
const BORDER = Math.max(2, Math.round(CELL * 0.15));

const totalPxW = gridW * CELL;
const totalPxH = gridH * CELL;
const originX = Math.round((IMG_W - totalPxW) / 2);
// Shift up so WORD isn't hidden behind the card's title bar
const originY = Math.round((IMG_H - totalPxH) / 2) - 50;

let rects = "";
for (const key of cells) {
  const [row, col] = key.split(",").map(Number);
  const x = originX + col * CELL;
  const y = originY + row * CELL;
  const inset = BORDER / 2;
  const size = CELL - BORDER;
  rects += `  <rect x="${x + inset}" y="${y + inset}" width="${size}" height="${size}" fill="#ffffff" stroke="#000000" stroke-width="${BORDER}" rx="1"/>\n`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${IMG_W} ${IMG_H}" width="${IMG_W}" height="${IMG_H}">
  <rect width="${IMG_W}" height="${IMG_H}" fill="#000000"/>
${rects}</svg>`;

writeFileSync(OUT, svg);
console.log(`Written to ${OUT}`);
console.log(`Grid: ${gridW}x${gridH} cells (${cells.size} filled), cell=${CELL}px, border=${BORDER}px`);
