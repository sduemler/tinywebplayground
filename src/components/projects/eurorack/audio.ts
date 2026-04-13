import * as Tone from "tone";
import type { WaveType, LfoTarget } from "./types";

let oscillator: Tone.Oscillator | null = null;
let analyser: Tone.Analyser | null = null;
let outputGain: Tone.Gain | null = null;
let scopeGainNode: Tone.Gain | null = null;
let filter: Tone.Filter | null = null;
let delayNode: Tone.FeedbackDelay | null = null;
let reverbNode: Tone.Freeverb | null = null;
let fxMixer: Tone.CrossFade | null = null;
let lfo1: Tone.LFO | null = null;
let lfo2: Tone.LFO | null = null;
let initialized = false;
let currentVolume = 0.25;
let currentCutoff = 20000;
let currentResonance = 1;
let currentFxTime = 0.25;
let currentFxFeedback = 0.35;
let currentFxReverbSize = 0.7;
let currentFxMix = 0;
let muted = false;

// LFO state — max modulation depth per target (symmetric around 0).
// Actual amplitude = TARGET_DEPTH[target] * depth (0..1 from UI).
const TARGET_DEPTH: Record<LfoTarget, number> = {
  none: 0,
  pitch: 200,   // ±200 cents — ±2 semitones vibrato (routed through osc.detune)
  cutoff: 4000, // ±4 kHz — full wobble sweep
  reso: 8,     // ±8 Q
  volume: 0.15, // ±0.15 linear — tremolo
  mix: 0.35,   // ±35% wet/dry
};

let lfo1Target: LfoTarget = "none";
let lfo1Rate = 2;
let lfo1Depth = 0;
let lfo2Target: LfoTarget = "none";
let lfo2Rate = 4;
let lfo2Depth = 0;

// Returns the Tone Signal/Param to route an LFO into for a given target.
// Typed as any because different targets expose params with different
// unit types (frequency, normalRange, positive, etc.) that don't share
// a common public type, but they all implement the Tone InputNode shape
// which LFO.connect() accepts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTargetSignal(target: LfoTarget): any {
  switch (target) {
    case "pitch":
      return oscillator?.detune ?? null;
    case "cutoff":
      return filter?.frequency ?? null;
    case "reso":
      return filter?.Q ?? null;
    case "volume":
      return outputGain?.gain ?? null;
    case "mix":
      return fxMixer?.fade ?? null;
    default:
      return null;
  }
}

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
  //   osc → filter → fxMixer.a (dry)
  //                → delay → reverb → fxMixer.b (wet)
  //   fxMixer → scopeGain (tracks volume) → analyser
  //   fxMixer → outputGain (volume, or 0 when muted) → destination
  filter = new Tone.Filter({
    type: "lowpass",
    frequency: currentCutoff,
    Q: currentResonance,
    rolloff: -24,
  });

  delayNode = new Tone.FeedbackDelay({
    delayTime: currentFxTime,
    feedback: currentFxFeedback,
  });
  reverbNode = new Tone.Freeverb({
    roomSize: currentFxReverbSize,
    dampening: 3000,
  });
  fxMixer = new Tone.CrossFade(currentFxMix);

  scopeGainNode = new Tone.Gain(currentVolume);
  analyser = new Tone.Analyser("waveform", 1024);
  scopeGainNode.connect(analyser);

  outputGain = new Tone.Gain(muted ? 0 : currentVolume);
  outputGain.connect(Tone.getDestination());

  filter.connect(fxMixer.a);
  filter.connect(delayNode);
  delayNode.connect(reverbNode);
  reverbNode.connect(fxMixer.b);
  fxMixer.connect(scopeGainNode);
  fxMixer.connect(outputGain);

  const osc = new Tone.Oscillator({
    type: "sine",
    frequency: 220,
  });
  osc.connect(filter);
  oscillator = osc;

  lfo1 = new Tone.LFO({
    frequency: lfo1Rate,
    type: "sine",
    min: 0,
    max: 0,
  }).start();
  lfo2 = new Tone.LFO({
    frequency: lfo2Rate,
    type: "sine",
    min: 0,
    max: 0,
  }).start();

  // Re-apply any LFO state the user may have dialed in before init.
  applyLfoRouting(1);
  applyLfoRouting(2);

  initialized = true;
}

// Restore the user's base value to a target param that Tone's connectSignal
// just zeroed (connectSignal cancels scheduled values and sets the destination
// to 0 — see Signal.js connectSignal). Call this immediately after lfo.connect().
function restoreTargetValue(target: LfoTarget): void {
  switch (target) {
    case "volume":
      if (outputGain) outputGain.gain.value = muted ? 0 : currentVolume;
      break;
    case "cutoff":
      if (filter) filter.frequency.value = currentCutoff;
      break;
    case "reso":
      if (filter) filter.Q.value = currentResonance;
      break;
    case "mix":
      if (fxMixer) fxMixer.fade.value = currentFxMix;
      break;
    // pitch routes through oscillator.detune, whose base is always 0 —
    // zeroing it is a no-op, so nothing to restore.
    default:
      break;
  }
}

function applyLfoRouting(which: 1 | 2): void {
  const lfo = which === 1 ? lfo1 : lfo2;
  if (!lfo) return;
  const target = which === 1 ? lfo1Target : lfo2Target;
  const depth = which === 1 ? lfo1Depth : lfo2Depth;

  // Disconnect any existing routing first (safe no-op when nothing connected).
  try {
    lfo.disconnect();
  } catch {
    // ignore
  }

  const amp = TARGET_DEPTH[target] * depth;
  const signal = getTargetSignal(target);
  if (signal) {
    lfo.connect(signal);
    restoreTargetValue(target);
  }
  // Tone.LFO.connect() auto-copies the target's units/convert onto the LFO,
  // which re-runs non-linear conversion (log for frequency, etc.) on min/max
  // and creates a DC offset. Force raw number units AFTER connect so the
  // native AudioParam sees our symmetric ±amp unchanged.
  lfo.convert = false;
  lfo.units = "number";
  lfo.min = -amp;
  lfo.max = amp;
}

function updateLfoDepth(which: 1 | 2): void {
  const lfo = which === 1 ? lfo1 : lfo2;
  if (!lfo) return;
  const target = which === 1 ? lfo1Target : lfo2Target;
  const depth = which === 1 ? lfo1Depth : lfo2Depth;
  const amp = TARGET_DEPTH[target] * depth;
  // lfo.convert/units were forced to number by applyLfoRouting, so these
  // setters are pass-throughs and don't trigger the connectSignal reset.
  lfo.min = -amp;
  lfo.max = amp;
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

export function setFxTime(seconds: number): void {
  currentFxTime = seconds;
  delayNode?.delayTime.rampTo(seconds, 0.05);
}

export function setFxFeedback(value: number): void {
  currentFxFeedback = value;
  delayNode?.feedback.rampTo(value, 0.03);
}

export function setFxReverbSize(value: number): void {
  currentFxReverbSize = value;
  reverbNode?.roomSize.rampTo(value, 0.03);
}

export function setFxMix(value: number): void {
  currentFxMix = value;
  fxMixer?.fade.rampTo(value, 0.03);
}

export function setLfoTarget(which: 1 | 2, target: LfoTarget): void {
  if (which === 1) lfo1Target = target;
  else lfo2Target = target;
  applyLfoRouting(which);
}

export function setLfoRate(which: 1 | 2, hz: number): void {
  if (which === 1) lfo1Rate = hz;
  else lfo2Rate = hz;
  const lfo = which === 1 ? lfo1 : lfo2;
  lfo?.frequency.rampTo(hz, 0.05);
}

export function setLfoDepth(which: 1 | 2, depth: number): void {
  if (which === 1) lfo1Depth = depth;
  else lfo2Depth = depth;
  updateLfoDepth(which);
}

export function dispose(): void {
  oscillator?.stop();
  oscillator?.dispose();
  filter?.dispose();
  delayNode?.dispose();
  reverbNode?.dispose();
  fxMixer?.dispose();
  lfo1?.stop();
  lfo1?.dispose();
  lfo2?.stop();
  lfo2?.dispose();
  outputGain?.dispose();
  scopeGainNode?.dispose();
  analyser?.dispose();
  oscillator = null;
  filter = null;
  delayNode = null;
  reverbNode = null;
  fxMixer = null;
  lfo1 = null;
  lfo2 = null;
  outputGain = null;
  scopeGainNode = null;
  analyser = null;
  initialized = false;
}
