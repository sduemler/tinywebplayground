import { useState, useEffect } from "react";
import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { EntryData, PuzzleMeta } from "./types";

export function useFirebaseData(puzzleId: string | null) {
  const [entries, setEntries] = useState<Map<string, EntryData>>(new Map());
  const [meta, setMeta] = useState<PuzzleMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!puzzleId) {
      setLoading(false);
      return;
    }

    const unsubMeta = onSnapshot(
      doc(db, "puzzles", puzzleId),
      (snap) => {
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
          });
        }
      },
      (err) => setError(err.message),
    );

    const unsubEntries = onSnapshot(
      collection(db, "puzzles", puzzleId, "entries"),
      (snap) => {
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
                direction: d.direction,
                row: d.row,
                col: d.col,
                length: d.length,
                unlocked: d.unlocked,
                solvedBy: d.solvedBy,
                solvedAt: d.solvedAt?.toDate() ?? null,
                solveSequence: d.solveSequence,
                adjacentEntryIds: d.adjacentEntryIds,
              });
            }
          }
          return next;
        });
        setLoading(false);
      },
      (err) => setError(err.message),
    );

    return () => {
      unsubMeta();
      unsubEntries();
    };
  }, [puzzleId]);

  return { entries, meta, loading, error };
}
