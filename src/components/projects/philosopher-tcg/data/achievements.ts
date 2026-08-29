import type { PhilosopherCard, SchoolKey } from "../types";
import { PHILOSOPHERS } from "./cards";
import { FACTIONS } from "./factions";

export type AchievementKind = "completionist" | "luck";

/** Snapshot handed to every achievement check.
 *  - `owned` / `packsOpened` reflect state AFTER the pull is recorded.
 *  - `prevOwned` is the ownership map BEFORE the pull (for "new card" checks).
 *  - `pack` is the trio just opened; empty `[]` when re-evaluating standing
 *    without a pull (so luck checks, which require pack contents, stay locked). */
export interface AchievementCtx {
  owned: Record<string, number>;
  prevOwned: Record<string, number>;
  packsOpened: number;
  pack: PhilosopherCard[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  kind: AchievementKind;
  check: (ctx: AchievementCtx) => boolean;
  /** Optional running progress toward the goal (completionist achievements). */
  progress?: (ctx: AchievementCtx) => { value: number; target: number };
}

const ownedCount = (owned: Record<string, number>, ids: string[]) =>
  ids.filter((id) => (owned[id] || 0) > 0).length;

const SCHOOL_ACH_NAME: Record<SchoolKey, string> = {
  ancients: "Cradle of Thought",
  eastern: "Eastern Wisdom",
  shifters: "Paradigm Shift",
  enlightenment: "Age of Reason",
  modern: "The Modern Turn",
};

const idsBySchool = (school: SchoolKey) =>
  PHILOSOPHERS.filter((c) => c.school === school).map((c) => c.id);

const ownsAll = (owned: Record<string, number>, ids: string[]) =>
  ids.every((id) => (owned[id] || 0) > 0);

const packAllShare = <K extends keyof PhilosopherCard>(
  pack: PhilosopherCard[],
  key: K,
) => pack.length > 0 && pack.every((c) => c[key] === pack[0][key]);

export const ACHIEVEMENTS: Achievement[] = [
  // ── Completionist (10) ─────────────────────────────────────────────
  ...FACTIONS.map(
    (f): Achievement => ({
      id: `school-${f.key}`,
      name: SCHOOL_ACH_NAME[f.key],
      description: `Unlock every philosopher in ${f.label}.`,
      kind: "completionist",
      check: (c) => ownsAll(c.owned, idsBySchool(f.key)),
      progress: (c) => {
        const ids = idsBySchool(f.key);
        return { value: ownedCount(c.owned, ids), target: ids.length };
      },
    }),
  ),
  {
    id: "complete-set",
    name: "First Principles",
    description: "Collect all 50 philosophers.",
    kind: "completionist",
    check: (c) => PHILOSOPHERS.every((p) => (c.owned[p.id] || 0) > 0),
    progress: (c) => ({
      value: ownedCount(
        c.owned,
        PHILOSOPHERS.map((p) => p.id),
      ),
      target: PHILOSOPHERS.length,
    }),
  },
  {
    id: "copies-10",
    name: "Devout Following",
    description: "Own 10 copies of a single philosopher.",
    kind: "completionist",
    check: (c) => Object.values(c.owned).some((n) => n >= 10),
    progress: (c) => ({
      value: Math.min(10, Math.max(0, ...Object.values(c.owned), 0)),
      target: 10,
    }),
  },
  {
    id: "packs-10",
    name: "Apprentice",
    description: "Open 10 booster packs.",
    kind: "completionist",
    check: (c) => c.packsOpened >= 10,
    progress: (c) => ({ value: Math.min(c.packsOpened, 10), target: 10 }),
  },
  {
    id: "packs-50",
    name: "Scholar",
    description: "Open 50 booster packs.",
    kind: "completionist",
    check: (c) => c.packsOpened >= 50,
    progress: (c) => ({ value: Math.min(c.packsOpened, 50), target: 50 }),
  },
  {
    id: "packs-100",
    name: "Archivist",
    description: "Open 100 booster packs.",
    kind: "completionist",
    check: (c) => c.packsOpened >= 100,
    progress: (c) => ({ value: Math.min(c.packsOpened, 100), target: 100 }),
  },

  // ── Luck (10) ──────────────────────────────────────────────────────
  {
    id: "cliquey",
    name: "Cliquey",
    description: "Open a pack where all three cards share a school.",
    kind: "luck",
    check: (c) => packAllShare(c.pack, "school"),
  },
  {
    id: "symmetry",
    name: "Symmetry",
    description: "Open a pack where all three cards share a rarity.",
    kind: "luck",
    check: (c) => packAllShare(c.pack, "rarity"),
  },
  {
    id: "touched-by-genius",
    name: "Touched by Genius",
    description: "Pull a legendary philosopher.",
    kind: "luck",
    check: (c) => c.pack.some((p) => p.rarity === "legendary"),
  },
  {
    id: "dialectic-of-giants",
    name: "Dialectic of Giants",
    description: "Pull two legendaries from a single pack.",
    kind: "luck",
    check: (c) => c.pack.filter((p) => p.rarity === "legendary").length >= 2,
  },
  {
    id: "inner-circle",
    name: "Inner Circle",
    description: "Open a pack where every card is rare or better.",
    kind: "luck",
    check: (c) =>
      c.pack.length > 0 &&
      c.pack.every((p) => p.rarity === "rare" || p.rarity === "legendary"),
  },
  {
    id: "philosopher-king",
    name: "Philosopher-King",
    description: "Pull a philosopher with 99 Influence.",
    kind: "luck",
    check: (c) => c.pack.some((p) => p.influence >= 99),
  },
  {
    id: "fresh-faces",
    name: "Fresh Faces",
    description: "Open a pack of three cards all new to your collection.",
    kind: "luck",
    check: (c) =>
      c.pack.length === 3 && c.pack.every((p) => (c.prevOwned[p.id] || 0) === 0),
  },
  {
    id: "deja-vu",
    name: "Déjà Vu",
    description: "Open a pack where you already owned every card.",
    kind: "luck",
    check: (c) =>
      c.pack.length === 3 && c.pack.every((p) => (c.prevOwned[p.id] || 0) > 0),
  },
  {
    id: "back-to-the-drawing-board",
    name: "Back to the Drawing Board",
    description: "Open a pack of three commons.",
    kind: "luck",
    check: (c) =>
      c.pack.length === 3 && c.pack.every((p) => p.rarity === "common"),
  },
  {
    id: "eclectic",
    name: "Eclectic",
    description: "Open a pack with three different rarities.",
    kind: "luck",
    check: (c) =>
      c.pack.length === 3 && new Set(c.pack.map((p) => p.rarity)).size === 3,
  },
];

export const ACHIEVEMENT_BY_ID: Record<string, Achievement> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);

/** Unlock any achievements newly satisfied by `ctx`, given what's already
 *  unlocked. Returns the merged map plus the list of ids unlocked this call. */
export function evaluateAchievements(
  ctx: AchievementCtx,
  unlocked: Record<string, number>,
): { unlocked: Record<string, number>; newly: string[] } {
  const next = { ...unlocked };
  const newly: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!next[a.id] && a.check(ctx)) {
      next[a.id] = Date.now();
      newly.push(a.id);
    }
  }
  return { unlocked: next, newly };
}
