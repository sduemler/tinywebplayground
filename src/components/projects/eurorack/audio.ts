import * as Tone from "tone";
import type { WaveType } from "./types";

let oscillator: Tone.Oscillator | null = null;
let analyser: Tone.Analyser | null = null;
let outputGain: Tone.Gain | null = null;
let scopeGainNode: Tone.Gain | null = null;
let filter: Tone.Filter | null = null;
let initialized = false;
let currentVolume = 0.25;
let currentCutoff = 20000;
let currentResonance = 1;
let muted = false;

export function getAnalyser(): Tone.Analyser | null {
  return analyser;
}

export function isInitialized(): boolean {
  return initialized;
}

export async function initAudio(): Promise<void> {
  if (initialized) return;

  await Tone.start();

  // Signal chain:
  //   oscillator → filter → scopeGain (tracks volume) → analyser (for scope)
  //   oscillator → filter → outputGain (volume, or 0 when muted) → destination (for audio)
  filter = new Tone.Filter({
    type: "lowpass",
    frequency: currentCutoff,
    Q: currentResonance,
    rolloff: -24,
  });

  scopeGainNode = new Tone.Gain(currentVolume);
  analyser = new Tone.Analyser("waveform", 1024);
  scopeGainNode.connect(analyser);

  outputGain = new Tone.Gain(muted ? 0 : currentVolume);
  outputGain.connect(Tone.getDestination());

  filter.connect(scopeGainNode);
  filter.connect(outputGain);

  const osc = new Tone.Oscillator({
    type: "sine",
    frequency: 220,
  });
  osc.connect(filter);
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
  muted = true;
  if (!outputGain) return;
  outputGain.gain.rampTo(0, 0.05);
}

export function unmute(): void {
  muted = false;
  if (!outputGain) return;
  outputGain.gain.rampTo(currentVolume, 0.05);
}

export function setVolume(linear: number): void {
  currentVolume = linear;
  scopeGainNode?.gain.rampTo(linear, 0.03);
  if (!outputGain || muted) return;
  outputGain.gain.rampTo(linear, 0.03);
}

export function setFrequency(hz: number): void {
  if (!oscillator) return;
  oscillator.frequency.rampTo(hz, 0.03);
}

export function setFilterCutoff(hz: number): void {
  currentCutoff = hz;
  filter?.frequency.rampTo(hz, 0.03);
}

export function setFilterResonance(q: number): void {
  currentResonance = q;
  filter?.Q.rampTo(q, 0.03);
}

export function dispose(): void {
  oscillator?.stop();
  oscillator?.dispose();
  filter?.dispose();
  outputGain?.dispose();
  scopeGainNode?.dispose();
  analyser?.dispose();
  oscillator = null;
  filter = null;
  outputGain = null;
  scopeGainNode = null;
  analyser = null;
  initialized = false;
}
