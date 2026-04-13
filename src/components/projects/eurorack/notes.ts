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
