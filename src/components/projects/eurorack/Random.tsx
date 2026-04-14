import { useCallback, useEffect, useRef } from "react";
import { useSynthStore } from "./store";
import {
  initAudio,
  startRandom,
  stopRandom,
  updateRandomOpts,
} from "./audio";
import { makeLogSliderMap } from "./utils";
import ModuleHelp from "./ModuleHelp";
import styles from "./Eurorack.module.css";

const PITCH_MAP = makeLogSliderMap(40, 4000, 1000);
const RATE_MIN_MS = 50;
const RATE_MAX_MS = 2000;
const GATE_MIN_MS = 10;
const GATE_MAX_MS = 1000;
const STEPS = 1000;

const palette: React.CSSProperties = {
  ["--module-bg" as string]:
    "linear-gradient(180deg, #3a0a2a 0%, #1f051a 100%)",
  ["--module-border" as string]: "rgba(220, 120, 180, 0.3)",
  ["--module-text" as string]: "#e8c0d8",
  ["--module-accent" as string]: "#f060b0",
  ["--module-track" as string]: "#120215",
  ["--module-width" as string]: "calc(var(--module-u, 40px) * 6)",
  flexGrow: 1,
};

function linearFromSteps(v: number, min: number, max: number): number {
  return min + (v / STEPS) * (max - min);
}

function linearToSteps(v: number, min: number, max: number): number {
  return Math.round(((v - min) / (max - min)) * STEPS);
}

export default function Random() {
  const {
    randPlaying,
    randHzMin,
    randHzMax,
    randRateMsMin,
    randRateMsMax,
    randGateMs,
    setRandPlaying: storeSetPlaying,
    setRandHzMin: storeSetHzMin,
    setRandHzMax: storeSetHzMax,
    setRandRateMsMin: storeSetRateMin,
    setRandRateMsMax: storeSetRateMax,
    setRandGateMs: storeSetGate,
  } = useSynthStore();

  // Keep a ref to the latest state so live edits during playback can
  // push the whole opts object without stale-closure bugs.
  const stateRef = useRef({
    randHzMin,
    randHzMax,
    randRateMsMin,
    randRateMsMax,
    randGateMs,
  });
  stateRef.current = {
    randHzMin,
    randHzMax,
    randRateMsMin,
    randRateMsMax,
    randGateMs,
  };

  useEffect(() => {
    if (randPlaying) {
      updateRandomOpts({
        hzMin: randHzMin,
        hzMax: randHzMax,
        rateMsMin: randRateMsMin,
        rateMsMax: randRateMsMax,
        gateMs: randGateMs,
      });
    }
  }, [randPlaying, randHzMin, randHzMax, randRateMsMin, randRateMsMax, randGateMs]);

  // Stop when unmounting.
  useEffect(() => {
    return () => {
      stopRandom();
    };
  }, []);

  const handlePlay = useCallback(async () => {
    if (randPlaying) {
      stopRandom();
      storeSetPlaying(false);
      return;
    }
    await initAudio();
    startRandom({
      hzMin: stateRef.current.randHzMin,
      hzMax: stateRef.current.randHzMax,
      rateMsMin: stateRef.current.randRateMsMin,
      rateMsMax: stateRef.current.randRateMsMax,
      gateMs: stateRef.current.randGateMs,
    });
    storeSetPlaying(true);
  }, [randPlaying, storeSetPlaying]);

  const handleHzMin = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hz = PITCH_MAP.toHz(Number(e.target.value));
      storeSetHzMin(hz);
      if (hz > randHzMax) storeSetHzMax(hz);
    },
    [randHzMax, storeSetHzMin, storeSetHzMax],
  );

  const handleHzMax = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hz = PITCH_MAP.toHz(Number(e.target.value));
      storeSetHzMax(hz);
      if (hz < randHzMin) storeSetHzMin(hz);
    },
    [randHzMin, storeSetHzMin, storeSetHzMax],
  );

  const handleRateMin = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const ms = linearFromSteps(Number(e.target.value), RATE_MIN_MS, RATE_MAX_MS);
      storeSetRateMin(ms);
      if (ms > randRateMsMax) storeSetRateMax(ms);
    },
    [randRateMsMax, storeSetRateMin, storeSetRateMax],
  );

  const handleRateMax = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const ms = linearFromSteps(Number(e.target.value), RATE_MIN_MS, RATE_MAX_MS);
      storeSetRateMax(ms);
      if (ms < randRateMsMin) storeSetRateMin(ms);
    },
    [randRateMsMin, storeSetRateMin, storeSetRateMax],
  );

  const handleGate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const ms = linearFromSteps(Number(e.target.value), GATE_MIN_MS, GATE_MAX_MS);
      storeSetGate(ms);
    },
    [storeSetGate],
  );

  return (
    <div className={styles.module} style={palette}>
      <ModuleHelp
        title="Random"
        description="Autonomous note generator. Fires random pitches within your range at randomized intervals. Good for generative pads or stress-testing the signal chain."
        controls={[
          { name: "Play/Stop", description: "Starts and stops playback." },
          {
            name: "Pitch Min/Max",
            description: "Lower and upper bounds of the pitch range, log-scaled.",
          },
          {
            name: "Rate Min/Max",
            description:
              "Lower and upper bounds for the time between notes, in ms.",
          },
          {
            name: "Gate",
            description: "How long each note sustains, in ms.",
          },
        ]}
      />
      <h3 className={styles.moduleHeader}>Random</h3>
      <div className={styles.moduleBody}>
        <button
          type="button"
          className={`${styles.autoPlayButton} ${
            randPlaying ? styles.autoPlayButtonActive : ""
          }`}
          onClick={handlePlay}
          aria-pressed={randPlaying}
        >
          {randPlaying ? "Stop" : "Play"}
        </button>
        <div className={styles.rangePair}>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Pitch ↓</span>
            <input
              type="range"
              min={0}
              max={PITCH_MAP.steps}
              step={1}
              value={PITCH_MAP.fromHz(randHzMin)}
              onChange={handleHzMin}
              className={styles.moduleSlider}
              aria-label="Random pitch min"
            />
            <span className={styles.moduleKnobValue}>
              {Math.round(randHzMin)}
            </span>
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Pitch ↑</span>
            <input
              type="range"
              min={0}
              max={PITCH_MAP.steps}
              step={1}
              value={PITCH_MAP.fromHz(randHzMax)}
              onChange={handleHzMax}
              className={styles.moduleSlider}
              aria-label="Random pitch max"
            />
            <span className={styles.moduleKnobValue}>
              {Math.round(randHzMax)}
            </span>
          </div>
        </div>
        <div className={styles.rangePair}>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Rate ↓</span>
            <input
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={linearToSteps(randRateMsMin, RATE_MIN_MS, RATE_MAX_MS)}
              onChange={handleRateMin}
              className={styles.moduleSlider}
              aria-label="Random rate min"
            />
            <span className={styles.moduleKnobValue}>
              {Math.round(randRateMsMin)}
            </span>
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Rate ↑</span>
            <input
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={linearToSteps(randRateMsMax, RATE_MIN_MS, RATE_MAX_MS)}
              onChange={handleRateMax}
              className={styles.moduleSlider}
              aria-label="Random rate max"
            />
            <span className={styles.moduleKnobValue}>
              {Math.round(randRateMsMax)}
            </span>
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Gate</span>
            <input
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={linearToSteps(randGateMs, GATE_MIN_MS, GATE_MAX_MS)}
              onChange={handleGate}
              className={styles.moduleSlider}
              aria-label="Random gate"
            />
            <span className={styles.moduleKnobValue}>
              {Math.round(randGateMs)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
