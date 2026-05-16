import { useRef, useState } from "react";
import { useDrumStore, LIMITS } from "./store";
import ModuleHelp from "./ModuleHelp";
import { initAudio } from "./audio";
import {
  PlayIcon,
  StopIcon,
  TempoIcon,
  VolumeIcon,
  SwingIcon,
  SaveIcon,
} from "./Icons";
import styles from "./DrumMachine.module.css";

const TAP_WINDOW = 4;

interface Props {
  onOpenShare: () => void;
}

export default function MasterControls({ onOpenShare }: Props) {
  const isPlaying = useDrumStore((s) => s.isPlaying);
  const setIsPlaying = useDrumStore((s) => s.setIsPlaying);
  const bpm = useDrumStore((s) => s.bpm);
  const setBpm = useDrumStore((s) => s.setBpm);
  const swing = useDrumStore((s) => s.swing);
  const setSwing = useDrumStore((s) => s.setSwing);
  const masterVolume = useDrumStore((s) => s.masterVolume);
  const setMasterVolume = useDrumStore((s) => s.setMasterVolume);
  const clearAll = useDrumStore((s) => s.clearAll);

  const tapTimes = useRef<number[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const beatsPerBar = useDrumStore((s) => s.beatsPerBar);
  const subdivision = useDrumStore((s) => s.subdivision);
  const currentStep = useDrumStore((s) => s.currentStep);
  const cellsPerBar = beatsPerBar * subdivision;
  const positionBar = Math.floor(currentStep / cellsPerBar) + 1;
  const positionBeat = Math.floor((currentStep % cellsPerBar) / subdivision) + 1;

  const handleTap = () => {
    const now = performance.now();
    const taps = tapTimes.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      // Reset if there's a long pause between taps.
      taps.length = 0;
    }
    taps.push(now);
    if (taps.length > TAP_WINDOW) taps.shift();
    if (taps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const inferred = Math.round(60000 / avg);
      setBpm(inferred);
    }
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      window.setTimeout(() => setConfirmClear(false), 2500);
      return;
    }
    clearAll();
    setConfirmClear(false);
  };

  return (
    <div className={styles.masterControls}>
      <div className={styles.transportCluster}>
        <button
          type="button"
          className={`${styles.transportButton} ${
            isPlaying ? styles.transportButtonPlaying : ""
          }`}
          onClick={() => {
            // Fire AudioContext unlock SYNCHRONOUSLY in the click handler so
            // iOS Safari accepts it as part of the user gesture. The promise
            // it returns is intentionally not awaited here.
            void initAudio();
            setIsPlaying(!isPlaying);
          }}
          aria-label={isPlaying ? "Stop" : "Play"}
        >
          {isPlaying ? <StopIcon size={18} /> : <PlayIcon size={18} />}
        </button>
        <span className={styles.positionReadout} aria-live="polite">
          {isPlaying
            ? `${positionBar}.${positionBeat}`
            : `${"–".repeat(1)}.${"–".repeat(1)}`}
        </span>
      </div>

      <div className={styles.masterField}>
        <span className={styles.masterFieldLabel}>
          <TempoIcon size={12} />
          BPM
        </span>
        <div className={styles.masterBpmRow}>
          <input
            type="range"
            min={LIMITS.MIN_BPM}
            max={LIMITS.MAX_BPM}
            step={1}
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value, 10))}
            aria-label="BPM slider"
          />
          <input
            type="number"
            min={LIMITS.MIN_BPM}
            max={LIMITS.MAX_BPM}
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value || "0", 10))}
            className={styles.bpmNumber}
            aria-label="BPM"
          />
          <button
            type="button"
            className={styles.tapButton}
            onClick={handleTap}
            title="Tap to set tempo"
            aria-label="Tap tempo"
          >
            Tap
          </button>
        </div>
      </div>

      <div className={styles.masterField}>
        <span className={styles.masterFieldLabel}>
          <VolumeIcon size={12} />
          Volume
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterVolume}
          onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          aria-label="Master volume"
        />
      </div>

      <div className={styles.masterField}>
        <span className={styles.masterFieldLabel}>
          <SwingIcon size={12} />
          Swing
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={swing}
          onChange={(e) => setSwing(parseFloat(e.target.value))}
          aria-label="Swing"
        />
      </div>

      <div className={styles.masterActions}>
        <button
          type="button"
          className={`${styles.masterAction} ${
            confirmClear ? styles.masterActionDanger : ""
          }`}
          onClick={handleClear}
        >
          {confirmClear ? "Confirm clear?" : "Clear"}
        </button>
        <button
          type="button"
          className={styles.masterAction}
          onClick={onOpenShare}
        >
          <SaveIcon size={14} />
          Share
        </button>
        <ModuleHelp
          title="Master controls"
          description="Transport and global tempo, swing, and volume for the whole machine."
          controls={[
            { name: "Play / Stop", description: "Start or stop the sequencer. First click also primes the audio engine." },
            { name: "BPM", description: "Beats per minute. Drag the slider, type a value, or use Tap." },
            { name: "Tap", description: "Tap repeatedly in time to set BPM by feel — averages the last few taps." },
            { name: "Volume", description: "Overall output level for the machine." },
            { name: "Swing", description: "Shuffles the off-beats for a looser, jazzier feel. 0 = straight, 1 = full triplet feel." },
            { name: "Clear", description: "Wipes every step on every track. Requires a second click to confirm." },
            { name: "Share", description: "Open the share / export dialog (copy URL, copy JSON, import, or download a WAV)." },
          ]}
        />
      </div>
    </div>
  );
}
