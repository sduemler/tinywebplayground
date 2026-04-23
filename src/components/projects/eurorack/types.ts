export type WaveType = "sine" | "square" | "sawtooth" | "flat";

export type LfoTarget =
  | "none"
  | "pitch"
  | "cutoff"
  | "reso"
  | "volume"
  | "mix";

export const LFO_TARGET_LABELS: Record<LfoTarget, string> = {
  none: "— off —",
  pitch: "Pitch",
  cutoff: "Cutoff",
  reso: "Reso",
  volume: "Volume",
  mix: "FX Mix",
};

export type NoiseType = "white" | "pink" | "brown";

export type SwirlMode = "chorus" | "phaser" | "vibrato";

export type RandomScale =
  | "off"
  | "major"
  | "minor"
  | "pentaMajor"
  | "pentaMinor";

export const RANDOM_SCALE_LABELS: Record<RandomScale, string> = {
  off: "Off",
  major: "Maj",
  minor: "Min",
  pentaMajor: "P5+",
  pentaMinor: "P5−",
};

export interface SeqStep {
  note: string;
  octave: number;
  on: boolean;
}
