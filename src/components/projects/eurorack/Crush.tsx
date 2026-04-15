import { useCallback } from "react";
import { useSynthStore } from "./store";
import { initAudio, setCrushDrive, setCrushBits, setCrushMix } from "./audio";
import ModuleHelp from "./ModuleHelp";
import EditableValue from "./EditableValue";
import styles from "./Eurorack.module.css";

const DRIVE_STEPS = 1000;

const palette: React.CSSProperties = {
  ["--module-bg" as string]:
    "linear-gradient(180deg, #4a1a1a 0%, #2a0d0d 100%)",
  ["--module-border" as string]: "rgba(255, 100, 80, 0.35)",
  ["--module-text" as string]: "#f0cac0",
  ["--module-accent" as string]: "#ff5a3c",
  ["--module-track" as string]: "#1a0606",
  ["--module-width" as string]: "calc(var(--module-u, 40px) * 6)",
};

export default function Crush() {
  const {
    crushDrive,
    crushBits,
    crushMix,
    setCrushDrive: storeSetDrive,
    setCrushBits: storeSetBits,
    setCrushMix: storeSetMix,
  } = useSynthStore();

  const handleDrive = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) / DRIVE_STEPS;
      storeSetDrive(value);
      initAudio().then(() => setCrushDrive(value));
    },
    [storeSetDrive],
  );

  const handleBits = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      storeSetBits(value);
      initAudio().then(() => setCrushBits(value));
    },
    [storeSetBits],
  );

  const handleMix = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) / DRIVE_STEPS;
      storeSetMix(value);
      initAudio().then(() => setCrushMix(value));
    },
    [storeSetMix],
  );

  return (
    <div className={styles.module} style={palette}>
      <ModuleHelp
        title="Crush"
        description="Distortion and bitcrusher. Sits between the filter and the space effects, adding grit, warmth, or digital breakup."
        controls={[
          {
            name: "Drive",
            description:
              "Amount of waveshaping distortion — 0% is clean, 100% is heavy saturation.",
          },
          {
            name: "Bits",
            description:
              "Bit depth. 16 is clean digital, 1 is square-wave destruction.",
          },
          {
            name: "Mix",
            description:
              "Blend between the clean filter output and the crushed signal.",
          },
        ]}
      />
      <h3 className={styles.moduleHeader}>Crush</h3>
      <div className={styles.moduleBody}>
        <div className={styles.moduleKnobRow}>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Drive</span>
            <input
              type="range"
              min={0}
              max={DRIVE_STEPS}
              step={1}
              value={Math.round(crushDrive * DRIVE_STEPS)}
              onChange={handleDrive}
              className={styles.moduleSlider}
              aria-label="Crush drive"
            />
            <EditableValue
              value={crushDrive * 100}
              min={0}
              max={100}
              precision={0}
              onCommit={(v) => {
                const linear = v / 100;
                storeSetDrive(linear);
                initAudio().then(() => setCrushDrive(linear));
              }}
              ariaLabel="Crush drive"
            />
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Bits</span>
            <input
              type="range"
              min={1}
              max={16}
              step={1}
              value={crushBits}
              onChange={handleBits}
              className={styles.moduleSlider}
              aria-label="Crush bit depth"
            />
            <EditableValue
              value={crushBits}
              min={1}
              max={16}
              precision={0}
              onCommit={(v) => {
                storeSetBits(v);
                initAudio().then(() => setCrushBits(v));
              }}
              ariaLabel="Crush bit depth"
            />
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Mix</span>
            <input
              type="range"
              min={0}
              max={DRIVE_STEPS}
              step={1}
              value={Math.round(crushMix * DRIVE_STEPS)}
              onChange={handleMix}
              className={styles.moduleSlider}
              aria-label="Crush mix"
            />
            <EditableValue
              value={crushMix * 100}
              min={0}
              max={100}
              precision={0}
              unit="%"
              onCommit={(v) => {
                const linear = v / 100;
                storeSetMix(linear);
                initAudio().then(() => setCrushMix(linear));
              }}
              ariaLabel="Crush mix"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
