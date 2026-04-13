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
