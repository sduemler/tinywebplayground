/**
 * One-time script to update Firestore after trimming puzzle.json to 350 entries.
 *
 * What it does:
 * 1. Reads the list of removed entry IDs
 * 2. Counts how many of those were already solved (to adjust solveCount)
 * 3. Updates the puzzle meta doc: totalEntries=350, adjusted solveCount
 * 4. Locks (sets unlocked=false) any removed entries that were unlocked but unsolved
 *    so they don't appear if someone has them cached
 *
 * Run from project root:
 *   npx tsx scripts/trim-puzzle-firestore.ts
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS or firebase-admin default credentials
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import removedIds from "../src/data/the-crossword/removed-entry-ids.json";

const PUZZLE_ID = "puzzle-001";

async function main() {
  initializeApp();
  const db = getFirestore();

  const metaRef = db.doc(`puzzles/${PUZZLE_ID}`);
  const metaSnap = await metaRef.get();
  if (!metaSnap.exists) {
    console.error("Puzzle meta doc not found");
    process.exit(1);
  }

  const meta = metaSnap.data()!;
  console.log(`Current totalEntries: ${meta.totalEntries}, solveCount: ${meta.solveCount}`);

  // Check which removed entries were already solved
  let solvedInRemoved = 0;
  const batchSize = 50;
  for (let i = 0; i < removedIds.length; i += batchSize) {
    const chunk = removedIds.slice(i, i + batchSize);
    const snaps = await Promise.all(
      chunk.map((id) => db.doc(`puzzles/${PUZZLE_ID}/entries/${id}`).get())
    );
    for (const snap of snaps) {
      if (snap.exists && snap.data()!.solvedBy) {
        solvedInRemoved++;
        console.log(`  Solved entry being removed: ${snap.id} (solved by ${snap.data()!.solvedBy})`);
      }
    }
  }

  const newSolveCount = Math.max(0, (meta.solveCount || 0) - solvedInRemoved);
  const isComplete = newSolveCount >= 350;

  console.log(`\nRemoved entries that were solved: ${solvedInRemoved}`);
  console.log(`New solveCount: ${newSolveCount}`);
  console.log(`New totalEntries: 350`);
  console.log(`isComplete: ${isComplete}`);

  // Confirm before proceeding
  console.log("\nUpdating Firestore...");

  await metaRef.update({
    totalEntries: 350,
    solveCount: newSolveCount,
    isComplete,
  });
  console.log("Updated puzzle meta doc.");

  // Lock removed entries that are unlocked (so they don't show up)
  let locked = 0;
  for (let i = 0; i < removedIds.length; i += batchSize) {
    const chunk = removedIds.slice(i, i + batchSize);
    const batch = db.batch();
    const snaps = await Promise.all(
      chunk.map((id) => db.doc(`puzzles/${PUZZLE_ID}/entries/${id}`).get())
    );
    for (const snap of snaps) {
      if (snap.exists && snap.data()!.unlocked) {
        batch.update(snap.ref, { unlocked: false });
        locked++;
      }
    }
    await batch.commit();
  }
  console.log(`Locked ${locked} removed entries that were unlocked.`);

  console.log("\nDone! Puzzle is now 350 entries.");
}

main().catch(console.error);
