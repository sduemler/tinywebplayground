import { create } from "zustand";
import type { WaveType, LfoTarget } from "./types";

interface SynthStore {
  waveType: WaveType;
  isPlaying: boolean;
  volume: number;
  frequency: number;
  filterCutoff: number;
  filterResonance: number;
  fxTime: number;
  fxFeedback: number;
  fxReverbSize: number;
  fxMix: number;
  lfo1Target: LfoTarget;
  lfo1Rate: number;
  lfo1Depth: number;
  lfo2Target: LfoTarget;
  lfo2Rate: number;
  lfo2Depth: number;
  lfo3Target: LfoTarget;
  lfo3Rate: number;
  lfo3Depth: number;
  lfo4Target: LfoTarget;
  lfo4Rate: number;
  lfo4Depth: number;
  triggerMode: boolean;
  envAttack: number;
  envDecay: number;
  envSustain: number;
  envRelease: number;
  octave: number;
  setWaveType: (type: WaveType) => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setFrequency: (frequency: number) => void;
  setFilterCutoff: (hz: number) => void;
  setFilterResonance: (q: number) => void;
  setFxTime: (seconds: number) => void;
  setFxFeedback: (value: number) => void;
  setFxReverbSize: (value: number) => void;
  setFxMix: (value: number) => void;
  setLfo1Target: (target: LfoTarget) => void;
  setLfo1Rate: (hz: number) => void;
  setLfo1Depth: (value: number) => void;
  setLfo2Target: (target: LfoTarget) => void;
  setLfo2Rate: (hz: number) => void;
  setLfo2Depth: (value: number) => void;
  setLfo3Target: (target: LfoTarget) => void;
  setLfo3Rate: (hz: number) => void;
  setLfo3Depth: (value: number) => void;
  setLfo4Target: (target: LfoTarget) => void;
  setLfo4Rate: (hz: number) => void;
  setLfo4Depth: (value: number) => void;
  setTriggerMode: (on: boolean) => void;
  setEnvAttack: (seconds: number) => void;
  setEnvDecay: (seconds: number) => void;
  setEnvSustain: (value: number) => void;
  setEnvRelease: (seconds: number) => void;
  setOctave: (octave: number) => void;
}

export const useSynthStore = create<SynthStore>((set) => ({
  waveType: "flat",
  isPlaying: false,
  volume: 0.25,
  frequency: 220,
  filterCutoff: 20000,
  filterResonance: 1,
  fxTime: 0.25,
  fxFeedback: 0.35,
  fxReverbSize: 0.7,
  fxMix: 0,
  lfo1Target: "none",
  lfo1Rate: 2,
  lfo1Depth: 0,
  lfo2Target: "none",
  lfo2Rate: 4,
  lfo2Depth: 0,
  lfo3Target: "none",
  lfo3Rate: 1,
  lfo3Depth: 0,
  lfo4Target: "none",
  lfo4Rate: 8,
  lfo4Depth: 0,
  triggerMode: false,
  envAttack: 0.01,
  envDecay: 0.15,
  envSustain: 0.7,
  envRelease: 0.4,
  octave: 4,
  setWaveType: (waveType) => set({ waveType }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setFrequency: (frequency) => set({ frequency }),
  setFilterCutoff: (filterCutoff) => set({ filterCutoff }),
  setFilterResonance: (filterResonance) => set({ filterResonance }),
  setFxTime: (fxTime) => set({ fxTime }),
  setFxFeedback: (fxFeedback) => set({ fxFeedback }),
  setFxReverbSize: (fxReverbSize) => set({ fxReverbSize }),
  setFxMix: (fxMix) => set({ fxMix }),
  setLfo1Target: (lfo1Target) => set({ lfo1Target }),
  setLfo1Rate: (lfo1Rate) => set({ lfo1Rate }),
  setLfo1Depth: (lfo1Depth) => set({ lfo1Depth }),
  setLfo2Target: (lfo2Target) => set({ lfo2Target }),
  setLfo2Rate: (lfo2Rate) => set({ lfo2Rate }),
  setLfo2Depth: (lfo2Depth) => set({ lfo2Depth }),
  setLfo3Target: (lfo3Target) => set({ lfo3Target }),
  setLfo3Rate: (lfo3Rate) => set({ lfo3Rate }),
  setLfo3Depth: (lfo3Depth) => set({ lfo3Depth }),
  setLfo4Target: (lfo4Target) => set({ lfo4Target }),
  setLfo4Rate: (lfo4Rate) => set({ lfo4Rate }),
  setLfo4Depth: (lfo4Depth) => set({ lfo4Depth }),
  setTriggerMode: (triggerMode) => set({ triggerMode }),
  setEnvAttack: (envAttack) => set({ envAttack }),
  setEnvDecay: (envDecay) => set({ envDecay }),
  setEnvSustain: (envSustain) => set({ envSustain }),
  setEnvRelease: (envRelease) => set({ envRelease }),
  setOctave: (octave) => set({ octave }),
}));
