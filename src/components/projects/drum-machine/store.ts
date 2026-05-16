import { create } from "zustand";
import type { PatternState, TrackState, Subdivision } from "./types";
import { getDefaultPack } from "./drum-packs";

export const SUBDIVISIONS: Subdivision[] = [1, 2, 4];

const MAX_BARS = 16;
const MAX_BEATS_PER_BAR = 16;
const MIN_BARS = 1;
const MIN_BEATS_PER_BAR = 1;

export const LIMITS = {
  MAX_BARS,
  MAX_BEATS_PER_BAR,
  MIN_BARS,
  MIN_BEATS_PER_BAR,
  MIN_BPM: 40,
  MAX_BPM: 240,
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptySteps(length: number): boolean[] {
  return Array.from({ length }, () => false);
}

function makeTrack(sampleId: string, totalSteps: number): TrackState {
  return {
    id: uid(),
    sampleId,
    volume: 0.85,
    pan: 0,
    pitch: 0,
    mute: false,
    solo: false,
    steps: emptySteps(totalSteps),
  };
}

function defaultPattern(): PatternState {
  const bars = 4;
  const beatsPerBar = 4;
  const subdivision: Subdivision = 1;
  const totalSteps = bars * beatsPerBar * subdivision;
  const pack = getDefaultPack();

  // Pick reasonable defaults from the default pack — fall back to first 4 if categories aren't there.
  const pick = (category: string, fallbackIndex: number): string => {
    const found = pack.samples.find((s) => s.category === category);
    return found ? found.id : pack.samples[fallbackIndex]?.id ?? pack.samples[0].id;
  };

  const tracks: TrackState[] = [
    { ...makeTrack(pick("kick", 0), totalSteps) },
    { ...makeTrack(pick("snare", 1), totalSteps) },
    { ...makeTrack(pack.samples.find((s) => s.id.includes("hat-closed"))?.id ?? pick("hat", 2), totalSteps) },
    { ...makeTrack(pack.samples.find((s) => s.id.includes("hat-open"))?.id ?? pick("hat", 3), totalSteps) },
  ];

  // Light starter pattern so the user immediately sees something useful.
  // Kick on 1,9 (downbeats), snare on 5,13, closed hat every other step.
  const setIf = (track: TrackState, indexes: number[]) => {
    indexes.forEach((i) => {
      if (i < track.steps.length) track.steps[i] = true;
    });
  };
  setIf(tracks[0], [0, 8]);
  setIf(tracks[1], [4, 12]);
  setIf(tracks[2], [0, 2, 4, 6, 8, 10, 12, 14]);

  return {
    bars,
    beatsPerBar,
    subdivision,
    bpm: 110,
    swing: 0,
    masterVolume: 0.85,
    defaultPackSlug: pack.slug,
    tracks,
  };
}

interface DrumStore extends PatternState {
  isPlaying: boolean;
  currentStep: number;

  setBpm: (bpm: number) => void;
  setSwing: (swing: number) => void;
  setMasterVolume: (v: number) => void;
  setDefaultPack: (slug: string) => void;

  setBars: (bars: number) => void;
  setBeatsPerBar: (beats: number) => void;
  setSubdivision: (sub: Subdivision) => void;

  setIsPlaying: (playing: boolean) => void;
  setCurrentStep: (step: number) => void;

  addTrack: (sampleId: string) => void;
  removeTrack: (id: string) => void;
  reorderTracks: (from: number, to: number) => void;
  setTrackSample: (id: string, sampleId: string) => void;
  setTrackVolume: (id: string, volume: number) => void;
  setTrackPan: (id: string, pan: number) => void;
  setTrackPitch: (id: string, pitch: number) => void;
  toggleMute: (id: string) => void;
  toggleSolo: (id: string) => void;
  toggleStep: (trackId: string, stepIndex: number) => void;

  clearAll: () => void;
  loadPattern: (pattern: PatternState) => void;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function resizeSteps(steps: boolean[], target: number): boolean[] {
  if (steps.length === target) return steps;
  if (steps.length < target) {
    return [...steps, ...emptySteps(target - steps.length)];
  }
  return steps.slice(0, target);
}

// Rescale a steps array to preserve temporal positions when the subdivision changes.
// e.g. going 1× → 2× (steps double): on-step at index i moves to index i*2.
// Going 4× → 1× (steps quarter): on-step at index i is kept only if i % 4 === 0,
// mapped to i/4. Off-beat hits that don't fit are dropped.
function rescaleSteps(
  steps: boolean[],
  oldSub: number,
  newSub: number,
  newTotal: number
): boolean[] {
  if (oldSub === newSub) return steps;
  const out = emptySteps(newTotal);
  const ratio = newSub / oldSub;
  for (let i = 0; i < steps.length; i++) {
    if (!steps[i]) continue;
    const newIndex = i * ratio;
    if (Number.isInteger(newIndex) && newIndex < newTotal) {
      out[newIndex] = true;
    }
  }
  return out;
}

export const useDrumStore = create<DrumStore>((set) => ({
  ...defaultPattern(),
  isPlaying: false,
  currentStep: 0,

  setBpm: (bpm) =>
    set({ bpm: clamp(Math.round(bpm), LIMITS.MIN_BPM, LIMITS.MAX_BPM) }),

  setSwing: (swing) => set({ swing: clamp(swing, 0, 1) }),

  setMasterVolume: (masterVolume) =>
    set({ masterVolume: clamp(masterVolume, 0, 1) }),

  setDefaultPack: (defaultPackSlug) => set({ defaultPackSlug }),

  setBars: (bars) =>
    set((state) => {
      const newBars = clamp(Math.round(bars), LIMITS.MIN_BARS, LIMITS.MAX_BARS);
      const total = newBars * state.beatsPerBar * state.subdivision;
      return {
        bars: newBars,
        tracks: state.tracks.map((t) => ({
          ...t,
          steps: resizeSteps(t.steps, total),
        })),
        currentStep: 0,
      };
    }),

  setBeatsPerBar: (beats) =>
    set((state) => {
      const newBeats = clamp(
        Math.round(beats),
        LIMITS.MIN_BEATS_PER_BAR,
        LIMITS.MAX_BEATS_PER_BAR
      );
      const total = state.bars * newBeats * state.subdivision;
      return {
        beatsPerBar: newBeats,
        tracks: state.tracks.map((t) => ({
          ...t,
          steps: resizeSteps(t.steps, total),
        })),
        currentStep: 0,
      };
    }),

  setSubdivision: (sub) =>
    set((state) => {
      if (!SUBDIVISIONS.includes(sub) || sub === state.subdivision) return {};
      const total = state.bars * state.beatsPerBar * sub;
      return {
        subdivision: sub,
        tracks: state.tracks.map((t) => ({
          ...t,
          steps: rescaleSteps(t.steps, state.subdivision, sub, total),
        })),
        currentStep: 0,
      };
    }),

  setIsPlaying: (isPlaying) =>
    set((state) => ({
      isPlaying,
      currentStep: isPlaying ? state.currentStep : 0,
    })),

  setCurrentStep: (currentStep) => set({ currentStep }),

  addTrack: (sampleId) =>
    set((state) => ({
      tracks: [
        ...state.tracks,
        makeTrack(sampleId, state.bars * state.beatsPerBar * state.subdivision),
      ],
    })),

  removeTrack: (id) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== id),
    })),

  reorderTracks: (from, to) =>
    set((state) => {
      if (from === to || from < 0 || to < 0 || from >= state.tracks.length || to >= state.tracks.length) {
        return {};
      }
      const next = state.tracks.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { tracks: next };
    }),

  setTrackSample: (id, sampleId) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, sampleId } : t)),
    })),

  setTrackVolume: (id, volume) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === id ? { ...t, volume: clamp(volume, 0, 1) } : t
      ),
    })),

  setTrackPan: (id, pan) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === id ? { ...t, pan: clamp(pan, -1, 1) } : t
      ),
    })),

  setTrackPitch: (id, pitch) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === id ? { ...t, pitch: clamp(Math.round(pitch), -24, 24) } : t
      ),
    })),

  toggleMute: (id) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === id ? { ...t, mute: !t.mute } : t
      ),
    })),

  toggleSolo: (id) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === id ? { ...t, solo: !t.solo } : t
      ),
    })),

  toggleStep: (trackId, stepIndex) =>
    set((state) => ({
      tracks: state.tracks.map((t) => {
        if (t.id !== trackId) return t;
        if (stepIndex < 0 || stepIndex >= t.steps.length) return t;
        const next = t.steps.slice();
        next[stepIndex] = !next[stepIndex];
        return { ...t, steps: next };
      }),
    })),

  clearAll: () =>
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        steps: emptySteps(state.bars * state.beatsPerBar * state.subdivision),
      })),
      currentStep: 0,
    })),

  loadPattern: (pattern) =>
    set({
      ...pattern,
      isPlaying: false,
      currentStep: 0,
    }),
}));

export function getTotalSteps(state: {
  bars: number;
  beatsPerBar: number;
  subdivision: Subdivision;
}) {
  return state.bars * state.beatsPerBar * state.subdivision;
}
