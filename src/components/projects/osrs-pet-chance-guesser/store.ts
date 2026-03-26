import { create } from 'zustand';
import type { BossResult } from './types';

interface PetGuesserStore {
  results: Record<string, BossResult>;
  simulatingBossId: string | null;
  setResult: (bossId: string, killCount: number) => void;
  setSimulating: (bossId: string | null) => void;
  resetAll: () => void;
}

export const usePetGuesser = create<PetGuesserStore>((set) => ({
  results: {},
  simulatingBossId: null,
  setResult: (bossId, killCount) =>
    set((state) => ({
      results: { ...state.results, [bossId]: { bossId, killCount } },
      simulatingBossId: null,
    })),
  setSimulating: (bossId) => set({ simulatingBossId: bossId }),
  resetAll: () => set({ results: {}, simulatingBossId: null }),
}));
