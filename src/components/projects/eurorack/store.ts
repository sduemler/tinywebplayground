import { create } from "zustand";
import type { WaveType } from "./types";

interface SynthStore {
  waveType: WaveType;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  frequency: number;
  filterCutoff: number;
  filterResonance: number;
  setWaveType: (type: WaveType) => void;
  setPlaying: (playing: boolean) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setFrequency: (frequency: number) => void;
  setFilterCutoff: (hz: number) => void;
  setFilterResonance: (q: number) => void;
}

export const useSynthStore = create<SynthStore>((set) => ({
  waveType: "flat",
  isPlaying: false,
  isMuted: false,
  volume: 0.25,
  frequency: 220,
  filterCutoff: 20000,
  filterResonance: 1,
  setWaveType: (waveType) => set({ waveType }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setMuted: (isMuted) => set({ isMuted }),
  setVolume: (volume) => set({ volume }),
  setFrequency: (frequency) => set({ frequency }),
  setFilterCutoff: (filterCutoff) => set({ filterCutoff }),
  setFilterResonance: (filterResonance) => set({ filterResonance }),
}));
