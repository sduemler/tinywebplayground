import * as Tone from "tone";
import type { WaveType } from "./types";

let oscillator: Tone.Oscillator | null = null;
let analyser: Tone.Analyser | null = null;
let outputGain: Tone.Gain | null = null;
let initialized = false;

export function getAnalyser(): Tone.Analyser | null {
  return analyser;
}

export function isInitialized(): boolean {
  return initialized;
}

export async function initAudio(): Promise<void> {
  if (initialized) return;

  await Tone.start();

  // Signal chain: oscillator → scopeGain (0.25) → analyser (for scope)
  //               oscillator → outputGain (0.25) → destination (for audio)
  const scopeGain = new Tone.Gain(0.25);
  analyser = new Tone.Analyser("waveform", 1024);
  scopeGain.connect(analyser);

  outputGain = new Tone.Gain(0.25);
  outputGain.connect(Tone.getDestination());

  const osc = new Tone.Oscillator({
    type: "sine",
    frequency: 220,
  });
  osc.connect(scopeGain);
  osc.connect(outputGain);
  oscillator = osc;

  initialized = true;
}

export function startOscillator(): void {
  if (!oscillator || !initialized) return;
  if (oscillator.state !== "started") {
    oscillator.start();
  }
}

export function stopOscillator(): void {
  if (!oscillator || !initialized) return;
  if (oscillator.state === "started") {
    oscillator.stop();
  }
}

export function setWaveType(type: WaveType): void {
  if (!oscillator) return;
  if (type === "flat") {
    stopOscillator();
  } else {
    oscillator.type = type;
    startOscillator();
  }
}

export function mute(): void {
  if (!outputGain) return;
  outputGain.gain.rampTo(0, 0.05);
}

export function unmute(): void {
  if (!outputGain) return;
  outputGain.gain.rampTo(0.25, 0.05);
}

export function setVolume(linear: number): void {
  if (!outputGain) return;
  outputGain.gain.rampTo(linear, 0.05);
}

export function dispose(): void {
  oscillator?.stop();
  oscillator?.dispose();
  outputGain?.dispose();
  analyser?.dispose();
  oscillator = null;
  outputGain = null;
  analyser = null;
  initialized = false;
}
