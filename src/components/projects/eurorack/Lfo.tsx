import { useCallback } from "react";
import { useSynthStore } from "./store";
import { initAudio, setLfoTarget, setLfoRate, setLfoDepth } from "./audio";
import { LFO_TARGET_LABELS, type LfoTarget } from "./types";
import { makeLogSliderMap } from "./utils";
import ModuleHelp from "./ModuleHelp";
import styles from "./Eurorack.module.css";

const RATE_MAP = makeLogSliderMap(0.1, 20, 1000);
const DEPTH_STEPS = 1000;

const palette: React.CSSProperties = {
  ["--module-bg" as string]:
    "linear-gradient(180deg, #3a1f4a 0%, #241030 100%)",
  ["--module-border" as string]: "rgba(180, 120, 220, 0.35)",
  ["--module-text" as string]: "#e4c8ec",
  ["--module-accent" as string]: "#c48fff",
  ["--module-track" as string]: "#180a22",
  ["--module-width" as string]: "min(calc(var(--module-u, 40px) * 20), 95vw)",
  flexGrow: 1,
};

const TARGET_OPTIONS: LfoTarget[] = [
  "none",
  "pitch",
  "cutoff",
  "reso",
  "volume",
  "mix",
];

interface LfoSectionProps {
  index: 1 | 2 | 3 | 4;
  label: string;
  target: LfoTarget;
  rate: number;
  depth: number;
  onTargetChange: (target: LfoTarget) => void;
  onRateChange: (hz: number) => void;
  onDepthChange: (value: number) => void;
}

function LfoSection({
  index,
  label,
  target,
  rate,
  depth,
  onTargetChange,
  onRateChange,
  onDepthChange,
}: LfoSectionProps) {
  const handleTarget = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value as LfoTarget;
      onTargetChange(next);
      initAudio().then(() => setLfoTarget(index, next));
    },
    [index, onTargetChange]
  );

  const handleRate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hz = RATE_MAP.toHz(Number(e.target.value));
      onRateChange(hz);
      initAudio().then(() => setLfoRate(index, hz));
    },
    [index, onRateChange]
  );

  const handleDepth = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) / DEPTH_STEPS;
      onDepthChange(value);
      initAudio().then(() => setLfoDepth(index, value));
    },
    [index, onDepthChange]
  );

  return (
    <div className={styles.moduleSubSection}>
      <span className={styles.moduleSubHeader}>{label}</span>
      <select
        className={styles.moduleSelect}
        value={target}
        onChange={handleTarget}
        aria-label={`${label} destination`}
      >
        {TARGET_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {LFO_TARGET_LABELS[opt]}
          </option>
        ))}
      </select>
      <div className={styles.moduleKnobRow}>
        <div className={styles.moduleKnob}>
          <span className={styles.moduleKnobLabel}>Rate</span>
          <input
            type="range"
            min={0}
            max={RATE_MAP.steps}
            step={1}
            value={RATE_MAP.fromHz(rate)}
            onChange={handleRate}
            className={styles.moduleSlider}
            aria-label={`${label} rate`}
          />
          <span className={styles.moduleKnobValue}>{rate.toFixed(2)} Hz</span>
        </div>
        <div className={styles.moduleKnob}>
          <span className={styles.moduleKnobLabel}>Depth</span>
          <input
            type="range"
            min={0}
            max={DEPTH_STEPS}
            step={1}
            value={Math.round(depth * DEPTH_STEPS)}
            onChange={handleDepth}
            className={styles.moduleSlider}
            aria-label={`${label} depth`}
          />
          <span className={styles.moduleKnobValue}>{Math.round(depth * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

export default function Lfo() {
  const {
    lfo1Target,
    lfo1Rate,
    lfo1Depth,
    lfo2Target,
    lfo2Rate,
    lfo2Depth,
    lfo3Target,
    lfo3Rate,
    lfo3Depth,
    lfo4Target,
    lfo4Rate,
    lfo4Depth,
    setLfo1Target,
    setLfo1Rate,
    setLfo1Depth,
    setLfo2Target,
    setLfo2Rate,
    setLfo2Depth,
    setLfo3Target,
    setLfo3Rate,
    setLfo3Depth,
    setLfo4Target,
    setLfo4Rate,
    setLfo4Depth,
  } = useSynthStore();

  return (
    <div className={styles.module} style={palette}>
      <ModuleHelp
        title="Lfo"
        description="Four low-frequency oscillators that continuously modulate parameters on other modules (vibrato, wobble, tremolo, etc.)."
        controls={[
          { name: "Destination", description: "Which parameter this LFO modulates: pitch, filter cutoff, resonance, volume, or effects mix. 'None' disables it." },
          { name: "Rate", description: "Speed of the modulation, from slow drifts (0.1 Hz) to audio-rate wobble (20 Hz)." },
          { name: "Depth", description: "Modulation amount. 0% has no effect; 100% sweeps the destination through its full range." },
        ]}
      />
      <h3 className={styles.moduleHeader}>Lfo</h3>
      <div className={styles.moduleBody}>
        <div className={styles.lfoGrid}>
          <LfoSection
            index={1}
            label="Lfo 1"
            target={lfo1Target}
            rate={lfo1Rate}
            depth={lfo1Depth}
            onTargetChange={setLfo1Target}
            onRateChange={setLfo1Rate}
            onDepthChange={setLfo1Depth}
          />
          <LfoSection
            index={2}
            label="Lfo 2"
            target={lfo2Target}
            rate={lfo2Rate}
            depth={lfo2Depth}
            onTargetChange={setLfo2Target}
            onRateChange={setLfo2Rate}
            onDepthChange={setLfo2Depth}
          />
          <LfoSection
            index={3}
            label="Lfo 3"
            target={lfo3Target}
            rate={lfo3Rate}
            depth={lfo3Depth}
            onTargetChange={setLfo3Target}
            onRateChange={setLfo3Rate}
            onDepthChange={setLfo3Depth}
          />
          <LfoSection
            index={4}
            label="Lfo 4"
            target={lfo4Target}
            rate={lfo4Rate}
            depth={lfo4Depth}
            onTargetChange={setLfo4Target}
            onRateChange={setLfo4Rate}
            onDepthChange={setLfo4Depth}
          />
        </div>
      </div>
    </div>
  );
}
