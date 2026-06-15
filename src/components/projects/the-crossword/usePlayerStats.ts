import { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import type { EntryData, SolveEvent } from "./types";

export interface RankedName {
  name: string;
  count: number;
}

export interface WorldStats {
  // Deliberately NO total/remaining count — the puzzle size stays a mystery.
  solved: number;
  contributors: number;
  letters: number;
  acrossCount: number;
  downCount: number;
  totalWrongAttempts: number;
  accuracy: number | null;
  avgSolveMs: number | null;
  quickestSolveMs: number | null;
  longestSolveMs: number | null;
  firstResponderCount: number;
  topCategory: string | null;
  mostContestedClue: { clue: string; word: string; wrongAttempts: number } | null;
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
  world: WorldStats;
}

function rank(counts: Map<string, number>): RankedName[] {
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * Derives the current player's stats from already-loaded entries + solveHistory
 * (zero extra reads), plus a live subscription to puzzles/{puzzleId}/players/{uid}
 * for the server-tracked wrong-attempt total (per-puzzle, so it resets each
 * game). Mounting this hook = the stats modal is open, so the listener is scoped
 * to the modal's lifetime.
 */
export function usePlayerStats(
  puzzleId: string,
  uid: string | null,
  entries: Map<string, EntryData>,
  solveHistory: SolveEvent[],
  launchAt: Date | null,
): PlayerStatsView | null {
  const [wrongAttempts, setWrongAttempts] = useState(0);

  // A clue can't be solved before the puzzle launches, so "wait" time is
  // measured from the later of (clue unlocked, puzzle launched). Without this,
  // the start clue — unlocked at seed time, well before launch — reports a bogus
  // seed-to-solve wait that dominates the longest/avg numbers. Kept as a
  // primitive (ms) so the memo doesn't rerun on every meta snapshot's fresh Date.
  const launchMs = launchAt ? launchAt.getTime() : 0;

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      doc(db, "puzzles", puzzleId, "players", uid),
      (snap) => {
        setWrongAttempts(
          snap.exists() ? (snap.data().totalWrongAttempts ?? 0) : 0,
        );
      },
    );
    return unsub;
  }, [puzzleId, uid]);

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
        const startMs = Math.max(entry.unlockedAt.getTime(), launchMs);
        const ms = entry.solvedAt.getTime() - startMs;
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

    // --- World aggregates: the whole puzzle, derived from already-loaded
    // entries (no extra Firestore reads). Independent of the current player. ---
    let worldSolved = 0;
    let worldLetters = 0;
    let worldAcross = 0;
    let worldDown = 0;
    let worldWrong = 0;
    let worldFirstResponder = 0;
    const worldDurations: number[] = [];
    const worldCategoryCounts = new Map<string, number>();
    let mostContestedClue: WorldStats["mostContestedClue"] = null;
    for (const entry of entries.values()) {
      worldWrong += entry.wrongAttempts || 0;
      if (!entry.solvedBy) continue;
      worldSolved++;
      worldLetters += entry.length;
      if (entry.direction === "across") worldAcross++;
      else worldDown++;

      if (entry.solvedAt && entry.unlockedAt) {
        const startMs = Math.max(entry.unlockedAt.getTime(), launchMs);
        const ms = entry.solvedAt.getTime() - startMs;
        if (ms >= 0) {
          worldDurations.push(ms);
          if (ms < 60000) worldFirstResponder++;
        }
      }

      const cat = entry.category || "Uncategorized";
      worldCategoryCounts.set(cat, (worldCategoryCounts.get(cat) ?? 0) + 1);

      // Only solved clues are eligible so the revealed word can't spoil an
      // unsolved answer.
      if (
        entry.wrongAttempts > 0 &&
        (!mostContestedClue ||
          entry.wrongAttempts > mostContestedClue.wrongAttempts)
      ) {
        mostContestedClue = {
          clue: entry.clue,
          word: entry.word,
          wrongAttempts: entry.wrongAttempts,
        };
      }
    }

    let worldTopCategory: string | null = null;
    let worldTopCatCount = 0;
    for (const [cat, count] of worldCategoryCounts) {
      if (count > worldTopCatCount) {
        worldTopCatCount = count;
        worldTopCategory = cat;
      }
    }

    let contributors = new Set(solveHistory.map((e) => e.solverUid)).size;
    if (contributors === 0 && worldSolved > 0) {
      // Fallback if solveHistory hasn't loaded yet: distinct solver names.
      const names = new Set<string>();
      for (const entry of entries.values()) {
        if (entry.solvedBy) names.add(entry.solvedBy);
      }
      contributors = names.size;
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
      world: {
        solved: worldSolved,
        contributors,
        letters: worldLetters,
        acrossCount: worldAcross,
        downCount: worldDown,
        totalWrongAttempts: worldWrong,
        accuracy:
          worldSolved + worldWrong > 0
            ? worldSolved / (worldSolved + worldWrong)
            : null,
        avgSolveMs: worldDurations.length
          ? worldDurations.reduce((a, b) => a + b, 0) / worldDurations.length
          : null,
        quickestSolveMs: worldDurations.length
          ? Math.min(...worldDurations)
          : null,
        longestSolveMs: worldDurations.length
          ? Math.max(...worldDurations)
          : null,
        firstResponderCount: worldFirstResponder,
        topCategory: worldTopCategory,
        mostContestedClue,
      },
    };
  }, [uid, entries, solveHistory, wrongAttempts, launchMs]);
}
