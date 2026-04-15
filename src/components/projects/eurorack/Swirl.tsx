import { useCallback } from "react";
import { useSynthStore } from "./store";
import {
  initAudio,
  setSwirlMode,
  setSwirlRate,
  setSwirlDepth,
  setSwirlFeedback,
  setSwirlMix,
} from "./audio";
import { makeLogSliderMap } from "./utils";
import ModuleHelp from "./ModuleHelp";
import EditableValue from "./EditableValue";
import type { SwirlMode } from "./types";
import styles from "./Eurorack.module.css";

const RATE_MAP = makeLogSliderMap(0.1, 12, 1000);
const STEPS = 1000;

const MODE_OPTIONS: { value: SwirlMode; label: string }[] = [
  { value: "chorus", label: "Cho" },
  { value: "phaser", label: "Pha" },
  { value: "vibrato", label: "Vib" },
];

const palette: React.CSSProperties = {
  ["--module-bg" as string]:
    "linear-gradient(180deg, #0e3a3a 0%, #051f22 100%)",
  ["--module-border" as string]: "rgba(100, 220, 210, 0.35)",
  ["--module-text" as string]: "#bfe8e4",
  ["--module-accent" as string]: "#3fe0c8",
  ["--module-track" as string]: "#021214",
  ["--module-width" as string]: "calc(var(--module-u, 40px) * 8)",
  flexGrow: 1,
};

export default function Swirl() {
  const {
    swirlMode,
    swirlRate,
    swirlDepth,
    swirlFeedback,
    swirlMix,
    setSwirlMode: storeSetMode,
    setSwirlRate: storeSetRate,
    setSwirlDepth: storeSetDepth,
    setSwirlFeedback: storeSetFeedback,
    setSwirlMix: storeSetMix,
  } = useSynthStore();

  const handleMode = useCallback(
    (mode: SwirlMode) => {
      storeSetMode(mode);
      initAudio().then(() => setSwirlMode(mode));
    },
    [storeSetMode],
  );

  const handleRate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hz = RATE_MAP.toHz(Number(e.target.value));
      storeSetRate(hz);
      initAudio().then(() => setSwirlRate(hz));
    },
    [storeSetRate],
  );

  const handleDepth = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) / STEPS;
      storeSetDepth(value);
      initAudio().then(() => setSwirlDepth(value));
    },
    [storeSetDepth],
  );

  const handleFeedback = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) / STEPS;
      storeSetFeedback(value);
      initAudio().then(() => setSwirlFeedback(value));
    },
    [storeSetFeedback],
  );

  const handleMix = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) / STEPS;
      storeSetMix(value);
      initAudio().then(() => setSwirlMix(value));
    },
    [storeSetMix],
  );

  const feedbackDisabled = swirlMode !== "chorus";

  return (
    <div className={styles.module} style={palette}>
      <ModuleHelp
        title="Swirl"
        description="Modulation effects — chorus, phaser, and vibrato — applied to the full mixed signal. Adds motion, width, and movement."
        controls={[
          {
            name: "Mode",
            description:
              "Cho = chorus (shimmery thickening), Pha = phaser (sweeping notches), Vib = vibrato (pitch wobble).",
          },
          {
            name: "Rate",
            description: "Speed of the modulating LFO inside the effect, 0.1–12 Hz.",
          },
          {
            name: "Depth",
            description:
              "Intensity of the modulation. Chorus widens, phaser deepens its sweep, vibrato wobbles harder.",
          },
          {
            name: "Fbk",
            description:
              "Chorus feedback — only active in chorus mode. Adds resonance and a flanger-like edge.",
          },
          {
            name: "Mix",
            description: "Dry/wet balance. 0% = clean, 100% = fully processed.",
          },
        ]}
      />
      <h3 className={styles.moduleHeader}>Swirl</h3>
      <div className={styles.moduleBody}>
        <div className={styles.noiseTypes} role="group" aria-label="Swirl mode">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.noiseTypeButton} ${
                swirlMode === opt.value ? styles.noiseTypeButtonActive : ""
              }`}
              onClick={() => handleMode(opt.value)}
              aria-pressed={swirlMode === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={styles.moduleKnobRow}>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Rate</span>
            <input
              type="range"
              min={0}
              max={RATE_MAP.steps}
              step={1}
              value={RATE_MAP.fromHz(swirlRate)}
              onChange={handleRate}
              className={styles.moduleSlider}
              aria-label="Swirl rate"
            />
            <EditableValue
              value={swirlRate}
              min={0.1}
              max={12}
              precision={2}
              unit="Hz"
              onCommit={(v) => {
                storeSetRate(v);
                initAudio().then(() => setSwirlRate(v));
              }}
              ariaLabel="Swirl rate"
            />
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Depth</span>
            <input
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={Math.round(swirlDepth * STEPS)}
              onChange={handleDepth}
              className={styles.moduleSlider}
              aria-label="Swirl depth"
            />
            <EditableValue
              value={swirlDepth * 100}
              min={0}
              max={100}
              precision={0}
              unit="%"
              onCommit={(v) => {
                const linear = v / 100;
                storeSetDepth(linear);
                initAudio().then(() => setSwirlDepth(linear));
              }}
              ariaLabel="Swirl depth"
            />
          </div>
        </div>
        <div className={styles.moduleKnobRow}>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Fbk</span>
            <input
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={Math.round(swirlFeedback * STEPS)}
              onChange={handleFeedback}
              className={styles.moduleSlider}
              aria-label="Swirl feedback"
              disabled={feedbackDisabled}
            />
            <EditableValue
              value={swirlFeedback * 100}
              min={0}
              max={100}
              precision={0}
              unit="%"
              onCommit={(v) => {
                const linear = v / 100;
                storeSetFeedback(linear);
                initAudio().then(() => setSwirlFeedback(linear));
              }}
              ariaLabel="Swirl feedback"
            />
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Mix</span>
            <input
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={Math.round(swirlMix * STEPS)}
              onChange={handleMix}
              className={styles.moduleSlider}
              aria-label="Swirl mix"
            />
            <EditableValue
              value={swirlMix * 100}
              min={0}
              max={100}
              precision={0}
              unit="%"
              onCommit={(v) => {
                const linear = v / 100;
                storeSetMix(linear);
                initAudio().then(() => setSwirlMix(linear));
              }}
              ariaLabel="Swirl mix"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
