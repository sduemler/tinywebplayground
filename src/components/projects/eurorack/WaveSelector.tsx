import React from "react";
import type { WaveType } from "./types";
import styles from "./Eurorack.module.css";

interface WaveSelectorProps {
  activeWave: WaveType | null;
  onSelect: (wave: WaveType) => void;
}

function SineIcon() {
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M1,8 C4,1 10,1 14,8 C18,15 24,15 27,8" />
    </svg>
  );
}

function SquareIcon() {
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1,12 L1,4 L9,4 L9,12 L18,12 L18,4 L27,4 L27,12" />
    </svg>
  );
}

function SawIcon() {
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1,12 L9,3 L9,12 L18,3 L18,12 L27,3" />
    </svg>
  );
}

function FlatIcon() {
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M1,8 L27,8" />
    </svg>
  );
}

const waves: { type: WaveType; icon: () => React.JSX.Element; label: string }[] = [
  { type: "flat", icon: FlatIcon, label: "No signal" },
  { type: "sine", icon: SineIcon, label: "Sine wave" },
  { type: "square", icon: SquareIcon, label: "Square wave" },
  { type: "sawtooth", icon: SawIcon, label: "Sawtooth wave" },
];

export default function WaveSelector({ activeWave, onSelect }: WaveSelectorProps) {
  return (
    <div className={styles.waveSelector}>
      {waves.map(({ type, icon: Icon, label }) => (
        <React.Fragment key={type}>
          {type === "sine" && <div className={styles.waveSeparator} />}
          <button
            className={`${styles.waveButton} ${activeWave === type ? styles.waveButtonActive : ""}`}
            onClick={() => onSelect(type)}
            aria-pressed={activeWave === type}
            aria-label={label}
            title={label}
          >
            <Icon />
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
