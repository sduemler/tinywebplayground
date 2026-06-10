import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) initializeApp();
const db = getFirestore();

interface SolveRequest {
  puzzleId: string;
  entryId: string;
  answer: string;
}

// Entries unlocked per solve when fresh locked neighbors exist.
const UNLOCKS_PER_SOLVE = 2;

export const solveClue = onCall({ invoker: "public" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { puzzleId, entryId, answer } = request.data as SolveRequest;
  if (!puzzleId || !entryId || !answer) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }

  const uid = request.auth.uid;

  return db.runTransaction(async (tx) => {
    const entryRef = db.doc(`puzzles/${puzzleId}/entries/${entryId}`);
    const metaRef = db.doc(`puzzles/${puzzleId}`);
    const nickRef = db.doc(`nicknames/${uid}`);

    const [entrySnap, metaSnap, nickSnap] = await Promise.all([
      tx.get(entryRef),
      tx.get(metaRef),
      tx.get(nickRef),
    ]);

    if (!entrySnap.exists || !metaSnap.exists) {
      throw new HttpsError("not-found", "Puzzle or entry not found");
    }

    const entry = entrySnap.data()!;
    const meta = metaSnap.data()!;

    // Launch gate: reject solves until the puzzle's launchAt has passed. A null/
    // missing launchAt (e.g. puzzle-001) means no gate. Enforced server-side so
    // it can't be bypassed from the client.
    if (meta.launchAt && meta.launchAt.toMillis() > Date.now()) {
      throw new HttpsError("failed-precondition", "Puzzle has not launched yet");
    }

    if (!entry.unlocked) {
      throw new HttpsError("failed-precondition", "Clue not unlocked");
    }
    if (entry.solvedBy) {
      throw new HttpsError("already-exists", "Already solved");
    }

    if (answer.trim().toUpperCase() !== entry.word) {
      return { correct: false };
    }

    // --- reads: the solved entry's adjacent entries ---
    const adjacentIds: string[] = entry.adjacentEntryIds || [];
    const adjacentSnaps = await Promise.all(
      adjacentIds.map((id: string) =>
        tx.get(db.doc(`puzzles/${puzzleId}/entries/${id}`)),
      ),
    );
    // --- all reads complete; writes below ---

    // Deferred-unlock queue. `pendingUnlock` holds entry IDs that have
    // overflowed past UNLOCKS_PER_SOLVE; invariant: a queued entry is always
    // locked + unsolved (direct unlocks never pick a queued entry).
    const pendingUnlock: string[] = [...(meta.pendingUnlock || [])];
    const queued = new Set(pendingUnlock);

    // Fresh locked neighbors: locked, and not already sitting in the queue.
    const freshLocked = adjacentSnaps
      .filter((s) => s.exists && !s.data()!.unlocked && !queued.has(s.id))
      .sort((a, b) => {
        const ad = a.data()!;
        const bd = b.data()!;
        const aDist = Math.hypot(
          ad.row - meta.centerRow,
          ad.col - meta.centerCol,
        );
        const bDist = Math.hypot(
          bd.row - meta.centerRow,
          bd.col - meta.centerCol,
        );
        return aDist - bDist;
      });

    const toUnlock: string[] = [];

    if (freshLocked.length > 0) {
      // Productive solve: unlock up to N closest neighbors, queue the rest.
      for (const s of freshLocked.slice(0, UNLOCKS_PER_SOLVE)) {
        toUnlock.push(s.id);
      }
      for (const s of freshLocked.slice(UNLOCKS_PER_SOLVE)) {
        pendingUnlock.push(s.id);
      }
    } else {
      // Dead solve (no fresh neighbors): drain the backlog instead.
      for (let i = 0; i < UNLOCKS_PER_SOLVE && pendingUnlock.length > 0; i++) {
        toUnlock.push(pendingUnlock.shift()!);
      }
    }

    const newSolveCount = (meta.solveCount || 0) + 1;
    const unsolvedRemaining = meta.totalEntries - newSolveCount;
    // The solved entry was open; each unlocked entry becomes open.
    let newOpenCount = (meta.openCount || 0) - 1 + toUnlock.length;

    // Guard: keep >=2 clues open until only the final clue remains, so a lone
    // mid-grid clue never looks like the puzzle is about to finish.
    while (
      newOpenCount < 2 &&
      unsolvedRemaining > 1 &&
      pendingUnlock.length > 0
    ) {
      toUnlock.push(pendingUnlock.shift()!);
      newOpenCount++;
    }

    const nick = nickSnap.exists ? nickSnap.data()! : null;
    const displayName = nick?.displayName ?? "Anonymous";

    tx.update(entryRef, {
      solvedBy: displayName,
      solvedAt: FieldValue.serverTimestamp(),
      solveSequence: newSolveCount,
    });

    for (const id of toUnlock) {
      tx.update(db.doc(`puzzles/${puzzleId}/entries/${id}`), {
        unlocked: true,
        unlockedAt: FieldValue.serverTimestamp(),
      });
    }

    const isComplete = newSolveCount >= meta.totalEntries;
    tx.update(metaRef, {
      solveCount: newSolveCount,
      openCount: newOpenCount,
      pendingUnlock,
      isComplete,
      ...(isComplete
        ? { completedAt: FieldValue.serverTimestamp() }
        : {}),
    });

    tx.create(db.collection(`puzzles/${puzzleId}/solveHistory`).doc(), {
      entryId,
      solverName: displayName,
      solverUid: uid,
      timestamp: FieldValue.serverTimestamp(),
      solveSequence: newSolveCount,
      unlockedEntryIds: toUnlock,
    });

    return {
      correct: true,
      solveSequence: newSolveCount,
      unlockedEntryIds: toUnlock,
    };
  });
});
