#!/usr/bin/env node

/**
 * Exports a completed puzzle from Firestore to a static JSON archive, so its
 * timelapse stays viewable after the live puzzle is replaced by a new one.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json
 *   node scripts/export-puzzle.mjs [puzzleId]      # puzzleId defaults to puzzle-001
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const puzzleId = args.find((a) => !a.startsWith("--")) || "puzzle-001";

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error(
    "Set GOOGLE_APPLICATION_CREDENTIALS to your service account key JSON",
  );
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(credPath, "utf-8"))) });
const db = getFirestore();

const OUT_DIR = resolve(__dirname, "../src/data/the-crossword/archive");
const OUT_PATH = resolve(OUT_DIR, `${puzzleId}.json`);

function isoOrNull(ts) {
  return ts && typeof ts.toDate === "function"
    ? ts.toDate().toISOString()
    : null;
}

async function run() {
  console.log(`Exporting "${puzzleId}"...`);

  const metaSnap = await db.doc(`puzzles/${puzzleId}`).get();
  if (!metaSnap.exists) {
    console.error(`Puzzle "${puzzleId}" not found.`);
    process.exit(1);
  }
  const meta = metaSnap.data();

  const entriesSnap = await db.collection(`puzzles/${puzzleId}/entries`).get();
  const entries = entriesSnap.docs.map((d) => {
    const e = d.data();
    return {
      id: d.id,
      word: e.word,
      clue: e.clue,
      direction: e.direction,
      row: e.row,
      col: e.col,
      length: e.length,
      solvedBy: e.solvedBy ?? null,
      solveSequence: e.solveSequence ?? null,
    };
  });

  const historySnap = await db
    .collection(`puzzles/${puzzleId}/solveHistory`)
    .orderBy("solveSequence", "asc")
    .get();
  const solveHistory = historySnap.docs.map((d) => {
    const h = d.data();
    return {
      entryId: h.entryId,
      solverName: h.solverName,
      solverUid: h.solverUid,
      timestamp: isoOrNull(h.timestamp),
      solveSequence: h.solveSequence,
      unlockedEntryIds: h.unlockedEntryIds ?? [],
    };
  });

  const archive = {
    puzzleId,
    gridWidth: meta.gridWidth,
    gridHeight: meta.gridHeight,
    centerRow: meta.centerRow,
    centerCol: meta.centerCol,
    solveCount: meta.solveCount ?? 0,
    totalEntries: meta.totalEntries ?? entries.length,
    startedAt: isoOrNull(meta.startedAt),
    completedAt: isoOrNull(meta.completedAt),
    entries,
    solveHistory,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(archive, null, 2));
  console.log(
    `Wrote ${entries.length} entries + ${solveHistory.length} solve events`,
  );
  console.log(`Output: ${OUT_PATH}`);
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
