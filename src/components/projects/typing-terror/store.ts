import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TerrorStore {
  /** Best WPM achieved on passage 1, 2, and 3 (by position). */
  bestByPassage: number[];
  /** Fold a finished run's per-passage WPMs into the bests. */
  recordRun: (passageWpms: number[]) => void;
}

export const useTerrorStore = create<TerrorStore>()(
  persist(
    (set) => ({
      bestByPassage: [0, 0, 0],
      recordRun: (wpms) =>
        set((state) => ({
          bestByPassage: state.bestByPassage.map((b, i) =>
            Math.max(b, wpms[i] ?? 0)
          ),
        })),
    }),
    {
      name: "typing-terror-store",
      version: 2,
      // Schema changed from overall-best + recent-runs to per-passage bests.
      migrate: () => ({ bestByPassage: [0, 0, 0] }),
    }
  )
);
