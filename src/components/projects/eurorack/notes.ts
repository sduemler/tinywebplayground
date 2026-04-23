export const NOTE_SEMITONES: Record<string, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

export function noteToHz(noteName: string, octave: number): number {
  const semis = NOTE_SEMITONES[noteName];
  const midi = (octave + 1) * 12 + semis;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export const NOTE_NAMES: readonly string[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export const SCALE_INTERVALS: Record<string, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentaMajor: [0, 2, 4, 7, 9],
  pentaMinor: [0, 3, 5, 7, 10],
};

export function snapHzToScale(
  hz: number,
  hzMin: number,
  hzMax: number,
  rootSemitone: number,
  intervals: readonly number[],
): number {
  const toMidi = (f: number): number => 69 + 12 * Math.log2(f / 440);
  const midiF = toMidi(hz);
  const midiLo = toMidi(Math.max(1, hzMin));
  const midiHi = toMidi(Math.max(1, hzMax));
  const lo = Math.floor(midiLo);
  const hi = Math.ceil(midiHi);
  let bestMidi = -1;
  let bestDist = Infinity;
  for (let m = lo; m <= hi; m++) {
    const mod = (((m - rootSemitone) % 12) + 12) % 12;
    if (!intervals.includes(mod)) continue;
    const d = Math.abs(m - midiF);
    if (d < bestDist) {
      bestDist = d;
      bestMidi = m;
    }
  }
  if (bestMidi < 0) return hz;
  return 440 * Math.pow(2, (bestMidi - 69) / 12);
}

export interface KeyBinding {
  note: string;
  octaveOffset: 0 | 1;
  keyboardKey: string;
  isBlack: boolean;
}

export const KEY_LAYOUT: KeyBinding[] = [
  { note: "C", octaveOffset: 0, keyboardKey: "z", isBlack: false },
  { note: "C#", octaveOffset: 0, keyboardKey: "s", isBlack: true },
  { note: "D", octaveOffset: 0, keyboardKey: "x", isBlack: false },
  { note: "D#", octaveOffset: 0, keyboardKey: "d", isBlack: true },
  { note: "E", octaveOffset: 0, keyboardKey: "c", isBlack: false },
  { note: "F", octaveOffset: 0, keyboardKey: "v", isBlack: false },
  { note: "F#", octaveOffset: 0, keyboardKey: "g", isBlack: true },
  { note: "G", octaveOffset: 0, keyboardKey: "b", isBlack: false },
  { note: "G#", octaveOffset: 0, keyboardKey: "h", isBlack: true },
  { note: "A", octaveOffset: 0, keyboardKey: "n", isBlack: false },
  { note: "A#", octaveOffset: 0, keyboardKey: "j", isBlack: true },
  { note: "B", octaveOffset: 0, keyboardKey: "m", isBlack: false },
  { note: "C", octaveOffset: 1, keyboardKey: ",", isBlack: false },
];
