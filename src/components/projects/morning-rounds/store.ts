import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey } from "./utils";

interface RoundsStore {
  /** The local date `played` belongs to. A different day means nothing is played yet. */
  day: string;
  played: string[];
  hidden: string[];
  markPlayed: (ids: string[]) => void;
  unmarkPlayed: (id: string) => void;
  resetToday: () => void;
  toggleHidden: (id: string) => void;
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
    }),
    {
      name: "morning-rounds",
      version: 3,
      // v1–2 let players add their own games; v3 replaced that with requests, so drop them.
      migrate: (persisted) => {
        const { customGames: _dropped, ...rest } = persisted as Record<string, unknown>;
        return rest as unknown as RoundsStore;
      },
    }
  )
);
