import { useMemo, useState } from "react";
import styles from "./CrosswordArchive.module.css";
import TimelapsePlayer from "./TimelapsePlayer";
import type { EntryData, SolveEvent, PuzzleJson } from "./types";
import archiveRaw from "@data/the-crossword/archive/puzzle-001.json";

interface ArchiveEntry {
  id: string;
  word: string;
  clue: string;
  direction: "across" | "down";
  row: number;
  col: number;
  length: number;
  solvedBy: string | null;
  solveSequence: number | null;
}

interface ArchiveHistory {
  entryId: string;
  solverName: string;
  solverUid: string;
  timestamp: string | null;
  solveSequence: number;
  unlockedEntryIds: string[];
}

interface PuzzleArchive {
  puzzleId: string;
  gridWidth: number;
  gridHeight: number;
  centerRow: number;
  centerCol: number;
  solveCount: number;
  totalEntries: number;
  startedAt: string | null;
  completedAt: string | null;
  entries: ArchiveEntry[];
  solveHistory: ArchiveHistory[];
}

const archive = archiveRaw as unknown as PuzzleArchive;

export default function CrosswordArchive() {
  const [playing, setPlaying] = useState(false);

  const entries = useMemo(() => {
    const map = new Map<string, EntryData>();
    for (const e of archive.entries) {
      map.set(e.id, {
        id: e.id,
        word: e.word,
        clue: e.clue,
        category: "",
        style: "crossword",
        direction: e.direction,
        row: e.row,
        col: e.col,
        length: e.length,
        unlocked: true,
        unlockedAt: null,
        solvedBy: e.solvedBy,
        solvedAt: null,
        solveSequence: e.solveSequence,
        wrongAttempts: 0,
        adjacentEntryIds: [],
      });
    }
    return map;
  }, []);

  const solveHistory = useMemo<SolveEvent[]>(
    () =>
      archive.solveHistory.map((h) => ({
        entryId: h.entryId,
        solverName: h.solverName,
        solverUid: h.solverUid,
        timestamp: h.timestamp ? new Date(h.timestamp) : new Date(),
        solveSequence: h.solveSequence,
        unlockedEntryIds: h.unlockedEntryIds,
      })),
    [],
  );

  const contributors = useMemo(() => {
    const names = new Set<string>();
    for (const e of archive.entries) {
      if (e.solvedBy) names.add(e.solvedBy);
    }
    return names.size;
  }, []);

  const puzzleData: PuzzleJson = {
    gridWidth: archive.gridWidth,
    gridHeight: archive.gridHeight,
    centerRow: archive.centerRow,
    centerCol: archive.centerCol,
    startEntryId: "",
    entries: [],
  };

  const completed = archive.completedAt
    ? new Date(archive.completedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  if (archive.solveHistory.length === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <h2 className={styles.title}>Puzzle 1</h2>
          <p className={styles.empty}>
            The Puzzle 1 archive hasn’t been generated yet — check back soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <h2 className={styles.title}>Puzzle 1</h2>
        {completed && <p className={styles.meta}>Completed {completed}</p>}
        <div className={styles.statRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{archive.solveCount}</span>
            <span className={styles.statLabel}>clues solved</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{contributors}</span>
            <span className={styles.statLabel}>contributors</span>
          </div>
        </div>
        <button className={styles.playBtn} onClick={() => setPlaying(true)}>
          ▶ Watch the timelapse
        </button>
      </div>

      {playing && (
        <TimelapsePlayer
          puzzleData={puzzleData}
          entries={entries}
          solveHistory={solveHistory}
          fullscreen
          onClose={() => setPlaying(false)}
        />
      )}
    </div>
  );
}
