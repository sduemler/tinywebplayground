import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CrosswordStore {
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  selectedEntryId: string | null;
  setSelectedEntry: (id: string | null) => void;
  nickname: string | null;
  setNickname: (n: string | null) => void;
  hasSeenNicknamePrompt: boolean;
  markNicknamePromptSeen: () => void;
  cooldownUntil: number | null;
  setCooldown: (until: number) => void;
  clearCooldown: () => void;
}

export const useCrosswordStore = create<CrosswordStore>()(
  persist(
    (set) => ({
      view: "grid",
      setView: (v) => set({ view: v }),
      selectedEntryId: null,
      setSelectedEntry: (id) => set({ selectedEntryId: id }),
      nickname: null,
      setNickname: (n) => set({ nickname: n }),
      hasSeenNicknamePrompt: false,
      markNicknamePromptSeen: () => set({ hasSeenNicknamePrompt: true }),
      cooldownUntil: null,
      setCooldown: (until) => set({ cooldownUntil: until }),
      clearCooldown: () => set({ cooldownUntil: null }),
    }),
    { name: "the-crossword" },
  ),
);
