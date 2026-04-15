import { useCallback } from "react";
import { useSynthStore } from "./store";
import {
  initAudio,
  setFxTime,
  setFxFeedback,
  setFxReverbSize,
  setFxMix,
} from "./audio";
import ModuleHelp from "./ModuleHelp";
import EditableValue from "./EditableValue";
import styles from "./Eurorack.module.css";

const TIME_MIN = 0.02;
const TIME_MAX = 1.0;
const STEPS = 1000;

const palette: React.CSSProperties = {
  ["--module-bg" as string]:
    "linear-gradient(180deg, #1e2a4a 0%, #121a33 100%)",
  ["--module-border" as string]: "rgba(120, 150, 220, 0.35)",
  ["--module-text" as string]: "#c8d4ec",
  ["--module-accent" as string]: "#7fa8ff",
  ["--module-track" as string]: "#0a0f1e",
  ["--module-width" as string]: "calc(var(--module-u, 40px) * 8)",
};

function linearMap(
  value: number,
  min: number,
  max: number
): number {
  return min + (value / STEPS) * (max - min);
}

function inverseLinear(hz: number, min: number, max: number): number {
  return Math.round(((hz - min) / (max - min)) * STEPS);
}

export default function Space() {
  const {
    fxTime,
    fxFeedback,
    fxReverbSize,
    fxMix,
    setFxTime: storeSetTime,
    setFxFeedback: storeSetFeedback,
    setFxReverbSize: storeSetReverbSize,
    setFxMix: storeSetMix,
  } = useSynthStore();

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const seconds = linearMap(Number(e.target.value), TIME_MIN, TIME_MAX);
      storeSetTime(seconds);
      initAudio().then(() => setFxTime(seconds));
    },
    [storeSetTime]
  );

  const handleFeedbackChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) / STEPS * 0.95;
      storeSetFeedback(value);
      initAudio().then(() => setFxFeedback(value));
    },
    [storeSetFeedback]
  );

  const handleDecayChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = 0.1 + (Number(e.target.value) / STEPS) * 0.85;
      storeSetReverbSize(value);
      initAudio().then(() => setFxReverbSize(value));
    },
    [storeSetReverbSize]
  );

  const handleMixChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) / STEPS;
      storeSetMix(value);
      initAudio().then(() => setFxMix(value));
    },
    [storeSetMix]
  );

  return (
    <div className={styles.module} style={palette}>
      <ModuleHelp
        title="Space"
        description="A combined delay and reverb effect that adds echo and ambience. Blend it into the dry signal with Mix."
        controls={[
          { name: "Time", description: "Delay time — how long between the dry signal and each echo repeat." },
          { name: "Fbk", description: "Feedback — how much of the delayed signal is fed back into the delay, producing more repeats." },
          { name: "Decay", description: "Reverb room size — larger values produce a longer, more washed-out tail." },
          { name: "Mix", description: "Dry/wet balance. 0% = dry signal only, 100% = fully processed through delay + reverb." },
        ]}
      />
      <h3 className={styles.moduleHeader}>Space</h3>
      <div className={styles.moduleBody}>
        <div className={styles.moduleKnobRow}>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Time</span>
            <input
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={inverseLinear(fxTime, TIME_MIN, TIME_MAX)}
              onChange={handleTimeChange}
              className={styles.moduleSlider}
              aria-label="Delay time"
            />
            <EditableValue
              value={fxTime * 1000}
              min={TIME_MIN * 1000}
              max={TIME_MAX * 1000}
              precision={0}
              unit="ms"
              onCommit={(v) => {
                const seconds = v / 1000;
                storeSetTime(seconds);
                initAudio().then(() => setFxTime(seconds));
              }}
              ariaLabel="Delay time"
            />
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Fbk</span>
            <input
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={Math.round((fxFeedback / 0.95) * STEPS)}
              onChange={handleFeedbackChange}
              className={styles.moduleSlider}
              aria-label="Delay feedback"
            />
            <EditableValue
              value={(fxFeedback / 0.95) * 100}
              min={0}
              max={100}
              precision={0}
              unit="%"
              onCommit={(v) => {
                const linear = (v / 100) * 0.95;
                storeSetFeedback(linear);
                initAudio().then(() => setFxFeedback(linear));
              }}
              ariaLabel="Delay feedback"
            />
          </div>
        </div>
        <div className={styles.moduleKnobRow}>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Decay</span>
            <input
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={Math.round(((fxReverbSize - 0.1) / 0.85) * STEPS)}
              onChange={handleDecayChange}
              className={styles.moduleSlider}
              aria-label="Reverb decay"
            />
            <EditableValue
              value={((fxReverbSize - 0.1) / 0.85) * 100}
              min={0}
              max={100}
              precision={0}
              unit="%"
              onCommit={(v) => {
                const linear = 0.1 + (v / 100) * 0.85;
                storeSetReverbSize(linear);
                initAudio().then(() => setFxReverbSize(linear));
              }}
              ariaLabel="Reverb decay"
            />
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Mix</span>
            <input
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={Math.round(fxMix * STEPS)}
              onChange={handleMixChange}
              className={styles.moduleSlider}
              aria-label="Dry/wet mix"
            />
            <EditableValue
              value={fxMix * 100}
              min={0}
              max={100}
              precision={0}
              unit="%"
              onCommit={(v) => {
                const linear = v / 100;
                storeSetMix(linear);
                initAudio().then(() => setFxMix(linear));
              }}
              ariaLabel="Dry/wet mix"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
