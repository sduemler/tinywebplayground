import { useState, useEffect } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import type { EntryData, PuzzleMeta } from "./types";

// If neither data nor an error arrives within this window, assume the Firebase
// endpoints are being blocked (commonly by an ad blocker).
const CONNECT_TIMEOUT_MS = 8000;

export function useFirebaseData(puzzleId: string | null) {
  const [entries, setEntries] = useState<Map<string, EntryData>>(new Map());
  const [meta, setMeta] = useState<PuzzleMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!puzzleId) {
      setLoading(false);
      return;
    }

    let settled = false;
    const blockTimer = setTimeout(() => {
      if (!settled) {
        setBlocked(true);
        setLoading(false);
      }
    }, CONNECT_TIMEOUT_MS);

    const settle = () => {
      settled = true;
      clearTimeout(blockTimer);
    };

    const unsubMeta = onSnapshot(
      doc(db, "puzzles", puzzleId),
      (snap) => {
        settle();
        setBlocked(false);
        if (snap.exists()) {
          const d = snap.data();
          setMeta({
            gridWidth: d.gridWidth,
            gridHeight: d.gridHeight,
            solveCount: d.solveCount,
            totalEntries: d.totalEntries,
            isComplete: d.isComplete,
            startedAt: d.startedAt?.toDate() ?? null,
            completedAt: d.completedAt?.toDate() ?? null,
            centerRow: d.centerRow,
            centerCol: d.centerCol,
            pendingUnlock: d.pendingUnlock ?? [],
            openCount: d.openCount ?? 0,
            launchAt: d.launchAt?.toDate() ?? null,
          });
        }
      },
      (err) => {
        settle();
        setError(err.message);
      },
    );

    const unsubEntries = onSnapshot(
      collection(db, "puzzles", puzzleId, "entries"),
      (snap) => {
        settle();
        setBlocked(false);
        setEntries((prev) => {
          const next = new Map(prev);
          for (const change of snap.docChanges()) {
            if (change.type === "removed") {
              next.delete(change.doc.id);
            } else {
              const d = change.doc.data();
              next.set(change.doc.id, {
                id: change.doc.id,
                word: d.word,
                clue: d.clue,
                category: d.category,
                style: d.style ?? "crossword",
                media: d.media ?? undefined,
                direction: d.direction,
                row: d.row,
                col: d.col,
                length: d.length,
                unlocked: d.unlocked,
                unlockedAt: d.unlockedAt?.toDate() ?? null,
                solvedBy: d.solvedBy,
                solvedAt: d.solvedAt?.toDate() ?? null,
                solveSequence: d.solveSequence,
                wrongAttempts: d.wrongAttempts ?? 0,
                adjacentEntryIds: d.adjacentEntryIds,
              });
            }
          }
          return next;
        });
        setLoading(false);
      },
      (err) => {
        settle();
        setError(err.message);
        setLoading(false);
      },
    );

    return () => {
      clearTimeout(blockTimer);
      unsubMeta();
      unsubEntries();
    };
  }, [puzzleId]);

  return { entries, meta, loading, error, blocked };
}
