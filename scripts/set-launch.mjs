#!/usr/bin/env node

/**
 * Sets the launch time on a puzzle's meta doc WITHOUT re-seeding (so solve
 * progress is preserved). Drives the client countdown + the solveClue gate.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json
 *   node scripts/set-launch.mjs <puzzleId> <when>
 *
 *   <when> is one of:
 *     an ISO datetime   e.g. 2026-07-01T17:00:00-04:00  → countdown to that time
 *     soon              → far-future sentinel ("coming soon", stays locked)
 *     open              → null (removes the gate; opens the puzzle immediately)
 *
 * Examples:
 *   node scripts/set-launch.mjs puzzle-002 2026-07-01T17:00:00-04:00
 *   node scripts/set-launch.mjs puzzle-002 open
 */

import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const LAUNCH_SENTINEL = new Date("2999-01-01T00:00:00Z");

const [puzzleId, when] = process.argv.slice(2);
if (!puzzleId || !when) {
  console.error(
    "Usage: node scripts/set-launch.mjs <puzzleId> <ISO datetime | soon | open>",
  );
  process.exit(1);
}

let launchAt;
if (when === "open") {
  launchAt = null;
} else if (when === "soon") {
  launchAt = LAUNCH_SENTINEL;
} else {
  launchAt = new Date(when);
  if (Number.isNaN(launchAt.getTime())) {
    console.error(`Invalid datetime: "${when}" (use ISO, e.g. 2026-07-01T17:00:00-04:00)`);
    process.exit(1);
  }
}

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error("Set GOOGLE_APPLICATION_CREDENTIALS to your service account key JSON");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(credPath, "utf-8"))) });
const db = getFirestore();

const metaRef = db.doc(`puzzles/${puzzleId}`);
const snap = await metaRef.get();
if (!snap.exists) {
  console.error(`Puzzle "${puzzleId}" not found — seed it first.`);
  process.exit(1);
}

await metaRef.update({ launchAt });
const desc =
  launchAt === null
    ? "null (gate removed — puzzle is OPEN now)"
    : launchAt.getTime() === LAUNCH_SENTINEL.getTime()
      ? `${launchAt.toISOString()} (sentinel — "coming soon", locked)`
      : launchAt.toISOString();
console.log(`Set puzzles/${puzzleId}.launchAt = ${desc}`);
