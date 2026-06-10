#!/usr/bin/env node

/**
 * Seeds Firestore with puzzle data from puzzle.json.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json
 *   node scripts/seed-firestore.mjs [puzzleId]
 *   node scripts/seed-firestore.mjs --reset [puzzleId]
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUZZLE_PATH = resolve(__dirname, "../src/data/the-crossword/puzzle.json");

const args = process.argv.slice(2);
const doReset = args.includes("--reset");

// Launch gate: `--launch-at <ISO datetime>`. When set, the client shows a
// countdown and solveClue rejects solves until it passes. Omitted ⇒ a far-future
// sentinel, so a freshly seeded puzzle is LOCKED ("coming soon") and flipping
// PUZZLE_ID can never make an undated puzzle accidentally live. Set the real
// date later with scripts/set-launch.mjs (no re-seed, preserves progress).
// (A null launchAt — e.g. legacy puzzle-001 — means "no gate / open".)
const LAUNCH_SENTINEL = new Date("2999-01-01T00:00:00Z");
const laIdx = args.indexOf("--launch-at");
const launchAtArg = laIdx !== -1 ? args[laIdx + 1] : null;
const launchAt = launchAtArg ? new Date(launchAtArg) : LAUNCH_SENTINEL;
if (launchAtArg && Number.isNaN(launchAt.getTime())) {
  console.error(`Invalid --launch-at value: "${launchAtArg}" (use an ISO datetime, e.g. 2026-07-01T17:00:00-04:00)`);
  process.exit(1);
}

// First non-flag arg that isn't the --launch-at value.
const puzzleId =
  args.find((a, i) => !a.startsWith("--") && i !== laIdx + 1) || "puzzle-002";

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error("Set GOOGLE_APPLICATION_CREDENTIALS to your service account key JSON");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(credPath, "utf-8"))) });
const db = getFirestore();

const puzzle = JSON.parse(readFileSync(PUZZLE_PATH, "utf-8"));
console.log(`Seeding puzzle "${puzzleId}" with ${puzzle.entries.length} entries...`);

const BATCH_SIZE = 500;

async function deleteCollection(path) {
  const col = db.collection(path);
  let total = 0;
  while (true) {
    const snap = await col.limit(BATCH_SIZE).get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    await batch.commit();
    total += snap.size;
  }
  return total;
}

async function reset() {
  console.log(`Resetting puzzle "${puzzleId}"...\n`);

  let n = await deleteCollection(`puzzles/${puzzleId}/solveHistory`);
  console.log(`  Deleted ${n} solveHistory docs`);

  n = await deleteCollection(`puzzles/${puzzleId}/entries`);
  console.log(`  Deleted ${n} entry docs`);

  // nicknames/ and players/ are global (keyed by uid), not per-puzzle —
  // a puzzle reset must not wipe them.

  const metaRef = db.doc(`puzzles/${puzzleId}`);
  if ((await metaRef.get()).exists) {
    await metaRef.delete();
    console.log("  Deleted puzzle meta doc");
  }

  console.log("\nReset complete.\n");
}

async function seed() {
  // Write puzzle meta
  await db.doc(`puzzles/${puzzleId}`).set({
    gridWidth: puzzle.gridWidth,
    gridHeight: puzzle.gridHeight,
    centerRow: puzzle.centerRow,
    centerCol: puzzle.centerCol,
    solveCount: 0,
    totalEntries: puzzle.totalEntries,
    isComplete: false,
    startedAt: new Date(),
    completedAt: null,
    pendingUnlock: [],
    openCount: 1,
    launchAt,
  });
  console.log(
    `  Meta document written (launchAt: ${launchAt.toISOString()}${launchAtArg ? "" : " — sentinel; locked until you run 'npm run set-launch'"})`,
  );

  // Write entries in batches
  let batchCount = 0;
  let batch = db.batch();
  let inBatch = 0;

  for (const entry of puzzle.entries) {
    const ref = db.doc(`puzzles/${puzzleId}/entries/${entry.id}`);
    const isStart = entry.id === puzzle.startEntryId;
    batch.set(ref, {
      word: entry.word,
      clue: entry.clue,
      category: entry.category ?? "Uncategorized",
      style: entry.style ?? "crossword",
      ...(entry.media ? { media: entry.media } : {}),
      direction: entry.direction,
      row: entry.row,
      col: entry.col,
      length: entry.length,
      unlocked: isStart,
      unlockedAt: isStart ? new Date() : null,
      solvedBy: null,
      solvedAt: null,
      solveSequence: null,
      wrongAttempts: 0,
      adjacentEntryIds: entry.adjacentEntryIds,
    });
    inBatch++;

    if (inBatch >= BATCH_SIZE) {
      await batch.commit();
      batchCount++;
      console.log(`  Entry batch ${batchCount} committed (${batchCount * BATCH_SIZE} entries)`);
      batch = db.batch();
      inBatch = 0;
    }
  }
  if (inBatch > 0) {
    await batch.commit();
    batchCount++;
    console.log(`  Final entry batch committed (${puzzle.entries.length} total)`);
  }

  console.log(`\nDone! Puzzle "${puzzleId}" seeded with:`);
  console.log(`  ${puzzle.entries.length} entries`);
  console.log(`  Start entry: ${puzzle.startEntryId}`);
}

async function run() {
  if (doReset) await reset();
  await seed();
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
