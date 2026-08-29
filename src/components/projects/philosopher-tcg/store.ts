import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PHILOSOPHERS } from "./data/cards";
import { evaluateAchievements } from "./data/achievements";
import { ymd } from "./lib/daily";

const CARD_BY_ID: Record<string, (typeof PHILOSOPHERS)[number]> =
  Object.fromEntries(PHILOSOPHERS.map((c) => [c.id, c]));

interface TcgStore {
  /** cardId -> number owned */
  owned: Record<string, number>;
  packsOpened: number;
  /** achievementId -> unlock timestamp (ms) */
  achievements: Record<string, number>;
  /** achievement ids unlocked by the most recent pull (drives the toast) */
  newlyUnlocked: string[];

  // ── Daily pack gate (all values are "YYYY-MM-DD" local dates) ──
  /** day the daily free pack was last opened */
  lastFreePackDate: string | null;
  /** day the bonus question was last answered */
  bonusAnsweredDate: string | null;
  /** day the bonus pack was last opened */
  lastBonusPackDate: string | null;
  /** dev override — unlimited packs, bypasses the daily gate (not persisted) */
  devMode: boolean;

  recordPull: (ids: string[]) => void;
  markFreePackOpened: () => void;
  markBonusPackOpened: () => void;
  answerBonus: () => void;
  resetDaily: () => void;
  setDevMode: (on: boolean) => void;
  /** Credit any completionist achievements already satisfied by saved state. */
  syncAchievements: () => void;
  clearNewlyUnlocked: () => void;
  reset: () => void;
}

export const useTcgStore = create<TcgStore>()(
  persist(
    (set) => ({
      owned: {},
      packsOpened: 0,
      achievements: {},
      newlyUnlocked: [],
      lastFreePackDate: null,
      bonusAnsweredDate: null,
      lastBonusPackDate: null,
      devMode: false,
      recordPull: (ids) =>
        set((state) => {
          const prevOwned = state.owned;
          const owned = { ...prevOwned };
          for (const id of ids) {
            owned[id] = (owned[id] || 0) + 1;
          }
          const packsOpened = state.packsOpened + 1;
          const pack = ids
            .map((id) => CARD_BY_ID[id])
            .filter((c): c is (typeof PHILOSOPHERS)[number] => Boolean(c));
          const { unlocked, newly } = evaluateAchievements(
            { owned, prevOwned, packsOpened, pack },
            state.achievements,
          );
          return { owned, packsOpened, achievements: unlocked, newlyUnlocked: newly };
        }),
      markFreePackOpened: () => set({ lastFreePackDate: ymd() }),
      markBonusPackOpened: () => set({ lastBonusPackDate: ymd() }),
      answerBonus: () => set({ bonusAnsweredDate: ymd() }),
      resetDaily: () =>
        set({
          lastFreePackDate: null,
          bonusAnsweredDate: null,
          lastBonusPackDate: null,
        }),
      setDevMode: (on) => set({ devMode: on }),
      syncAchievements: () =>
        set((state) => {
          const { unlocked, newly } = evaluateAchievements(
            {
              owned: state.owned,
              prevOwned: state.owned,
              packsOpened: state.packsOpened,
              pack: [],
            },
            state.achievements,
          );
          return newly.length ? { achievements: unlocked } : {};
        }),
      clearNewlyUnlocked: () => set({ newlyUnlocked: [] }),
      reset: () =>
        set({
          owned: {},
          packsOpened: 0,
          achievements: {},
          newlyUnlocked: [],
          lastFreePackDate: null,
          bonusAnsweredDate: null,
          lastBonusPackDate: null,
        }),
    }),
    {
      name: "philosopher-tcg:v1",
      partialize: (state) => ({
        owned: state.owned,
        packsOpened: state.packsOpened,
        achievements: state.achievements,
        lastFreePackDate: state.lastFreePackDate,
        bonusAnsweredDate: state.bonusAnsweredDate,
        lastBonusPackDate: state.lastBonusPackDate,
      }),
    },
  ),
);
