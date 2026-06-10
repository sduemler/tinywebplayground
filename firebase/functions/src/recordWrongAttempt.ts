import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) initializeApp();
const db = getFirestore();

interface WrongRequest {
  puzzleId: string;
  entryId: string;
}

// Server-side backstop; the client also enforces a 3s cooldown per wrong answer.
const RATE_LIMIT_MS = 2000;

export const recordWrongAttempt = onCall(
  { invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in");
    }

    const { puzzleId, entryId } = request.data as WrongRequest;
    if (!puzzleId || !entryId) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    const uid = request.auth.uid;
    const entryRef = db.doc(`puzzles/${puzzleId}/entries/${entryId}`);
    const playerRef = db.doc(`players/${uid}`);

    return db.runTransaction(async (tx) => {
      const [entrySnap, playerSnap] = await Promise.all([
        tx.get(entryRef),
        tx.get(playerRef),
      ]);

      if (!entrySnap.exists) {
        throw new HttpsError("not-found", "Entry not found");
      }
      const entry = entrySnap.data()!;
      // Only count wrong guesses against a real, in-play clue.
      if (!entry.unlocked || entry.solvedBy) {
        return { ok: false };
      }

      const lastWrong = playerSnap.exists
        ? playerSnap.data()!.lastWrongAt?.toDate?.()
        : null;
      if (lastWrong && Date.now() - lastWrong.getTime() < RATE_LIMIT_MS) {
        return { ok: false };
      }

      tx.update(entryRef, { wrongAttempts: FieldValue.increment(1) });
      tx.set(
        playerRef,
        {
          totalWrongAttempts: FieldValue.increment(1),
          lastWrongAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return { ok: true };
    });
  },
);
