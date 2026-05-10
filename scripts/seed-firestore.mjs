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
const puzzleId = args.find((a) => !a.startsWith("--")) || "puzzle-001";

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

  n = await deleteCollection(`puzzles/${puzzleId}/cells`);
  console.log(`  Deleted ${n} cell docs`);

  n = await deleteCollection("nicknames");
  console.log(`  Deleted ${n} nickname docs`);

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
  });
  console.log("  Meta document written");

  // Write entries in batches
  let batchCount = 0;
  let batch = db.batch();
  let inBatch = 0;

  for (const entry of puzzle.entries) {
    const ref = db.doc(`puzzles/${puzzleId}/entries/${entry.id}`);
    batch.set(ref, {
      word: entry.word,
      clue: entry.clue,
      direction: entry.direction,
      row: entry.row,
      col: entry.col,
      length: entry.length,
      unlocked: entry.id === puzzle.startEntryId,
      solvedBy: null,
      solvedAt: null,
      solveSequence: null,
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

  // Write cells in batches
  batch = db.batch();
  inBatch = 0;
  batchCount = 0;
  let cellCount = 0;

  for (const entry of puzzle.entries) {
    for (let i = 0; i < entry.length; i++) {
      const r = entry.direction === "down" ? entry.row + i : entry.row;
      const c = entry.direction === "across" ? entry.col + i : entry.col;
      const cellId = `${r}_${c}`;
      const ref = db.doc(`puzzles/${puzzleId}/cells/${cellId}`);

      batch.set(
        ref,
        {
          letter: entry.word[i],
          locked: false,
          ...(entry.direction === "across"
            ? { acrossEntryId: entry.id }
            : { downEntryId: entry.id }),
        },
        { merge: true },
      );
      inBatch++;
      cellCount++;

      if (inBatch >= BATCH_SIZE) {
        await batch.commit();
        batchCount++;
        console.log(`  Cell batch ${batchCount} committed`);
        batch = db.batch();
        inBatch = 0;
      }
    }
  }
  if (inBatch > 0) {
    await batch.commit();
    console.log(`  Final cell batch committed (${cellCount} total cells)`);
  }

  console.log(`\nDone! Puzzle "${puzzleId}" seeded with:`);
  console.log(`  ${puzzle.entries.length} entries`);
  console.log(`  ${cellCount} cells`);
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
