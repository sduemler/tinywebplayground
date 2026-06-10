#!/usr/bin/env node

/**
 * Crossword layout engine.
 * Takes clues.json (array of {word, clue}) and produces puzzle.json
 * with grid positions, adjacency graph, and the starting entry ID.
 *
 * Rules enforced:
 * - Min word length: 3 letters
 * - Every white cell must belong to both an across AND a down entry
 * - All white cells must be connected (single component)
 * - No duplicate words
 * - No touching: adjacent filled cells must be part of the same word
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = resolve(__dirname, "../src/data/the-crossword/clues.json");
const MEDIA_INPUT = resolve(
  __dirname,
  "../src/data/the-crossword/media-clues.json",
);
const OUTPUT = resolve(__dirname, "../src/data/the-crossword/puzzle.json");

const rawClues = JSON.parse(readFileSync(INPUT, "utf-8"));
let mediaClues = [];
if (existsSync(MEDIA_INPUT)) {
  mediaClues = JSON.parse(readFileSync(MEDIA_INPUT, "utf-8"));
}
// Normalize: every clue carries category + style; media is optional.
const clues = [...rawClues, ...mediaClues].map((c) => ({
  ...c,
  category: c.category ?? "Uncategorized",
  style: c.style ?? "crossword",
}));
console.log(
  `Loaded ${rawClues.length} clues + ${mediaClues.length} media = ${clues.length} total`,
);

// ---------------------------------------------------------------------------
// Shape masks
// ---------------------------------------------------------------------------
// The grid grows around the origin (0,0), which becomes the center. A shape
// mask is a predicate inShape(row, col) over those origin-centered coords; any
// candidate word with a cell outside the mask is rejected in canPlace(). With
// no mask the puzzle forms a diamond (a side effect of the L1 center-bias in
// scorePlacement). Pass --shape <name> to fill a silhouette instead.
const shapeArg =
  (process.argv.find((a) => a.startsWith("--shape=")) || "").split("=")[1] ||
  (process.argv.includes("--shape")
    ? process.argv[process.argv.indexOf("--shape") + 1]
    : "") ||
  "diamond";

function sign(px, py, ax, ay, bx, by) {
  return (px - bx) * (ay - by) - (ax - bx) * (py - by);
}
function inTriangle(px, py, a, b, c) {
  const d1 = sign(px, py, a.x, a.y, b.x, b.y);
  const d2 = sign(px, py, b.x, b.y, c.x, c.y);
  const d3 = sign(px, py, c.x, c.y, a.x, a.y);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

// Cat head: rounded head ellipse + two triangular ears, with two elliptical
// eye holes punched out of the upper face. x = col (right), y = row (down),
// so "up" is negative y. Sized so ~2500 words fill it edge-to-edge.
function makeCatMask() {
  const A = 106; // head half-width
  const B = 93; // head half-height
  // Eyes (holes in the face)
  const eyeCx = 0.4 * A;
  const eyeCy = -0.02 * B;
  const eyeRx = 0.17 * A;
  const eyeRy = 0.15 * B;
  // Ears (triangles sitting on top of the head)
  const leftEar = [
    { x: -0.18 * A, y: -0.78 * B }, // inner base, near top-center
    { x: -0.82 * A, y: -0.48 * B }, // outer base, on the head's upper-left
    { x: -0.6 * A, y: -1.62 * B }, // apex, up high
  ];
  const rightEar = leftEar.map((p) => ({ x: -p.x, y: p.y }));

  return function inCat(row, col) {
    const x = col;
    const y = row;
    // Eye holes win over everything (carve them out of the face).
    for (const cx of [-eyeCx, eyeCx]) {
      const dx = (x - cx) / eyeRx;
      const dy = (y - eyeCy) / eyeRy;
      if (dx * dx + dy * dy <= 1) return false;
    }
    // Head ellipse
    if ((x / A) ** 2 + (y / B) ** 2 <= 1) return true;
    // Ears
    if (inTriangle(x, y, leftEar[0], leftEar[1], leftEar[2])) return true;
    if (inTriangle(x, y, rightEar[0], rightEar[1], rightEar[2])) return true;
    return false;
  };
}

const SHAPE_MASK = shapeArg === "cat" ? makeCatMask() : null;
console.log(`Shape: ${shapeArg}${SHAPE_MASK ? " (masked)" : ""}`);

// Grid is stored as a Map<string, { letter, entries }> keyed by "row,col"
const grid = new Map();
const entries = []; // placed entries
let entryCounter = 0;

function cellKey(r, c) {
  return `${r},${c}`;
}

function getCell(r, c) {
  return grid.get(cellKey(r, c)) || null;
}

function setCell(r, c, letter, entryId, direction) {
  const key = cellKey(r, c);
  const existing = grid.get(key);
  if (existing) {
    if (direction === "across") existing.acrossId = entryId;
    else existing.downId = entryId;
  } else {
    grid.set(key, {
      letter,
      acrossId: direction === "across" ? entryId : null,
      downId: direction === "down" ? entryId : null,
    });
  }
}

function cellsForWord(row, col, word, direction) {
  const cells = [];
  for (let i = 0; i < word.length; i++) {
    const r = direction === "down" ? row + i : row;
    const c = direction === "across" ? col + i : col;
    cells.push({ r, c, letter: word[i] });
  }
  return cells;
}

function canPlace(row, col, word, direction) {
  const cells = cellsForWord(row, col, word, direction);
  const perpDir = direction === "across" ? "down" : "across";
  let intersections = 0;

  // Reject any placement that pokes outside the target silhouette.
  if (SHAPE_MASK) {
    for (const { r, c } of cells) {
      if (!SHAPE_MASK(r, c)) return null;
    }
  }

  for (let i = 0; i < cells.length; i++) {
    const { r, c, letter } = cells[i];
    const existing = getCell(r, c);

    if (existing) {
      if (existing.letter !== letter) return null;
      // Cell already occupied by same-direction entry
      if (direction === "across" && existing.acrossId) return null;
      if (direction === "down" && existing.downId) return null;
      intersections++;
    } else {
      // No filled cell may touch a new cell unless they share a word.
      // For across: no filled cell above or below. For down: no filled cell left or right.
      if (direction === "across") {
        if (getCell(r - 1, c)) return null;
        if (getCell(r + 1, c)) return null;
      } else {
        if (getCell(r, c - 1)) return null;
        if (getCell(r, c + 1)) return null;
      }
    }
  }

  // Must intersect at least one existing word (except for the very first word)
  if (entries.length > 0 && intersections === 0) return null;

  // Check cell before and after the word are empty (no extending existing words)
  const beforeR = direction === "down" ? row - 1 : row;
  const beforeC = direction === "across" ? col - 1 : col;
  const afterR = direction === "down" ? row + word.length : row;
  const afterC = direction === "across" ? col + word.length : col;

  if (getCell(beforeR, beforeC)) return null;
  if (getCell(afterR, afterC)) return null;

  return intersections;
}

function placeWord(row, col, clueObj, direction) {
  const { word } = clueObj;
  const id = `${++entryCounter}${direction === "across" ? "A" : "D"}`;
  const cells = cellsForWord(row, col, word, direction);
  for (const { r, c, letter } of cells) {
    setCell(r, c, letter, id, direction);
  }
  entries.push({ ...clueObj, id, direction, row, col, length: word.length });
  return id;
}

function findPlacements(word) {
  const placements = [];

  for (const [key, cell] of grid) {
    const [r, c] = key.split(",").map(Number);

    for (let i = 0; i < word.length; i++) {
      if (word[i] !== cell.letter) continue;

      // Try across: word[i] at (r, c) means word starts at (r, c - i)
      const acrossStart = c - i;
      const score = canPlace(r, acrossStart, word, "across");
      if (score !== null) {
        placements.push({
          row: r,
          col: acrossStart,
          direction: "across",
          intersections: score,
        });
      }

      // Try down: word[i] at (r, c) means word starts at (r - i, c)
      const downStart = r - i;
      const scoreD = canPlace(downStart, c, word, "down");
      if (scoreD !== null) {
        placements.push({
          row: downStart,
          col: c,
          direction: "down",
          intersections: scoreD,
        });
      }
    }
  }

  return placements;
}

function scorePlacement(p) {
  // Prefer more intersections, then closer to center
  const dist = Math.abs(p.row) + Math.abs(p.col);
  return p.intersections * 1000 - dist;
}

// Sort words: longest first, with some shuffling within same-length groups
const sorted = [...clues].filter((c) => c.word.length >= 3);
sorted.sort((a, b) => b.word.length - a.word.length);

// Place first word horizontally at origin
const first = sorted.shift();
placeWord(0, -Math.floor(first.word.length / 2), first, "across");
console.log(`Placed #1: ${first.word} (${first.word.length} chars) at center`);

const failed = [];
let placedCount = 1;

for (const clue of sorted) {
  const placements = findPlacements(clue.word);
  if (placements.length === 0) {
    failed.push(clue);
    continue;
  }

  placements.sort((a, b) => scorePlacement(b) - scorePlacement(a));
  const best = placements[0];
  placeWord(best.row, best.col, clue, best.direction);
  placedCount++;

  if (placedCount % 100 === 0) {
    console.log(`Placed ${placedCount}/${clues.length} (${failed.length} deferred)`);
  }
}

// Retry failed words up to 3 passes
for (let pass = 0; pass < 3 && failed.length > 0; pass++) {
  console.log(`\nRetry pass ${pass + 1}: ${failed.length} words to retry`);
  const retrying = [...failed];
  failed.length = 0;

  for (const clue of retrying) {
    const placements = findPlacements(clue.word);
    if (placements.length === 0) {
      failed.push(clue);
      continue;
    }
    placements.sort((a, b) => scorePlacement(b) - scorePlacement(a));
    const best = placements[0];
    placeWord(best.row, best.col, clue, best.direction);
    placedCount++;
  }
  console.log(`  Placed ${placedCount} total, ${failed.length} still failed`);
}

if (failed.length > 0) {
  console.log(`\nWARNING: ${failed.length} words could not be placed:`);
  for (const f of failed.slice(0, 20)) {
    console.log(`  ${f.word}`);
  }
  if (failed.length > 20) console.log(`  ... and ${failed.length - 20} more`);
}

// Normalize coordinates (shift so top-left is 0,0)
let minRow = Infinity,
  minCol = Infinity,
  maxRow = -Infinity,
  maxCol = -Infinity;
for (const [key] of grid) {
  const [r, c] = key.split(",").map(Number);
  minRow = Math.min(minRow, r);
  minCol = Math.min(minCol, c);
  maxRow = Math.max(maxRow, r);
  maxCol = Math.max(maxCol, c);
}

for (const entry of entries) {
  entry.row -= minRow;
  entry.col -= minCol;
}

const gridWidth = maxCol - minCol + 1;
const gridHeight = maxRow - minRow + 1;
const centerRow = Math.floor(gridHeight / 2);
const centerCol = Math.floor(gridWidth / 2);

// Compute adjacency: two entries are adjacent if they share at least one cell
console.log("\nComputing adjacency graph...");
const cellToEntries = new Map();
for (const entry of entries) {
  const cells = cellsForWord(
    entry.row + minRow,
    entry.col + minCol,
    entry.word,
    entry.direction,
  );
  for (const { r, c } of cells) {
    const nR = r - minRow;
    const nC = c - minCol;
    const key = `${nR},${nC}`;
    if (!cellToEntries.has(key)) cellToEntries.set(key, []);
    cellToEntries.get(key).push(entry.id);
  }
}

const adjacency = new Map();
for (const entry of entries) {
  adjacency.set(entry.id, new Set());
}
for (const [, entryIds] of cellToEntries) {
  if (entryIds.length > 1) {
    for (let i = 0; i < entryIds.length; i++) {
      for (let j = i + 1; j < entryIds.length; j++) {
        adjacency.get(entryIds[i]).add(entryIds[j]);
        adjacency.get(entryIds[j]).add(entryIds[i]);
      }
    }
  }
}

// Find starting entry (closest to center)
let startEntryId = entries[0].id;
let minDist = Infinity;
for (const entry of entries) {
  const midR = entry.row + (entry.direction === "down" ? entry.length / 2 : 0);
  const midC = entry.col + (entry.direction === "across" ? entry.length / 2 : 0);
  const dist = Math.hypot(midR - centerRow, midC - centerCol);
  if (dist < minDist) {
    minDist = dist;
    startEntryId = entry.id;
  }
}

// Validate connectivity
console.log("Validating connectivity...");
const visited = new Set();
const queue = [entries[0].id];
visited.add(entries[0].id);
while (queue.length > 0) {
  const current = queue.shift();
  for (const neighbor of adjacency.get(current) || []) {
    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }
}
const disconnected = entries.filter((e) => !visited.has(e.id));
if (disconnected.length > 0) {
  console.log(`WARNING: ${disconnected.length} entries are disconnected from the main component`);
} else {
  console.log("All entries are connected.");
}

// Check for unchecked cells (cells belonging to only one direction)
let uncheckedCount = 0;
const normalizedGrid = new Map();
for (const [key, cell] of grid) {
  const [r, c] = key.split(",").map(Number);
  const nKey = `${r - minRow},${c - minCol}`;
  normalizedGrid.set(nKey, cell);
  if (!cell.acrossId || !cell.downId) {
    uncheckedCount++;
  }
}
console.log(
  `Unchecked cells (only one direction): ${uncheckedCount} / ${grid.size} (${((uncheckedCount / grid.size) * 100).toFixed(1)}%)`,
);

// Build output
const output = {
  gridWidth,
  gridHeight,
  centerRow,
  centerCol,
  startEntryId,
  totalEntries: entries.length,
  entries: entries.map((e) => ({
    id: e.id,
    word: e.word,
    clue: e.clue,
    category: e.category,
    style: e.style,
    ...(e.media ? { media: e.media } : {}),
    direction: e.direction,
    row: e.row,
    col: e.col,
    length: e.length,
    adjacentEntryIds: [...(adjacency.get(e.id) || [])],
  })),
};

writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
console.log(`\n=== SUMMARY ===`);
console.log(`Grid: ${gridWidth} x ${gridHeight}`);
console.log(`Entries placed: ${entries.length} / ${clues.length}`);
console.log(`Failed: ${failed.length}`);
console.log(`Start entry: ${startEntryId}`);
console.log(`Output: ${OUTPUT}`);
