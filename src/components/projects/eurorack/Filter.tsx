import { useCallback } from "react";
import { useSynthStore } from "./store";
import { initAudio, setFilterCutoff, setFilterResonance } from "./audio";
import { makeLogSliderMap } from "./utils";
import ModuleHelp from "./ModuleHelp";
import EditableValue from "./EditableValue";
import styles from "./Eurorack.module.css";

const CUTOFF_MAP = makeLogSliderMap(20, 20000, 1000);
const RESONANCE_MIN = 0.1;
const RESONANCE_MAX = 20;
const RESONANCE_STEPS = 1000;

const filterPalette: React.CSSProperties = {
  ["--module-bg" as string]: "linear-gradient(180deg, #2d4a3e 0%, #1e3329 100%)",
  ["--module-border" as string]: "rgba(120, 180, 150, 0.35)",
  ["--module-text" as string]: "#d4e8dc",
  ["--module-accent" as string]: "#8fd4a8",
  ["--module-track" as string]: "#0f1e18",
  ["--module-width" as string]: "calc(var(--module-u, 40px) * 6)",
};

function formatHz(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1)}k Hz`;
  return `${Math.round(hz)} Hz`;
}

export default function Filter() {
  const {
    filterCutoff,
    filterResonance,
    setFilterCutoff: storeSetCutoff,
    setFilterResonance: storeSetResonance,
  } = useSynthStore();

  const handleCutoffChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hz = CUTOFF_MAP.toHz(Number(e.target.value));
      storeSetCutoff(hz);
      initAudio().then(() => setFilterCutoff(hz));
    },
    [storeSetCutoff]
  );

  const handleResonanceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const ratio = Number(e.target.value) / RESONANCE_STEPS;
      const q = RESONANCE_MIN + (RESONANCE_MAX - RESONANCE_MIN) * ratio;
      storeSetResonance(q);
      initAudio().then(() => setFilterResonance(q));
    },
    [storeSetResonance]
  );

  const resonanceSliderValue = Math.round(
    ((filterResonance - RESONANCE_MIN) / (RESONANCE_MAX - RESONANCE_MIN)) * RESONANCE_STEPS
  );

  return (
    <div className={styles.module} style={filterPalette}>
      <ModuleHelp
        title="Filter"
        description="A 24 dB/octave low-pass filter that removes frequencies above the cutoff, shaping the tone's brightness."
        controls={[
          { name: "Cutoff", description: "Frequency above which the signal is attenuated. Lower values = darker, mellower tone." },
          { name: "Reso", description: "Resonance — emphasizes frequencies right at the cutoff, adding a squelchy peak as it's pushed up." },
        ]}
      />
      <h3 className={styles.moduleHeader}>Filter</h3>
      <div className={styles.moduleBody}>
        <div className={styles.moduleKnobRow}>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Cutoff</span>
            <input
              type="range"
              min={0}
              max={CUTOFF_MAP.steps}
              step={1}
              value={CUTOFF_MAP.fromHz(filterCutoff)}
              onChange={handleCutoffChange}
              className={styles.moduleSlider}
              aria-label="Filter cutoff"
            />
            <EditableValue
              value={filterCutoff}
              min={20}
              max={20000}
              precision={0}
              format={formatHz}
              onCommit={(v) => {
                storeSetCutoff(v);
                initAudio().then(() => setFilterCutoff(v));
              }}
              ariaLabel="Filter cutoff"
            />
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Reso</span>
            <input
              type="range"
              min={0}
              max={RESONANCE_STEPS}
              step={1}
              value={resonanceSliderValue}
              onChange={handleResonanceChange}
              className={styles.moduleSlider}
              aria-label="Filter resonance"
            />
            <EditableValue
              value={filterResonance}
              min={RESONANCE_MIN}
              max={RESONANCE_MAX}
              precision={1}
              onCommit={(v) => {
                storeSetResonance(v);
                initAudio().then(() => setFilterResonance(v));
              }}
              ariaLabel="Filter resonance"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
