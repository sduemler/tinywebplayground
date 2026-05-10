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
}

export interface EntryData {
  id: string;
  word: string;
  clue: string;
  category: string;
  direction: "across" | "down";
  row: number;
  col: number;
  length: number;
  unlocked: boolean;
  solvedBy: string | null;
  solvedAt: Date | null;
  solveSequence: number | null;
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
  direction: "across" | "down";
  row: number;
  col: number;
  length: number;
  adjacentEntryIds: string[];
}

export interface ClueInput {
  word: string;
  clue: string;
}
