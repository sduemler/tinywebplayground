import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Game } from "@data/morning-rounds/games";
import { monogramFor, todayKey } from "./utils";

interface RoundsStore {
  /** The local date `played` belongs to. A different day means nothing is played yet. */
  day: string;
  played: string[];
  hidden: string[];
  customGames: Game[];
  markPlayed: (ids: string[]) => void;
  unmarkPlayed: (id: string) => void;
  resetToday: () => void;
  toggleHidden: (id: string) => void;
  addCustom: (name: string, url: string) => void;
  removeCustom: (id: string) => void;
}

/** Today's played ids, dropping anything left over from an earlier day. */
const playedToday = (s: Pick<RoundsStore, "day" | "played">) =>
  s.day === todayKey() ? s.played : [];

export const useRoundsStore = create<RoundsStore>()(
  persist(
    (set) => ({
      day: todayKey(),
      played: [],
      hidden: [],
      customGames: [],
      markPlayed: (ids) =>
        set((s) => ({
          day: todayKey(),
          played: [...new Set([...playedToday(s), ...ids])],
        })),
      unmarkPlayed: (id) =>
        set((s) => ({ day: todayKey(), played: playedToday(s).filter((p) => p !== id) })),
      resetToday: () => set({ day: todayKey(), played: [] }),
      toggleHidden: (id) =>
        set((s) => ({
          hidden: s.hidden.includes(id) ? s.hidden.filter((h) => h !== id) : [...s.hidden, id],
        })),
      addCustom: (name, url) =>
        set((s) => ({
          customGames: [
            ...s.customGames,
            {
              id: `custom-${Date.now().toString(36)}`,
              name: name.trim(),
              url,
              tag: "Yours",
              blurb: "",
              monogram: monogramFor(name),
              custom: true,
            },
          ],
        })),
      removeCustom: (id) =>
        set((s) => ({
          customGames: s.customGames.filter((g) => g.id !== id),
          hidden: s.hidden.filter((h) => h !== id),
          played: s.played.filter((p) => p !== id),
        })),
    }),
    { name: "morning-rounds", version: 1 }
  )
);
