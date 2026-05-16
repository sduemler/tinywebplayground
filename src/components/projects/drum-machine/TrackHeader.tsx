import type { DragEvent } from "react";
import { findSample } from "./drum-packs";
import { useDrumStore } from "./store";
import ModuleHelp from "./ModuleHelp";
import { SAMPLE_ICON, VolumeIcon, PanIcon, MuteIcon, SoloIcon } from "./Icons";
import styles from "./DrumMachine.module.css";

interface Props {
  trackId: string;
  onPickSample: (trackId: string) => void;
  onHandleDragStart: (e: DragEvent) => void;
  onHandleDragEnd: () => void;
}

export default function TrackHeader({
  trackId,
  onPickSample,
  onHandleDragStart,
  onHandleDragEnd,
}: Props) {
  const track = useDrumStore((s) => s.tracks.find((t) => t.id === trackId));
  const setTrackVolume = useDrumStore((s) => s.setTrackVolume);
  const setTrackPan = useDrumStore((s) => s.setTrackPan);
  const setTrackPitch = useDrumStore((s) => s.setTrackPitch);
  const toggleMute = useDrumStore((s) => s.toggleMute);
  const toggleSolo = useDrumStore((s) => s.toggleSolo);
  const removeTrack = useDrumStore((s) => s.removeTrack);

  if (!track) return null;
  const sample = findSample(track.sampleId);
  const label = sample?.name ?? "—";
  const Icon = SAMPLE_ICON[track.sampleId];

  return (
    <div className={styles.trackHeader}>
      <div className={styles.trackUtilRow}>
        <span
          className={styles.dragHandle}
          draggable={true}
          onDragStart={onHandleDragStart}
          onDragEnd={onHandleDragEnd}
          aria-label="Drag to reorder"
          role="button"
          title="Drag to reorder"
        >
          ≡
        </span>
        <span className={styles.trackIcon} aria-hidden>
          {Icon ? <Icon size={20} /> : null}
        </span>
        <ModuleHelp
          title={`${label} track`}
          description="Per-track controls for this instrument column. Tap pads below to program steps."
          controls={[
            { name: "Sample name", description: "Click to swap this track to a different sample from any pack." },
            { name: "Volume", description: "Loudness of this track (0–100%)." },
            { name: "Pan", description: "Stereo position. Left ↔ Right." },
            { name: "Tune (T)", description: "Pitch shift in semitones (−24 to +24). Changes sample playback rate." },
            { name: "Mute", description: "Silence this track without removing its programmed steps." },
            { name: "Solo", description: "Isolate this track. If any track is soloed, only soloed tracks play." },
            { name: "×", description: "Remove this track entirely." },
            { name: "≡", description: "Drag this column to reorder it among the other tracks." },
          ]}
        />
      </div>
      <button
        type="button"
        className={styles.trackName}
        onClick={() => onPickSample(track.id)}
        title={`Change sample (currently ${label})`}
      >
        {label}
      </button>

      <div className={styles.trackControls}>
        <label className={styles.trackControlRow} title="Volume">
          <span className={styles.trackControlIcon} aria-hidden>
            <VolumeIcon size={14} />
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={track.volume}
            onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
            aria-label={`${label} volume`}
          />
        </label>
        <label className={styles.trackControlRow} title="Pan">
          <span className={styles.trackControlIcon} aria-hidden>
            <PanIcon size={14} />
          </span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={track.pan}
            onChange={(e) => setTrackPan(track.id, parseFloat(e.target.value))}
            aria-label={`${label} pan`}
          />
        </label>
        <div className={styles.trackControlRow} title="Pitch (semitones)">
          <span aria-hidden>T</span>
          <div className={styles.pitchStepper}>
            <button
              type="button"
              className={styles.pitchButton}
              onClick={() => setTrackPitch(track.id, track.pitch - 1)}
              disabled={track.pitch <= -24}
              aria-label={`${label} pitch down one semitone`}
            >
              −
            </button>
            <span
              className={styles.pitchValue}
              aria-label={`${label} pitch ${track.pitch} semitones`}
            >
              {track.pitch > 0 ? `+${track.pitch}` : track.pitch}
            </span>
            <button
              type="button"
              className={styles.pitchButton}
              onClick={() => setTrackPitch(track.id, track.pitch + 1)}
              disabled={track.pitch >= 24}
              aria-label={`${label} pitch up one semitone`}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className={styles.trackToggleRow}>
        <button
          type="button"
          className={`${styles.miniButton} ${track.mute ? styles.miniButtonActive : ""}`}
          onClick={() => toggleMute(track.id)}
          aria-pressed={track.mute}
          aria-label={`${label} mute`}
          title="Mute"
        >
          <MuteIcon size={14} />
        </button>
        <button
          type="button"
          className={`${styles.miniButton} ${track.solo ? styles.miniButtonActive : ""}`}
          onClick={() => toggleSolo(track.id)}
          aria-pressed={track.solo}
          aria-label={`${label} solo`}
          title="Solo"
        >
          <SoloIcon size={14} />
        </button>
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => removeTrack(track.id)}
          aria-label={`Remove ${label} track`}
          title="Remove track"
        >
          ×
        </button>
      </div>
    </div>
  );
}
