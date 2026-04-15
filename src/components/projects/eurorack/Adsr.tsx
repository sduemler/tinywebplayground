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
import ModuleHelp from "./ModuleHelp";
import EditableValue from "./EditableValue";
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
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  return `${seconds.toFixed(2)} s`;
}

const formatMs = (ms: number) => formatSeconds(ms / 1000);

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
      <ModuleHelp
        title="Adsr"
        description="Amplitude envelope applied to each note in Trigger mode. Shapes how loud the note is over time, from keypress to release."
        controls={[
          { name: "Atk", description: "Attack — time for the note to ramp from silence up to full volume after a key is pressed." },
          { name: "Dec", description: "Decay — time it takes to drop from full volume down to the sustain level after the attack." },
          { name: "Sus", description: "Sustain level — volume held while a key remains pressed (after attack + decay)." },
          { name: "Rel", description: "Release — time for the note to fade to silence after the key is released." },
        ]}
      />
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
            <EditableValue
              value={envAttack * 1000}
              min={1}
              max={2000}
              precision={0}
              format={formatMs}
              onCommit={(v) => {
                const seconds = v / 1000;
                storeSetAttack(seconds);
                initAudio().then(() => setEnvAttack(seconds));
              }}
              ariaLabel="Envelope attack"
            />
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
            <EditableValue
              value={envDecay * 1000}
              min={1}
              max={2000}
              precision={0}
              format={formatMs}
              onCommit={(v) => {
                const seconds = v / 1000;
                storeSetDecay(seconds);
                initAudio().then(() => setEnvDecay(seconds));
              }}
              ariaLabel="Envelope decay"
            />
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
            <EditableValue
              value={envSustain * 100}
              min={0}
              max={100}
              precision={0}
              unit="%"
              onCommit={(v) => {
                const linear = v / 100;
                storeSetSustain(linear);
                initAudio().then(() => setEnvSustain(linear));
              }}
              ariaLabel="Envelope sustain"
            />
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
            <EditableValue
              value={envRelease * 1000}
              min={1}
              max={5000}
              precision={0}
              format={formatMs}
              onCommit={(v) => {
                const seconds = v / 1000;
                storeSetRelease(seconds);
                initAudio().then(() => setEnvRelease(seconds));
              }}
              ariaLabel="Envelope release"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
