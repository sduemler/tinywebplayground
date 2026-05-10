export interface Animation {
  type: "wrong" | "unlock" | "solve";
  row: number;
  col: number;
  startTime: number;
  duration: number;
  delay: number;
}

const WRONG_DURATION = 3000;
const UNLOCK_DURATION = 600;
const SOLVE_DURATION = 700;

export function createWrongAnimation(row: number, col: number): Animation {
  return { type: "wrong", row, col, startTime: Date.now(), duration: WRONG_DURATION, delay: 0 };
}

export function createUnlockAnimation(row: number, col: number): Animation {
  return { type: "unlock", row, col, startTime: Date.now(), duration: UNLOCK_DURATION, delay: 0 };
}

export function createSolveAnimation(row: number, col: number, delay: number): Animation {
  return { type: "solve", row, col, startTime: Date.now(), duration: SOLVE_DURATION, delay };
}

export function getAnimationProgress(anim: Animation): number {
  const elapsed = Date.now() - anim.startTime - anim.delay;
  if (elapsed < 0) return 0;
  return Math.min(1, elapsed / anim.duration);
}

export function isAnimationActive(anim: Animation): boolean {
  return Date.now() - anim.startTime >= anim.delay;
}

export function isAnimationDone(anim: Animation): boolean {
  return Date.now() - anim.startTime >= anim.duration + anim.delay;
}

export function springEase(t: number): number {
  return 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 0.5);
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function solveBounce(t: number): number {
  if (t < 0.4) {
    return 1 + 0.3 * Math.sin((t / 0.4) * Math.PI);
  }
  return 1;
}
