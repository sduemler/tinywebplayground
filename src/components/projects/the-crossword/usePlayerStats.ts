import { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import type { EntryData, SolveEvent } from "./types";

export interface RankedName {
  name: string;
  count: number;
}

export interface PlayerStatsView {
  totalSolves: number;
  totalLetters: number;
  acrossCount: number;
  downCount: number;
  firstSolveAt: Date | null;
  lastSolveAt: Date | null;
  avgSolveMs: number | null;
  quickestSolveMs: number | null;
  longestSolveMs: number | null;
  firstResponderCount: number;
  favoriteCategory: string | null;
  topUnlockPartners: RankedName[];
  handedOffTo: RankedName[];
  totalWrongAttempts: number;
  accuracy: number | null;
  hardestClue: { clue: string; word: string; wrongAttempts: number } | null;
}

function rank(counts: Map<string, number>): RankedName[] {
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * Derives the current player's stats from already-loaded entries + solveHistory
 * (zero extra reads), plus a live subscription to players/{uid} for the
 * server-tracked wrong-attempt total. Mounting this hook = the stats modal is
 * open, so the players/{uid} listener is scoped to the modal's lifetime.
 */
export function usePlayerStats(
  uid: string | null,
  entries: Map<string, EntryData>,
  solveHistory: SolveEvent[],
): PlayerStatsView | null {
  const [wrongAttempts, setWrongAttempts] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "players", uid), (snap) => {
      setWrongAttempts(
        snap.exists() ? (snap.data().totalWrongAttempts ?? 0) : 0,
      );
    });
    return unsub;
  }, [uid]);

  return useMemo(() => {
    if (!uid) return null;

    // One pass over solveHistory: who unlocked each entry, who solved each entry.
    const unlockedBy = new Map<string, { uid: string; name: string }>();
    const solvedBy = new Map<string, { uid: string; name: string }>();
    for (const ev of solveHistory) {
      solvedBy.set(ev.entryId, { uid: ev.solverUid, name: ev.solverName });
      for (const id of ev.unlockedEntryIds) {
        if (!unlockedBy.has(id)) {
          unlockedBy.set(id, { uid: ev.solverUid, name: ev.solverName });
        }
      }
    }

    const mySolves = solveHistory.filter((e) => e.solverUid === uid);

    let totalLetters = 0;
    let acrossCount = 0;
    let downCount = 0;
    const durations: number[] = [];
    let firstResponderCount = 0;
    const categoryCounts = new Map<string, number>();
    const partnerCounts = new Map<string, number>();
    const handoffCounts = new Map<string, number>();
    let hardestClue: PlayerStatsView["hardestClue"] = null;

    for (const ev of mySolves) {
      const entry = entries.get(ev.entryId);
      if (!entry) continue;

      totalLetters += entry.length;
      if (entry.direction === "across") acrossCount++;
      else downCount++;

      if (entry.solvedAt && entry.unlockedAt) {
        const ms = entry.solvedAt.getTime() - entry.unlockedAt.getTime();
        if (ms >= 0) {
          durations.push(ms);
          if (ms < 60000) firstResponderCount++;
        }
      }

      const cat = entry.category || "Uncategorized";
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);

      const partner = unlockedBy.get(ev.entryId);
      if (partner && partner.uid !== uid) {
        partnerCounts.set(
          partner.name,
          (partnerCounts.get(partner.name) ?? 0) + 1,
        );
      }

      for (const unlockedId of ev.unlockedEntryIds) {
        const solver = solvedBy.get(unlockedId);
        if (solver && solver.uid !== uid) {
          handoffCounts.set(
            solver.name,
            (handoffCounts.get(solver.name) ?? 0) + 1,
          );
        }
      }

      if (
        entry.wrongAttempts > 0 &&
        (!hardestClue || entry.wrongAttempts > hardestClue.wrongAttempts)
      ) {
        hardestClue = {
          clue: entry.clue,
          word: entry.word,
          wrongAttempts: entry.wrongAttempts,
        };
      }
    }

    let favoriteCategory: string | null = null;
    let favMax = 0;
    for (const [cat, count] of categoryCounts) {
      if (count > favMax) {
        favMax = count;
        favoriteCategory = cat;
      }
    }

    const timestamps = mySolves
      .map((e) => e.timestamp)
      .filter((t): t is Date => !!t)
      .sort((a, b) => a.getTime() - b.getTime());

    const totalSolves = mySolves.length;

    return {
      totalSolves,
      totalLetters,
      acrossCount,
      downCount,
      firstSolveAt: timestamps[0] ?? null,
      lastSolveAt: timestamps[timestamps.length - 1] ?? null,
      avgSolveMs: durations.length
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : null,
      quickestSolveMs: durations.length ? Math.min(...durations) : null,
      longestSolveMs: durations.length ? Math.max(...durations) : null,
      firstResponderCount,
      favoriteCategory,
      topUnlockPartners: rank(partnerCounts),
      handedOffTo: rank(handoffCounts),
      totalWrongAttempts: wrongAttempts,
      accuracy:
        totalSolves + wrongAttempts > 0
          ? totalSolves / (totalSolves + wrongAttempts)
          : null,
      hardestClue,
    };
  }, [uid, entries, solveHistory, wrongAttempts]);
}
