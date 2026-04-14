import { useCallback } from "react";
import { useSynthStore } from "./store";
import { initAudio, setOscLevel, setNoiseLevel, setNoiseType } from "./audio";
import type { NoiseType } from "./types";
import ModuleHelp from "./ModuleHelp";
import styles from "./Eurorack.module.css";

const STEPS = 1000;

const palette: React.CSSProperties = {
  ["--module-bg" as string]:
    "linear-gradient(180deg, #1f3a3a 0%, #0f2020 100%)",
  ["--module-border" as string]: "rgba(100, 180, 180, 0.3)",
  ["--module-text" as string]: "#c8e0e0",
  ["--module-accent" as string]: "#5ec8c8",
  ["--module-track" as string]: "#061818",
  ["--module-width" as string]: "calc(var(--module-u, 40px) * 6)",
};

const NOISE_OPTIONS: { value: NoiseType; label: string }[] = [
  { value: "white", label: "W" },
  { value: "pink", label: "P" },
  { value: "brown", label: "B" },
];

export default function Mixer() {
  const {
    oscLevel,
    noiseLevel,
    noiseType,
    setOscLevel: storeSetOscLevel,
    setNoiseLevel: storeSetNoiseLevel,
    setNoiseType: storeSetNoiseType,
  } = useSynthStore();

  const handleOscLevel = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) / STEPS;
      storeSetOscLevel(value);
      initAudio().then(() => setOscLevel(value));
    },
    [storeSetOscLevel],
  );

  const handleNoiseLevel = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) / STEPS;
      storeSetNoiseLevel(value);
      initAudio().then(() => setNoiseLevel(value));
    },
    [storeSetNoiseLevel],
  );

  const handleNoiseType = useCallback(
    (type: NoiseType) => {
      storeSetNoiseType(type);
      initAudio().then(() => setNoiseType(type));
    },
    [storeSetNoiseType],
  );

  return (
    <div className={styles.module} style={palette}>
      <ModuleHelp
        title="Mixer"
        description="Blends the oscillator with a noise source before the envelope stage. Use noise for hats, wind, or grit layered under the tone."
        controls={[
          { name: "Osc", description: "Level of the main oscillator." },
          { name: "Noise", description: "Level of the noise generator." },
          {
            name: "Type",
            description:
              "White = bright hiss, Pink = natural balanced, Brown = deep rumble.",
          },
        ]}
      />
      <h3 className={styles.moduleHeader}>Mixer</h3>
      <div className={styles.moduleBody}>
        <div className={styles.moduleKnobRow}>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Osc</span>
            <input
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={Math.round(oscLevel * STEPS)}
              onChange={handleOscLevel}
              className={styles.moduleSlider}
              aria-label="Oscillator level"
            />
            <span className={styles.moduleKnobValue}>
              {Math.round(oscLevel * 100)}
            </span>
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Noise</span>
            <input
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={Math.round(noiseLevel * STEPS)}
              onChange={handleNoiseLevel}
              className={styles.moduleSlider}
              aria-label="Noise level"
            />
            <span className={styles.moduleKnobValue}>
              {Math.round(noiseLevel * 100)}
            </span>
          </div>
        </div>
        <div className={styles.noiseTypes} role="group" aria-label="Noise type">
          {NOISE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.noiseTypeButton} ${
                noiseType === opt.value ? styles.noiseTypeButtonActive : ""
              }`}
              onClick={() => handleNoiseType(opt.value)}
              aria-pressed={noiseType === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
