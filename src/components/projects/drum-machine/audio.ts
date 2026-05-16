import * as Tone from "tone";
import { findSample } from "./drum-packs";
import type { TrackState } from "./types";

interface TrackVoice {
  player: Tone.Player;
  panner: Tone.Panner;
  gain: Tone.Gain;
  sampleId: string;
}

const players: Map<string, Tone.Player> = new Map();
const voices: Map<string, TrackVoice> = new Map();
let masterGain: Tone.Gain | null = null;
let initialized = false;
let scheduledId: number | null = null;
let onStepAdvance: ((step: number) => void) | null = null;

function semitonesToRate(semitones: number): number {
  return 2 ** (semitones / 12);
}

async function ensurePlayer(sampleId: string): Promise<Tone.Player | null> {
  const existing = players.get(sampleId);
  if (existing) return existing;
  const sample = findSample(sampleId);
  if (!sample) return null;
  const player = new Tone.Player({
    url: sample.file,
    autostart: false,
  });
  players.set(sampleId, player);
  try {
    await Tone.loaded();
  } catch {
    // ignored — playback will fail audibly but UI stays alive
  }
  return player;
}

async function ensureVoice(track: TrackState): Promise<TrackVoice | null> {
  if (!masterGain) return null;
  const existing = voices.get(track.id);
  if (existing) {
    if (existing.sampleId !== track.sampleId) {
      // Only disconnect the old player from this voice — keep it alive in the
      // players cache so we can reuse it if the user swaps back later.
      existing.player.disconnect();
      const newPlayer = await ensurePlayer(track.sampleId);
      if (!newPlayer) return existing;
      newPlayer.connect(existing.panner);
      existing.player = newPlayer;
      existing.sampleId = track.sampleId;
    }
    return existing;
  }
  const player = await ensurePlayer(track.sampleId);
  if (!player) return null;
  const panner = new Tone.Panner(track.pan);
  const gain = new Tone.Gain(effectiveTrackGain(track, false));
  player.connect(panner);
  panner.connect(gain);
  gain.connect(masterGain);
  const voice: TrackVoice = { player, panner, gain, sampleId: track.sampleId };
  voices.set(track.id, voice);
  return voice;
}

function effectiveTrackGain(track: TrackState, anySolo: boolean): number {
  if (track.mute) return 0;
  if (anySolo && !track.solo) return 0;
  return track.volume;
}

export async function initAudio(): Promise<void> {
  if (initialized) return;
  await Tone.start();
  masterGain = new Tone.Gain(0.85).toDestination();
  Tone.getTransport().swingSubdivision = "8n";
  initialized = true;
}

export function setMasterVolume(v: number) {
  if (masterGain) masterGain.gain.rampTo(v, 0.02);
}

export function setBpm(bpm: number) {
  Tone.getTransport().bpm.rampTo(bpm, 0.05);
}

export function setSwing(swing: number) {
  Tone.getTransport().swing = swing;
}

export async function syncTracks(tracks: TrackState[]): Promise<void> {
  if (!initialized) return;
  const anySolo = tracks.some((t) => t.solo);
  const presentIds = new Set(tracks.map((t) => t.id));

  // Remove voices for tracks that no longer exist.
  for (const [id, voice] of voices.entries()) {
    if (!presentIds.has(id)) {
      voice.player.disconnect();
      voice.player.dispose();
      voice.panner.disconnect();
      voice.panner.dispose();
      voice.gain.disconnect();
      voice.gain.dispose();
      voices.delete(id);
    }
  }

  // Ensure + update voices for current tracks.
  for (const track of tracks) {
    const voice = await ensureVoice(track);
    if (!voice) continue;
    voice.panner.pan.rampTo(track.pan, 0.02);
    voice.gain.gain.rampTo(effectiveTrackGain(track, anySolo), 0.02);
  }
}

export function triggerStep(
  tracks: TrackState[],
  stepIndex: number,
  time: number
) {
  const anySolo = tracks.some((t) => t.solo);
  for (const track of tracks) {
    if (!track.steps[stepIndex]) continue;
    if (track.mute) continue;
    if (anySolo && !track.solo) continue;
    const voice = voices.get(track.id);
    if (!voice) continue;
    if (!voice.player.loaded) continue;
    voice.player.playbackRate = semitonesToRate(track.pitch);
    try {
      voice.player.start(time);
    } catch {
      // Restart if already playing — Tone.Player throws if start is called
      // while still playing; force-stop and retry.
      voice.player.stop(time);
      voice.player.start(time);
    }
  }
}

interface StartOptions {
  getTracks: () => TrackState[];
  getTotalSteps: () => number;
  getInterval: () => "4n" | "8n" | "16n";
  onStep: (step: number) => void;
}

export async function startTransport(opts: StartOptions): Promise<void> {
  if (!initialized) await initAudio();
  onStepAdvance = opts.onStep;

  let step = 0;
  if (scheduledId !== null) {
    Tone.getTransport().clear(scheduledId);
    scheduledId = null;
  }

  scheduledId = Tone.getTransport().scheduleRepeat((time) => {
    const tracks = opts.getTracks();
    const total = opts.getTotalSteps();
    if (total === 0) return;
    const currentStep = step % total;
    triggerStep(tracks, currentStep, time);
    Tone.getDraw().schedule(() => {
      onStepAdvance?.(currentStep);
    }, time);
    step++;
  }, opts.getInterval());

  Tone.getTransport().start();
}

export function subdivisionToInterval(sub: 1 | 2 | 4): "4n" | "8n" | "16n" {
  if (sub === 4) return "16n";
  if (sub === 2) return "8n";
  return "4n";
}

export function stopTransport() {
  if (scheduledId !== null) {
    Tone.getTransport().clear(scheduledId);
    scheduledId = null;
  }
  Tone.getTransport().stop();
  Tone.getTransport().position = 0;
  onStepAdvance = null;
}

export function disposeAudio() {
  stopTransport();
  for (const voice of voices.values()) {
    voice.player.disconnect();
    voice.player.dispose();
    voice.panner.disconnect();
    voice.panner.dispose();
    voice.gain.disconnect();
    voice.gain.dispose();
  }
  voices.clear();
  for (const player of players.values()) {
    try {
      player.dispose();
    } catch {
      // ignored
    }
  }
  players.clear();
  if (masterGain) {
    masterGain.disconnect();
    masterGain.dispose();
    masterGain = null;
  }
  initialized = false;
}

export function isInitialized(): boolean {
  return initialized;
}
