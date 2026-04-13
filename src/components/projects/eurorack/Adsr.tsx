import { useCallback } from "react";
import { useSynthStore } from "./store";
import {
  initAudio,
  setEnvAttack,
  setEnvDecay,
  setEnvSustain,
  setEnvRelease,
} from "./audio";
import { makeLogSliderMap } from "./utils";
import styles from "./Eurorack.module.css";

const ATTACK_MAP = makeLogSliderMap(0.001, 2, 1000);
const DECAY_MAP = makeLogSliderMap(0.001, 2, 1000);
const RELEASE_MAP = makeLogSliderMap(0.001, 5, 1000);
const SUSTAIN_STEPS = 1000;

const palette: React.CSSProperties = {
  ["--module-bg" as string]:
    "linear-gradient(180deg, #2a3140 0%, #161a22 100%)",
  ["--module-border" as string]: "rgba(150, 170, 200, 0.3)",
  ["--module-text" as string]: "#d0d8e4",
  ["--module-accent" as string]: "#f0b060",
  ["--module-track" as string]: "#0a0d14",
  ["--module-width" as string]: "calc(var(--module-u, 40px) * 8)",
};

function formatSeconds(seconds: number): string {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  return `${seconds.toFixed(2)}s`;
}

export default function Adsr() {
  const {
    envAttack,
    envDecay,
    envSustain,
    envRelease,
    setEnvAttack: storeSetAttack,
    setEnvDecay: storeSetDecay,
    setEnvSustain: storeSetSustain,
    setEnvRelease: storeSetRelease,
  } = useSynthStore();

  const handleAttack = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const seconds = ATTACK_MAP.toHz(Number(e.target.value));
      storeSetAttack(seconds);
      initAudio().then(() => setEnvAttack(seconds));
    },
    [storeSetAttack]
  );

  const handleDecay = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const seconds = DECAY_MAP.toHz(Number(e.target.value));
      storeSetDecay(seconds);
      initAudio().then(() => setEnvDecay(seconds));
    },
    [storeSetDecay]
  );

  const handleSustain = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) / SUSTAIN_STEPS;
      storeSetSustain(value);
      initAudio().then(() => setEnvSustain(value));
    },
    [storeSetSustain]
  );

  const handleRelease = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const seconds = RELEASE_MAP.toHz(Number(e.target.value));
      storeSetRelease(seconds);
      initAudio().then(() => setEnvRelease(seconds));
    },
    [storeSetRelease]
  );

  return (
    <div className={styles.module} style={palette}>
      <h3 className={styles.moduleHeader}>Adsr</h3>
      <div className={styles.moduleBody}>
        <div className={styles.moduleKnobRow}>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Atk</span>
            <input
              type="range"
              min={0}
              max={ATTACK_MAP.steps}
              step={1}
              value={ATTACK_MAP.fromHz(envAttack)}
              onChange={handleAttack}
              className={styles.moduleSlider}
              aria-label="Envelope attack"
            />
            <span className={styles.moduleKnobValue}>{formatSeconds(envAttack)}</span>
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Dec</span>
            <input
              type="range"
              min={0}
              max={DECAY_MAP.steps}
              step={1}
              value={DECAY_MAP.fromHz(envDecay)}
              onChange={handleDecay}
              className={styles.moduleSlider}
              aria-label="Envelope decay"
            />
            <span className={styles.moduleKnobValue}>{formatSeconds(envDecay)}</span>
          </div>
        </div>
        <div className={styles.moduleKnobRow}>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Sus</span>
            <input
              type="range"
              min={0}
              max={SUSTAIN_STEPS}
              step={1}
              value={Math.round(envSustain * SUSTAIN_STEPS)}
              onChange={handleSustain}
              className={styles.moduleSlider}
              aria-label="Envelope sustain"
            />
            <span className={styles.moduleKnobValue}>{Math.round(envSustain * 100)}%</span>
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Rel</span>
            <input
              type="range"
              min={0}
              max={RELEASE_MAP.steps}
              step={1}
              value={RELEASE_MAP.fromHz(envRelease)}
              onChange={handleRelease}
              className={styles.moduleSlider}
              aria-label="Envelope release"
            />
            <span className={styles.moduleKnobValue}>{formatSeconds(envRelease)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
