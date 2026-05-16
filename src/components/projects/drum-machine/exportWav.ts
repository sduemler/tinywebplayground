import * as Tone from "tone";
import type { PatternState } from "./types";
import { findSample } from "./drum-packs";

const SAMPLE_RATE = 44100;
const TAIL_SECONDS = 1;

interface OfflineVoice {
  player: Tone.Player;
  panner: Tone.Panner;
  gain: Tone.Gain;
}

function semitonesToRate(semitones: number): number {
  return 2 ** (semitones / 12);
}

function effectiveTrackGain(
  track: PatternState["tracks"][number],
  anySolo: boolean
): number {
  if (track.mute) return 0;
  if (anySolo && !track.solo) return 0;
  return track.volume;
}

export interface RenderOptions {
  loops: number;
}

async function renderToAudioBuffer(
  pattern: PatternState,
  opts: RenderOptions
): Promise<AudioBuffer> {
  const totalSteps = pattern.bars * pattern.beatsPerBar * pattern.subdivision;
  if (totalSteps === 0) throw new Error("Pattern has no steps.");
  if (pattern.tracks.length === 0) throw new Error("Pattern has no tracks.");

  const beatSeconds = 60 / pattern.bpm;
  const loopSeconds = pattern.bars * pattern.beatsPerBar * beatSeconds;
  const duration = loopSeconds * opts.loops + TAIL_SECONDS;
  const anySolo = pattern.tracks.some((t) => t.solo);
  const interval =
    pattern.subdivision === 4 ? "16n" : pattern.subdivision === 2 ? "8n" : "4n";

  const buffer = await Tone.Offline(async ({ transport }) => {
    const master = new Tone.Gain(pattern.masterVolume).toDestination();
    const voices: Map<string, OfflineVoice> = new Map();

    for (const track of pattern.tracks) {
      const sample = findSample(track.sampleId);
      if (!sample) continue;
      const player = new Tone.Player({ url: sample.file, autostart: false });
      const panner = new Tone.Panner(track.pan);
      const gain = new Tone.Gain(effectiveTrackGain(track, anySolo));
      player.connect(panner);
      panner.connect(gain);
      gain.connect(master);
      voices.set(track.id, { player, panner, gain });
    }

    await Tone.loaded();

    transport.bpm.value = pattern.bpm;
    transport.swing = pattern.swing;
    transport.swingSubdivision = "8n";

    let step = 0;
    transport.scheduleRepeat((time) => {
      const idx = step % totalSteps;
      for (const track of pattern.tracks) {
        if (!track.steps[idx]) continue;
        if (track.mute) continue;
        if (anySolo && !track.solo) continue;
        const voice = voices.get(track.id);
        if (!voice || !voice.player.loaded) continue;
        voice.player.playbackRate = semitonesToRate(track.pitch);
        try {
          voice.player.start(time);
        } catch {
          voice.player.stop(time);
          voice.player.start(time);
        }
      }
      step++;
    }, interval);

    transport.start();
  }, duration, 2, SAMPLE_RATE);

  return buffer.get() as AudioBuffer;
}

/**
 * 16-bit PCM WAV encoder. Returns a Blob ready to download.
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // audio format = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

  let offset = headerSize;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      if (sample > 1) sample = 1;
      else if (sample < -1) sample = -1;
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Small delay before revoke so Safari has time to start the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportPatternAsWav(
  pattern: PatternState,
  opts: RenderOptions = { loops: 1 }
): Promise<void> {
  const buffer = await renderToAudioBuffer(pattern, opts);
  const blob = audioBufferToWav(buffer);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  downloadBlob(blob, `drum-pattern-${stamp}.wav`);
}
