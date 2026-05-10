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

    if (!entry.unlocked) {
      throw new HttpsError("failed-precondition", "Clue not unlocked");
    }
    if (entry.solvedBy) {
      throw new HttpsError("already-exists", "Already solved");
    }

    if (answer.trim().toUpperCase() !== entry.word) {
      return { correct: false };
    }

    const adjacentIds: string[] = entry.adjacentEntryIds || [];
    const adjacentSnaps = await Promise.all(
      adjacentIds.map((id: string) =>
        tx.get(db.doc(`puzzles/${puzzleId}/entries/${id}`)),
      ),
    );

    const lockedAdjacent = adjacentSnaps
      .filter((s) => s.exists && !s.data()!.unlocked)
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

    const toUnlock = lockedAdjacent.slice(0, 2);
    const unlockedIds = toUnlock.map((s) => s.id);

    const nick = nickSnap.exists ? nickSnap.data()! : null;
    const displayName = nick?.displayName ?? "Anonymous";
    const newSolveCount = (meta.solveCount || 0) + 1;

    tx.update(entryRef, {
      solvedBy: displayName,
      solvedAt: FieldValue.serverTimestamp(),
      solveSequence: newSolveCount,
    });

    for (let i = 0; i < entry.length; i++) {
      const r = entry.direction === "down" ? entry.row + i : entry.row;
      const c = entry.direction === "across" ? entry.col + i : entry.col;
      tx.update(db.doc(`puzzles/${puzzleId}/cells/${r}_${c}`), {
        locked: true,
      });
    }

    for (const snap of toUnlock) {
      tx.update(snap.ref, { unlocked: true });
    }

    const isComplete = newSolveCount >= meta.totalEntries;
    tx.update(metaRef, {
      solveCount: newSolveCount,
      isComplete,
      ...(isComplete
        ? { completedAt: FieldValue.serverTimestamp() }
        : {}),
    });

    tx.create(
      db.collection(`puzzles/${puzzleId}/solveHistory`).doc(),
      {
        entryId,
        solverName: displayName,
        solverUid: uid,
        timestamp: FieldValue.serverTimestamp(),
        solveSequence: newSolveCount,
        unlockedEntryIds: unlockedIds,
      },
    );

    return {
      correct: true,
      solveSequence: newSolveCount,
      unlockedEntryIds: unlockedIds,
    };
  });
});
