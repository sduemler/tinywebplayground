import * as Tone from "tone";
import type { WaveType, LfoTarget, NoiseType, SeqStep, SwirlMode } from "./types";
import { noteToHz, snapHzToScale } from "./notes";

// Tone doesn't share a public base type for effects that all expose a `wet`
// param. Chorus/Phaser/Vibrato each do, but the union is too narrow for TS to
// reason about without explicit branching, so we hold them as one nullable
// pointer and cast at connect time.
type SwirlEffect = Tone.Chorus | Tone.Phaser | Tone.Vibrato;

let oscillator: Tone.Oscillator | null = null;
let noise: Tone.Noise | null = null;
let oscGain: Tone.Gain | null = null;
let noiseGain: Tone.Gain | null = null;
let sourceMix: Tone.Gain | null = null;
let distortion: Tone.Distortion | null = null;
let bitCrusher: Tone.BitCrusher | null = null;
let crushWet: Tone.CrossFade | null = null;
let analyser: Tone.Analyser | null = null;
let outputGain: Tone.Gain | null = null;
let scopeGainNode: Tone.Gain | null = null;
let filter: Tone.Filter | null = null;
let delayNode: Tone.FeedbackDelay | null = null;
let reverbNode: Tone.Freeverb | null = null;
let fxMixer: Tone.CrossFade | null = null;
let swirlInput: Tone.Gain | null = null;
let swirlOutput: Tone.Gain | null = null;
let swirlEffect: SwirlEffect | null = null;
const lfos: (Tone.LFO | null)[] = [null, null, null, null];
let envelope: Tone.AmplitudeEnvelope | null = null;
let initialized = false;
let currentVolume = 0.25;
let currentCutoff = 20000;
let currentResonance = 1;
let currentFxTime = 0.25;
let currentFxFeedback = 0.35;
let currentFxReverbSize = 0.7;
let currentFxMix = 0;
let muted = false;

let currentOscLevel = 1;
let currentNoiseLevel = 0;
let currentNoiseType: NoiseType = "white";
let currentCrushDrive = 0;
let currentCrushBits = 16;
let currentCrushMix = 0;

let currentSwirlMode: SwirlMode = "chorus";
let currentSwirlRate = 2;
let currentSwirlDepth = 0.5;
let currentSwirlFeedback = 0.2;
let currentSwirlMix = 0;

// Trigger-mode envelope state. In drone mode the envelope is forced to
// pass-through (0, 0, 1, 0) regardless of these values; in trigger mode
// these are applied to the live envelope node.
//
// userTriggerMode is what the Drone/Trigger toggle says. The effective
// hardware envelope mode is (userTriggerMode || forcedTriggerCount > 0),
// so Sequencer/Random can temporarily force trigger mode on without
// clobbering the user's choice.
let userTriggerMode = false;
let forcedTriggerCount = 0;
let currentEnvA = 0.01;
let currentEnvD = 0.15;
let currentEnvS = 0.7;
let currentEnvR = 0.4;

function effectiveTriggerMode(): boolean {
  return userTriggerMode || forcedTriggerCount > 0;
}

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

const lfoTargets: LfoTarget[] = ["none", "none", "none", "none"];
const lfoRates: number[] = [2, 4, 1, 8];
const lfoDepths: number[] = [0, 0, 0, 0];

type LfoIndex = 1 | 2 | 3 | 4;

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
  //   osc   → oscGain   ┐
  //                     ├ sourceMix → envelope → filter → crushWet.a (dry)
  //   noise → noiseGain ┘                               ↘ distortion → bitCrusher → crushWet.b (wet)
  //   crushWet → fxMixer.a (dry)
  //   crushWet → delay → reverb → fxMixer.b (wet)
  //   fxMixer → swirlInput → swirlEffect → swirlOutput
  //   swirlOutput → scopeGain (tracks volume) → analyser
  //   swirlOutput → outputGain (volume, or 0 when muted) → destination
  //
  // Envelope is *always* in the chain. In drone mode it's forced to
  // (0, 0, 1, 0) — pass-through at unity — via applyEnvelopeState() below.
  envelope = new Tone.AmplitudeEnvelope({
    attack: 0,
    decay: 0,
    sustain: 1,
    release: 0,
  });

  filter = new Tone.Filter({
    type: "lowpass",
    frequency: currentCutoff,
    Q: currentResonance,
    rolloff: -24,
  });

  distortion = new Tone.Distortion({
    distortion: currentCrushDrive,
    oversample: "2x",
  });
  bitCrusher = new Tone.BitCrusher({ bits: Math.round(currentCrushBits) });
  crushWet = new Tone.CrossFade(currentCrushMix);

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

  swirlInput = new Tone.Gain(1);
  swirlOutput = new Tone.Gain(1);

  envelope.connect(filter);
  filter.connect(crushWet.a);
  filter.connect(distortion);
  distortion.connect(bitCrusher);
  bitCrusher.connect(crushWet.b);
  crushWet.connect(fxMixer.a);
  crushWet.connect(delayNode);
  delayNode.connect(reverbNode);
  reverbNode.connect(fxMixer.b);
  fxMixer.connect(swirlInput);
  buildSwirlEffect();
  swirlOutput.connect(scopeGainNode);
  swirlOutput.connect(outputGain);

  // Source bus: oscillator + noise → sourceMix → envelope
  oscGain = new Tone.Gain(currentOscLevel);
  noiseGain = new Tone.Gain(currentNoiseLevel);
  sourceMix = new Tone.Gain(1);
  oscGain.connect(sourceMix);
  noiseGain.connect(sourceMix);
  sourceMix.connect(envelope);

  const osc = new Tone.Oscillator({
    type: "sine",
    frequency: 220,
  });
  osc.connect(oscGain);
  oscillator = osc;

  noise = new Tone.Noise({
    type: currentNoiseType,
    volume: 0,
  });
  noise.connect(noiseGain);
  noise.start();

  // Seed the envelope with whatever mode we're in (drone by default).
  applyEnvelopeState();

  for (let i = 0; i < lfos.length; i++) {
    lfos[i] = new Tone.LFO({
      frequency: lfoRates[i],
      type: "sine",
      min: 0,
      max: 0,
    }).start();
  }

  // Re-apply any LFO state the user may have dialed in before init.
  applyLfoRouting(1);
  applyLfoRouting(2);
  applyLfoRouting(3);
  applyLfoRouting(4);

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

function applyLfoRouting(which: LfoIndex): void {
  const i = which - 1;
  const lfo = lfos[i];
  if (!lfo) return;
  const target = lfoTargets[i];
  const depth = lfoDepths[i];

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

function updateLfoDepth(which: LfoIndex): void {
  const i = which - 1;
  const lfo = lfos[i];
  if (!lfo) return;
  const target = lfoTargets[i];
  const depth = lfoDepths[i];
  const amp = TARGET_DEPTH[target] * depth;
  // lfo.convert/units were forced to number by applyLfoRouting, so these
  // setters are pass-throughs and don't trigger the connectSignal reset.
  lfo.min = -amp;
  lfo.max = amp;
}

// Push the mode-appropriate ADSR values onto the live envelope node.
// Drone mode = pass-through (0, 0, 1, 0); trigger mode = user's stored ADSR.
function applyEnvelopeState(): void {
  if (!envelope) return;
  if (effectiveTriggerMode()) {
    envelope.attack = currentEnvA;
    envelope.decay = currentEnvD;
    envelope.sustain = currentEnvS;
    envelope.release = currentEnvR;
  } else {
    envelope.attack = 0;
    envelope.decay = 0;
    envelope.sustain = 1;
    envelope.release = 0;
  }
}

function pushForcedTriggerMode(): void {
  const wasTrigger = effectiveTriggerMode();
  forcedTriggerCount++;
  if (!wasTrigger && effectiveTriggerMode()) {
    // drone → forced trigger: close any held drone so the sequencer/random
    // source can drive the envelope cleanly.
    envelope?.triggerRelease();
    applyEnvelopeState();
  }
}

function popForcedTriggerMode(): void {
  if (forcedTriggerCount === 0) return;
  forcedTriggerCount = Math.max(0, forcedTriggerCount - 1);
  if (forcedTriggerCount === 0 && !userTriggerMode) {
    // Snap back to drone: pass-through envelope, and reopen if a wave is
    // still selected so the tone resumes continuously.
    applyEnvelopeState();
    if (oscillator && oscillator.state === "started") {
      envelope?.triggerAttack();
    }
  }
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
    // Close any open envelope (drone being released, or a held trigger note)
    // and stop the oscillator to save CPU.
    envelope?.triggerRelease();
    stopOscillator();
  } else {
    oscillator.type = type;
    startOscillator();
    // In drone mode the envelope is pass-through, so triggerAttack is an
    // instant jump to 1. In trigger mode we leave the envelope closed and
    // wait for keypresses (or sequencer/random ticks).
    if (!effectiveTriggerMode()) {
      envelope?.triggerAttack();
    }
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

export function setLfoTarget(which: LfoIndex, target: LfoTarget): void {
  lfoTargets[which - 1] = target;
  applyLfoRouting(which);
}

export function setLfoRate(which: LfoIndex, hz: number): void {
  lfoRates[which - 1] = hz;
  lfos[which - 1]?.frequency.rampTo(hz, 0.05);
}

export function setLfoDepth(which: LfoIndex, depth: number): void {
  lfoDepths[which - 1] = depth;
  updateLfoDepth(which);
}

export function setTriggerMode(on: boolean): void {
  if (userTriggerMode === on) return;
  const wasEffective = effectiveTriggerMode();
  userTriggerMode = on;
  const isEffective = effectiveTriggerMode();

  // If a forced source (Sequencer/Random) is already holding trigger mode
  // on, don't touch the hardware envelope — just update the stored user
  // preference. popForcedTriggerMode() will restore when the force ends.
  if (wasEffective === isEffective) return;

  if (isEffective) {
    envelope?.triggerRelease();
    applyEnvelopeState();
  } else {
    applyEnvelopeState();
    if (oscillator && oscillator.state === "started") {
      envelope?.triggerAttack();
    }
  }
}

export function setEnvAttack(seconds: number): void {
  currentEnvA = seconds;
  if (effectiveTriggerMode() && envelope) envelope.attack = seconds;
}

export function setEnvDecay(seconds: number): void {
  currentEnvD = seconds;
  if (effectiveTriggerMode() && envelope) envelope.decay = seconds;
}

export function setEnvSustain(value: number): void {
  currentEnvS = value;
  if (effectiveTriggerMode() && envelope) envelope.sustain = value;
}

export function setEnvRelease(seconds: number): void {
  currentEnvR = seconds;
  if (effectiveTriggerMode() && envelope) envelope.release = seconds;
}

export function triggerNote(hz: number): void {
  if (!oscillator || !envelope) return;
  oscillator.frequency.rampTo(hz, 0.005);
  envelope.triggerAttack();
}

export function releaseNote(): void {
  envelope?.triggerRelease();
}

// Mixer setters
export function setOscLevel(n: number): void {
  currentOscLevel = n;
  oscGain?.gain.rampTo(n, 0.03);
}

export function setNoiseLevel(n: number): void {
  currentNoiseLevel = n;
  noiseGain?.gain.rampTo(n, 0.03);
}

export function setNoiseType(t: NoiseType): void {
  currentNoiseType = t;
  if (noise) noise.type = t;
}

// Swirl (modulation FX: chorus / phaser / vibrato)
//
// The three Tone effects don't share a useful base class, so we allocate a
// single SwirlEffect pointer and rebuild it whenever the mode changes. Rate,
// depth, feedback (chorus-only) and wet are re-applied from the cached values
// each time so mode switches are transparent to the UI.
function buildSwirlEffect(): void {
  if (!swirlInput || !swirlOutput) return;

  if (swirlEffect) {
    try {
      swirlEffect.disconnect();
    } catch {
      // ignore — node may not be connected yet
    }
    swirlEffect.dispose();
    swirlEffect = null;
  }
  // swirlInput has the previous effect as its only downstream connection;
  // clear it before we wire in the new one.
  try {
    swirlInput.disconnect();
  } catch {
    // ignore
  }

  switch (currentSwirlMode) {
    case "chorus": {
      const chorus = new Tone.Chorus({
        frequency: currentSwirlRate,
        depth: currentSwirlDepth,
        feedback: currentSwirlFeedback,
        delayTime: 3.5,
        wet: currentSwirlMix,
      }).start();
      swirlEffect = chorus;
      break;
    }
    case "phaser": {
      const phaser = new Tone.Phaser({
        frequency: currentSwirlRate,
        octaves: Math.max(0.1, currentSwirlDepth * 5),
        baseFrequency: 400,
      });
      phaser.wet.value = currentSwirlMix;
      swirlEffect = phaser;
      break;
    }
    case "vibrato": {
      const vibrato = new Tone.Vibrato({
        frequency: currentSwirlRate,
        depth: currentSwirlDepth,
      });
      vibrato.wet.value = currentSwirlMix;
      swirlEffect = vibrato;
      break;
    }
  }

  swirlInput.connect(swirlEffect);
  swirlEffect.connect(swirlOutput);
}

export function setSwirlMode(mode: SwirlMode): void {
  if (currentSwirlMode === mode) return;
  currentSwirlMode = mode;
  if (initialized) buildSwirlEffect();
}

export function setSwirlRate(hz: number): void {
  currentSwirlRate = hz;
  if (!swirlEffect) return;
  // All three effects expose `frequency` as a Signal/Param.
  swirlEffect.frequency.rampTo(hz, 0.05);
}

export function setSwirlDepth(value: number): void {
  currentSwirlDepth = value;
  if (!swirlEffect) return;
  if (swirlEffect instanceof Tone.Chorus) {
    swirlEffect.depth = value;
  } else if (swirlEffect instanceof Tone.Phaser) {
    // Phaser expresses "depth" as octave span.
    swirlEffect.octaves = Math.max(0.1, value * 5);
  } else if (swirlEffect instanceof Tone.Vibrato) {
    swirlEffect.depth.rampTo(value, 0.03);
  }
}

export function setSwirlFeedback(value: number): void {
  currentSwirlFeedback = value;
  // Only chorus uses feedback; the other modes ignore the stored value until
  // the user switches back to chorus (at which point buildSwirlEffect re-reads
  // it).
  if (swirlEffect instanceof Tone.Chorus) {
    swirlEffect.feedback.rampTo(value, 0.03);
  }
}

export function setSwirlMix(value: number): void {
  currentSwirlMix = value;
  swirlEffect?.wet.rampTo(value, 0.03);
}

// Crush setters
export function setCrushDrive(n: number): void {
  currentCrushDrive = n;
  if (distortion) distortion.distortion = n;
}

export function setCrushBits(n: number): void {
  const v = Math.max(1, Math.min(16, Math.round(n)));
  currentCrushBits = v;
  if (bitCrusher) bitCrusher.bits.value = v;
}

export function setCrushMix(n: number): void {
  currentCrushMix = n;
  crushWet?.fade.rampTo(n, 0.03);
}

// Transport refcount — Sequencer and Random share a single Tone.Transport.
let transportRefCount = 0;

function ensureTransport(): void {
  if (transportRefCount === 0) {
    Tone.getTransport().start("+0.05");
  }
  transportRefCount++;
}

function releaseTransport(): void {
  transportRefCount = Math.max(0, transportRefCount - 1);
  if (transportRefCount === 0) {
    Tone.getTransport().stop();
    Tone.getTransport().cancel(0);
  }
}

// Sequencer
interface SequencerOpts {
  bpm: number;
  loopLength: number;
  gate: number;
  steps: SeqStep[];
  onTick: (stepIndex: number) => void;
}

const seqState: {
  repeatId: number | null;
  cursor: number;
  opts: SequencerOpts | null;
} = { repeatId: null, cursor: 0, opts: null };

export function startSequencer(opts: SequencerOpts): void {
  stopSequencer();
  seqState.opts = { ...opts, steps: opts.steps };
  seqState.cursor = 0;
  const transport = Tone.getTransport();
  transport.bpm.value = opts.bpm;
  seqState.repeatId = transport.scheduleRepeat((time) => {
    const s = seqState.opts;
    if (!s) return;
    const i = seqState.cursor % s.loopLength;
    const step = s.steps[i];
    // UI highlight must run on the main thread, not the audio thread.
    Tone.getDraw().schedule(() => s.onTick(i), time);
    if (step?.on && oscillator && envelope) {
      const hz = noteToHz(step.note, step.octave);
      oscillator.frequency.setValueAtTime(hz, time);
      const stepSeconds = 60 / transport.bpm.value / 4;
      envelope.triggerAttackRelease(stepSeconds * s.gate, time);
    }
    seqState.cursor++;
  }, "16n");
  ensureTransport();
  pushForcedTriggerMode();
}

export function stopSequencer(): void {
  if (seqState.repeatId !== null) {
    Tone.getTransport().clear(seqState.repeatId);
    seqState.repeatId = null;
    releaseTransport();
    popForcedTriggerMode();
    envelope?.triggerRelease();
  }
  seqState.opts = null;
  seqState.cursor = 0;
}

export function setSequencerBpm(bpm: number): void {
  if (seqState.opts) seqState.opts.bpm = bpm;
  Tone.getTransport().bpm.rampTo(bpm, 0.05);
}

export function updateSequencerOpts(partial: Partial<SequencerOpts>): void {
  if (!seqState.opts) return;
  Object.assign(seqState.opts, partial);
}

// Random
interface RandomOpts {
  hzMin: number;
  hzMax: number;
  rateMsMin: number;
  rateMsMax: number;
  gateMs: number;
  rootSemitone: number;
  scaleIntervals: readonly number[] | null;
}

const randState: {
  timerId: ReturnType<typeof setTimeout> | null;
  opts: RandomOpts | null;
} = { timerId: null, opts: null };

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function startRandom(opts: RandomOpts): void {
  stopRandom();
  randState.opts = { ...opts };
  const tick = (): void => {
    const s = randState.opts;
    if (!s || !oscillator || !envelope) return;
    const lo = Math.min(s.hzMin, s.hzMax);
    const hi = Math.max(s.hzMin, s.hzMax);
    const logMin = Math.log(Math.max(1, lo));
    const logMax = Math.log(Math.max(1, hi));
    let hz = Math.exp(logMin + Math.random() * (logMax - logMin));
    if (s.scaleIntervals) {
      hz = snapHzToScale(hz, lo, hi, s.rootSemitone, s.scaleIntervals);
    }
    oscillator.frequency.rampTo(hz, 0.005);
    envelope.triggerAttackRelease(s.gateMs / 1000);
    const nextMs = randBetween(
      Math.min(s.rateMsMin, s.rateMsMax),
      Math.max(s.rateMsMin, s.rateMsMax),
    );
    randState.timerId = setTimeout(tick, nextMs);
  };
  pushForcedTriggerMode();
  randState.timerId = setTimeout(tick, 0);
}

export function stopRandom(): void {
  if (randState.timerId !== null) {
    clearTimeout(randState.timerId);
    randState.timerId = null;
    popForcedTriggerMode();
    envelope?.triggerRelease();
  }
  randState.opts = null;
}

export function updateRandomOpts(partial: Partial<RandomOpts>): void {
  if (randState.opts) Object.assign(randState.opts, partial);
}

export function dispose(): void {
  // Stop timed/scheduled sources before tearing down nodes.
  stopSequencer();
  stopRandom();
  forcedTriggerCount = 0;

  oscillator?.stop();
  oscillator?.dispose();
  noise?.stop();
  noise?.dispose();
  oscGain?.dispose();
  noiseGain?.dispose();
  sourceMix?.dispose();
  envelope?.dispose();
  filter?.dispose();
  distortion?.dispose();
  bitCrusher?.dispose();
  crushWet?.dispose();
  delayNode?.dispose();
  reverbNode?.dispose();
  fxMixer?.dispose();
  swirlEffect?.dispose();
  swirlInput?.dispose();
  swirlOutput?.dispose();
  for (let i = 0; i < lfos.length; i++) {
    lfos[i]?.stop();
    lfos[i]?.dispose();
    lfos[i] = null;
  }
  outputGain?.dispose();
  scopeGainNode?.dispose();
  analyser?.dispose();
  oscillator = null;
  noise = null;
  oscGain = null;
  noiseGain = null;
  sourceMix = null;
  envelope = null;
  filter = null;
  distortion = null;
  bitCrusher = null;
  crushWet = null;
  delayNode = null;
  reverbNode = null;
  fxMixer = null;
  swirlEffect = null;
  swirlInput = null;
  swirlOutput = null;
  outputGain = null;
  scopeGainNode = null;
  analyser = null;
  initialized = false;
}
