import { create } from "zustand";
import type { WaveType } from "./types";

interface SynthStore {
  waveType: WaveType;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  setWaveType: (type: WaveType) => void;
  setPlaying: (playing: boolean) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

export const useSynthStore = create<SynthStore>((set) => ({
  waveType: "flat",
  isPlaying: false,
  isMuted: false,
  volume: -12,
  setWaveType: (waveType) => set({ waveType }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setMuted: (isMuted) => set({ isMuted }),
  setVolume: (volume) => set({ volume }),
}));
