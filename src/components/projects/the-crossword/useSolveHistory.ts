import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import type { SolveEvent } from "./types";

export function useSolveHistory(puzzleId: string | null) {
  const [history, setHistory] = useState<SolveEvent[]>([]);

  useEffect(() => {
    if (!puzzleId) return;

    const q = query(
      collection(db, "puzzles", puzzleId, "solveHistory"),
      orderBy("solveSequence", "asc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const events: SolveEvent[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          entryId: data.entryId,
          solverName: data.solverName,
          solverUid: data.solverUid,
          timestamp: data.timestamp?.toDate() ?? new Date(),
          solveSequence: data.solveSequence,
          unlockedEntryIds: data.unlockedEntryIds ?? [],
        };
      });
      setHistory(events);
    });

    return unsub;
  }, [puzzleId]);

  return history;
}
