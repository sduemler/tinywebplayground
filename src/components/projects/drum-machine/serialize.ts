import type { PatternState, TrackState, Subdivision } from "./types";
import { findSample, getDefaultPack } from "./drum-packs";
import { LIMITS, SUBDIVISIONS } from "./store";

const VERSION = 1;

interface CompactTrack {
  s: string;
  v: number;
  pn: number;
  pt: number;
  m: 0 | 1;
  so: 0 | 1;
  st: string;
}

interface CompactPattern {
  v: number;
  b: number;
  bb: number;
  sd: Subdivision;
  bpm: number;
  sw: number;
  mv: number;
  p: string;
  t: CompactTrack[];
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function stepsToHex(steps: boolean[]): string {
  if (steps.length === 0) return "0";
  let bits = "";
  for (let i = steps.length - 1; i >= 0; i--) bits += steps[i] ? "1" : "0";
  // BigInt handles arbitrary-length bitstrings; up to 16*16=256 bits is well within reach.
  return BigInt("0b" + bits).toString(16);
}

function hexToSteps(hex: string, length: number): boolean[] {
  if (length === 0) return [];
  const bigint = BigInt("0x" + (hex || "0"));
  const out: boolean[] = new Array(length).fill(false);
  for (let i = 0; i < length; i++) {
    out[i] = (bigint & (1n << BigInt(i))) !== 0n;
  }
  return out;
}

function compactTrack(track: TrackState): CompactTrack {
  return {
    s: track.sampleId,
    v: round3(track.volume),
    pn: round3(track.pan),
    pt: track.pitch,
    m: track.mute ? 1 : 0,
    so: track.solo ? 1 : 0,
    st: stepsToHex(track.steps),
  };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function expandTrack(ct: CompactTrack, totalSteps: number): TrackState {
  const sample = findSample(ct.s);
  const safeSampleId = sample ? ct.s : getDefaultPack().samples[0].id;
  return {
    id: uid(),
    sampleId: safeSampleId,
    volume: clamp(ct.v ?? 0.85, 0, 1),
    pan: clamp(ct.pn ?? 0, -1, 1),
    pitch: clamp(Math.round(ct.pt ?? 0), -24, 24),
    mute: ct.m === 1,
    solo: ct.so === 1,
    steps: hexToSteps(ct.st ?? "0", totalSteps),
  };
}

export function encodePattern(pattern: PatternState): string {
  const payload: CompactPattern = {
    v: VERSION,
    b: pattern.bars,
    bb: pattern.beatsPerBar,
    sd: pattern.subdivision,
    bpm: pattern.bpm,
    sw: round3(pattern.swing),
    mv: round3(pattern.masterVolume),
    p: pattern.defaultPackSlug,
    t: pattern.tracks.map(compactTrack),
  };
  return JSON.stringify(payload);
}

export function decodePattern(json: string): PatternState {
  const raw = JSON.parse(json) as Partial<CompactPattern>;
  if (raw.v !== VERSION) {
    throw new Error(`Unsupported pattern version: ${raw.v}`);
  }
  const bars = clamp(
    Math.round(raw.b ?? 4),
    LIMITS.MIN_BARS,
    LIMITS.MAX_BARS
  );
  const beatsPerBar = clamp(
    Math.round(raw.bb ?? 4),
    LIMITS.MIN_BEATS_PER_BAR,
    LIMITS.MAX_BEATS_PER_BAR
  );
  const rawSub = raw.sd ?? 1;
  const subdivision: Subdivision = SUBDIVISIONS.includes(rawSub as Subdivision)
    ? (rawSub as Subdivision)
    : 1;
  const totalSteps = bars * beatsPerBar * subdivision;
  const tracks = (raw.t ?? []).map((ct) => expandTrack(ct, totalSteps));

  return {
    bars,
    beatsPerBar,
    subdivision,
    bpm: clamp(Math.round(raw.bpm ?? 110), LIMITS.MIN_BPM, LIMITS.MAX_BPM),
    swing: clamp(raw.sw ?? 0, 0, 1),
    masterVolume: clamp(raw.mv ?? 0.85, 0, 1),
    defaultPackSlug: raw.p ?? getDefaultPack().slug,
    tracks,
  };
}

function urlSafeBtoa(input: string): string {
  return btoa(unescape(encodeURIComponent(input)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function urlSafeAtob(input: string): string {
  const padded = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  return decodeURIComponent(escape(atob(padded)));
}

export function encodeToUrlParam(pattern: PatternState): string {
  return urlSafeBtoa(encodePattern(pattern));
}

export function decodeFromUrlParam(param: string): PatternState {
  return decodePattern(urlSafeAtob(param));
}

export function buildShareUrl(pattern: PatternState): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.search = `?p=${encodeToUrlParam(pattern)}`;
  url.hash = "";
  return url.toString();
}

/**
 * Try to read a pattern from a free-form import string — accepts either
 * a full URL with ?p= param, a bare base64 param, or raw JSON.
 */
export function importFromText(text: string): PatternState {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Nothing to import.");

  // Try URL first.
  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    const p = url.searchParams.get("p");
    if (!p) throw new Error("URL has no pattern parameter.");
    return decodeFromUrlParam(p);
  }

  // Try raw JSON.
  if (trimmed.startsWith("{")) {
    return decodePattern(trimmed);
  }

  // Otherwise assume base64.
  return decodeFromUrlParam(trimmed);
}
