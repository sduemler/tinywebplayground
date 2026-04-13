import { useCallback } from "react";
import { useSynthStore } from "./store";
import { initAudio, setFilterCutoff, setFilterResonance } from "./audio";
import { makeLogSliderMap } from "./utils";
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
  ["--module-width" as string]: "calc(var(--module-u, 40px) * 5)",
};

function formatHz(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1)}k`;
  return `${Math.round(hz)}`;
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
            <span className={styles.moduleKnobValue}>{formatHz(filterCutoff)} Hz</span>
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
            <span className={styles.moduleKnobValue}>{filterResonance.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
