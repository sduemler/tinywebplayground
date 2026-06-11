export type ClueStyle = "crossword" | "jeopardy";

export interface ClueMedia {
  type: "image" | "audio" | "video";
  src: string;
  alt?: string;
}

export interface PuzzleMeta {
  gridWidth: number;
  gridHeight: number;
  solveCount: number;
  totalEntries: number;
  isComplete: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
  centerRow: number;
  centerCol: number;
  pendingUnlock: string[];
  openCount: number;
  /** When the puzzle opens for solving. null ⇒ not yet scheduled (locked). */
  launchAt: Date | null;
}

export interface EntryData {
  id: string;
  word: string;
  clue: string;
  category: string;
  style: ClueStyle;
  media?: ClueMedia;
  direction: "across" | "down";
  row: number;
  col: number;
  length: number;
  unlocked: boolean;
  unlockedAt: Date | null;
  solvedBy: string | null;
  solvedAt: Date | null;
  solveSequence: number | null;
  wrongAttempts: number;
  adjacentEntryIds: string[];
}

export interface CellData {
  letter: string;
  locked: boolean;
  acrossEntryId: string | null;
  downEntryId: string | null;
}

export interface SolveEvent {
  entryId: string;
  solverName: string;
  solverUid: string;
  timestamp: Date;
  solveSequence: number;
  unlockedEntryIds: string[];
}

export interface NicknameData {
  name: string;
  suffix: number;
  displayName: string;
  approved: boolean;
  createdAt: Date;
}

export interface PuzzleJson {
  gridWidth: number;
  gridHeight: number;
  centerRow: number;
  centerCol: number;
  startEntryId: string;
  entries: PuzzleEntry[];
}

export interface PuzzleEntry {
  id: string;
  word: string;
  clue: string;
  category: string;
  style: ClueStyle;
  media?: ClueMedia;
  direction: "across" | "down";
  row: number;
  col: number;
  length: number;
  adjacentEntryIds: string[];
}

/** A clue as authored / generated, before layout. */
export interface ClueInput {
  word: string;
  clue: string;
  category: string;
  style: ClueStyle;
  media?: ClueMedia;
}

/** Hand-authored media clue, merged into the pool before layout. */
export interface MediaClue extends ClueInput {
  media: ClueMedia;
}

/** The puzzles/{puzzleId}/players/{uid} doc. Only server-tracked wrong-attempt
 *  stats live here (per-puzzle, resets each game); all solve-derived stats are
 *  computed client-side from solveHistory. */
export interface PlayerDoc {
  totalWrongAttempts: number;
  lastWrongAt: Date | null;
}
