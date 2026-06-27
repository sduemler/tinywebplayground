import type { TypingSet } from "./types";

/** Net WPM: standard 5-characters-per-word over elapsed minutes. */
export function computeWpm(correctChars: number, ms: number): number {
  if (ms <= 0 || correctChars <= 0) return 0;
  const minutes = ms / 60000;
  return Math.round(correctChars / 5 / minutes);
}

/** Accuracy as a 0..100 percentage of correct keystrokes. */
export function computeAccuracy(correct: number, total: number): number {
  if (total <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((correct / total) * 100)));
}

/** Count characters typed into their correct position. */
export function countCorrect(typed: string, target: string): number {
  let n = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) n++;
  }
  return n;
}

/** Pick a random set, avoiding the previous one when possible. */
export function pickSet(sets: TypingSet[], previousId?: string): TypingSet {
  if (sets.length <= 1) return sets[0];
  let choice = sets[Math.floor(Math.random() * sets.length)];
  let guard = 0;
  while (choice.id === previousId && guard++ < 10) {
    choice = sets[Math.floor(Math.random() * sets.length)];
  }
  return choice;
}

/** Format seconds as a compact m:ss or s. */
export function formatTime(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}
