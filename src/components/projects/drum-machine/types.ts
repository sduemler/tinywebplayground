export type SampleCategory =
  | "kick"
  | "snare"
  | "hat"
  | "cymbal"
  | "tom"
  | "perc"
  | "clap"
  | "fx"
  | "other";

export interface DrumSample {
  id: string;
  name: string;
  file: string;
  packSlug: string;
  category: SampleCategory;
}

export interface DrumPack {
  slug: string;
  name: string;
  description: string;
  samples: DrumSample[];
}

export interface TrackState {
  id: string;
  sampleId: string;
  volume: number;
  pan: number;
  pitch: number;
  mute: boolean;
  solo: boolean;
  steps: boolean[];
}

export type Subdivision = 1 | 2 | 4;

export interface PatternState {
  bars: number;
  beatsPerBar: number;
  subdivision: Subdivision;
  bpm: number;
  swing: number;
  masterVolume: number;
  defaultPackSlug: string;
  tracks: TrackState[];
}
