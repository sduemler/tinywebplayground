import { create } from "zustand";
import type { WaveType, LfoTarget, NoiseType, SeqStep } from "./types";

const DEFAULT_SEQ_STEPS: SeqStep[] = Array.from({ length: 16 }, () => ({
  note: "A",
  octave: 4,
  on: true,
}));

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
  oscLevel: number;
  noiseLevel: number;
  noiseType: NoiseType;
  crushDrive: number;
  crushBits: number;
  crushMix: number;
  seqPlaying: boolean;
  seqBpm: number;
  seqLoopLength: 8 | 16;
  seqGate: number;
  seqSteps: SeqStep[];
  seqCurrentStep: number;
  randPlaying: boolean;
  randHzMin: number;
  randHzMax: number;
  randRateMsMin: number;
  randRateMsMax: number;
  randGateMs: number;
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
  setOscLevel: (value: number) => void;
  setNoiseLevel: (value: number) => void;
  setNoiseType: (type: NoiseType) => void;
  setCrushDrive: (value: number) => void;
  setCrushBits: (value: number) => void;
  setCrushMix: (value: number) => void;
  setSeqPlaying: (playing: boolean) => void;
  setSeqBpm: (bpm: number) => void;
  setSeqLoopLength: (length: 8 | 16) => void;
  setSeqGate: (value: number) => void;
  setSeqSteps: (steps: SeqStep[]) => void;
  setSeqStep: (index: number, partial: Partial<SeqStep>) => void;
  setSeqCurrentStep: (index: number) => void;
  setRandPlaying: (playing: boolean) => void;
  setRandHzMin: (hz: number) => void;
  setRandHzMax: (hz: number) => void;
  setRandRateMsMin: (ms: number) => void;
  setRandRateMsMax: (ms: number) => void;
  setRandGateMs: (ms: number) => void;
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
  oscLevel: 1,
  noiseLevel: 0,
  noiseType: "white",
  crushDrive: 0,
  crushBits: 16,
  crushMix: 0,
  seqPlaying: false,
  seqBpm: 120,
  seqLoopLength: 16,
  seqGate: 0.5,
  seqSteps: DEFAULT_SEQ_STEPS,
  seqCurrentStep: -1,
  randPlaying: false,
  randHzMin: 110,
  randHzMax: 880,
  randRateMsMin: 150,
  randRateMsMax: 600,
  randGateMs: 120,
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
  setOscLevel: (oscLevel) => set({ oscLevel }),
  setNoiseLevel: (noiseLevel) => set({ noiseLevel }),
  setNoiseType: (noiseType) => set({ noiseType }),
  setCrushDrive: (crushDrive) => set({ crushDrive }),
  setCrushBits: (crushBits) => set({ crushBits }),
  setCrushMix: (crushMix) => set({ crushMix }),
  setSeqPlaying: (seqPlaying) => set({ seqPlaying }),
  setSeqBpm: (seqBpm) => set({ seqBpm }),
  setSeqLoopLength: (seqLoopLength) => set({ seqLoopLength }),
  setSeqGate: (seqGate) => set({ seqGate }),
  setSeqSteps: (seqSteps) => set({ seqSteps }),
  setSeqStep: (index, partial) =>
    set((state) => {
      const next = state.seqSteps.slice();
      next[index] = { ...next[index], ...partial };
      return { seqSteps: next };
    }),
  setSeqCurrentStep: (seqCurrentStep) => set({ seqCurrentStep }),
  setRandPlaying: (randPlaying) => set({ randPlaying }),
  setRandHzMin: (randHzMin) => set({ randHzMin }),
  setRandHzMax: (randHzMax) => set({ randHzMax }),
  setRandRateMsMin: (randRateMsMin) => set({ randRateMsMin }),
  setRandRateMsMax: (randRateMsMax) => set({ randRateMsMax }),
  setRandGateMs: (randGateMs) => set({ randGateMs }),
}));
