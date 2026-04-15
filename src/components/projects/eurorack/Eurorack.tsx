import { useCallback, useEffect } from "react";
import { useSynthStore } from "./store";
import {
  initAudio,
  startOscillator,
  stopOscillator,
  setWaveType,
  setFrequency,
  setVolume,
  setTriggerMode,
  dispose,
} from "./audio";
import Oscilloscope from "./Oscilloscope";
import WaveSelector from "./WaveSelector";
import Mixer from "./Mixer";
import Filter from "./Filter";
import Crush from "./Crush";
import Space from "./Space";
import Swirl from "./Swirl";
import Lfo from "./Lfo";
import Adsr from "./Adsr";
import Sequencer from "./Sequencer";
import Random from "./Random";
import Keyboard from "./Keyboard";
import ModuleHelp from "./ModuleHelp";
import type { WaveType } from "./types";
import { makeLogSliderMap } from "./utils";
import styles from "./Eurorack.module.css";

const MIN_OCTAVE = 1;
const MAX_OCTAVE = 7;

const PITCH_MAP = makeLogSliderMap(55, 880, 1000);

const oscillatorPalette: React.CSSProperties = {
  ["--module-bg" as string]:
    "linear-gradient(180deg, #3e1c0e 0%, #2a1306 40%, #331709 60%, #2a1306 100%)",
  ["--module-border" as string]: "rgba(232, 120, 60, 0.35)",
  ["--module-text" as string]: "#e8c6a8",
  ["--module-accent" as string]: "#ff9040",
  ["--module-track" as string]: "#160803",
  ["--module-width" as string]: "min(calc(var(--module-u, 40px) * 20), 95vw)",
};

export default function Eurorack() {
  const {
    waveType,
    isPlaying,
    frequency,
    volume,
    triggerMode,
    octave,
    setWaveType: storeSetWave,
    setPlaying,
    setFrequency: storeSetFrequency,
    setVolume: storeSetVolume,
    setTriggerMode: storeSetTriggerMode,
    setOctave,
  } = useSynthStore();

  const handleWaveSelect = useCallback(
    async (type: WaveType) => {
      await initAudio();
      storeSetWave(type);

      if (type === "flat") {
        stopOscillator();
        setPlaying(false);
      } else {
        setWaveType(type);
        startOscillator();
        setPlaying(true);
      }
    },
    [storeSetWave, setPlaying],
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const linear = Number(e.target.value) / 100;
      storeSetVolume(linear);
      initAudio().then(() => setVolume(linear));
    },
    [storeSetVolume],
  );

  const handlePitchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hz = PITCH_MAP.toHz(Number(e.target.value));
      storeSetFrequency(hz);
      initAudio().then(() => setFrequency(hz));
    },
    [storeSetFrequency],
  );

  const handleModeToggle = useCallback(
    (next: boolean) => {
      if (next === triggerMode) return;
      storeSetTriggerMode(next);
      initAudio().then(() => setTriggerMode(next));
    },
    [triggerMode, storeSetTriggerMode],
  );

  const handleOctaveShift = useCallback(
    (delta: -1 | 1) => {
      const next = Math.min(MAX_OCTAVE, Math.max(MIN_OCTAVE, octave + delta));
      if (next !== octave) setOctave(next);
    },
    [octave, setOctave],
  );

  useEffect(() => {
    return () => {
      dispose();
    };
  }, []);

  return (
    <div className={`${styles.container} ${triggerMode ? styles.containerKeyboardOpen : ""}`}>
      <div className={styles.panel}>
        <div className={styles.modulesRow}>
          <div className={styles.moduleColumn}>
            <div className={styles.module} style={oscillatorPalette}>
              <ModuleHelp
                title="Oscillator"
                description="The sound source. Generates a raw waveform, runs it through an amplitude envelope, and feeds the rest of the signal chain."
                controls={[
                  { name: "Vol", description: "Master output volume." },
                  { name: "Scope", description: "Live waveform display of the signal being sent to the speakers." },
                  { name: "Drone / Trigger", description: "Drone holds a constant tone. Trigger opens a keyboard so notes only play while keys are held." },
                  { name: "Pitch", description: "In drone mode, sets the oscillator frequency in Hz." },
                  { name: "Oct", description: "In trigger mode, shifts the keyboard up or down by an octave." },
                  { name: "Wave", description: "Chooses the waveform shape (sine, square, saw, triangle, or off)." },
                ]}
              />
              <h3 className={styles.moduleHeader}>Oscillator</h3>
              <div className={styles.moduleBody}>
                <div className={styles.scopeRow}>
                  <div className={styles.volumeControl}>
                    <span className={styles.volumeLabel}>Vol</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(volume * 100)}
                      onChange={handleVolumeChange}
                      className={styles.volumeSlider}
                      aria-label="Volume"
                    />
                    <span className={styles.volumeValue}>
                      {Math.round(volume * 100)}
                    </span>
                  </div>
                  <div className={styles.scopeWrapper}>
                    <Oscilloscope isPlaying={isPlaying} />
                  </div>
                </div>
                <div
                  className={styles.modeToggle}
                  data-mode={triggerMode ? "trig" : "drone"}
                  role="group"
                  aria-label="Oscillator mode"
                >
                  <span className={styles.modeToggleThumb} aria-hidden="true" />
                  <button
                    type="button"
                    className={styles.modeToggleLabel}
                    onClick={() => handleModeToggle(false)}
                    aria-pressed={!triggerMode}
                  >
                    Drone
                  </button>
                  <button
                    type="button"
                    className={styles.modeToggleLabel}
                    onClick={() => handleModeToggle(true)}
                    aria-pressed={triggerMode}
                  >
                    Trigger
                  </button>
                </div>
                {triggerMode ? (
                  <div className={styles.octaveControl}>
                    <div className={styles.pitchLabelRow}>
                      <span className={styles.pitchLabel}>Oct</span>
                      <span className={styles.pitchValue}>{octave}</span>
                    </div>
                    <div className={styles.octaveButtons}>
                      <button
                        type="button"
                        className={styles.octaveButton}
                        onClick={() => handleOctaveShift(-1)}
                        disabled={octave <= MIN_OCTAVE}
                        aria-label="Octave down"
                      >
                        ◄
                      </button>
                      <span className={styles.octaveReadout}>{octave}</span>
                      <button
                        type="button"
                        className={styles.octaveButton}
                        onClick={() => handleOctaveShift(1)}
                        disabled={octave >= MAX_OCTAVE}
                        aria-label="Octave up"
                      >
                        ►
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.pitchControl}>
                    <div className={styles.pitchLabelRow}>
                      <span className={styles.pitchLabel}>Pitch</span>
                      <span className={styles.pitchValue}>
                        {Math.round(frequency)} Hz
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={PITCH_MAP.steps}
                      step={1}
                      value={PITCH_MAP.fromHz(frequency)}
                      onChange={handlePitchChange}
                      className={styles.pitchSlider}
                      aria-label="Pitch"
                    />
                  </div>
                )}
                <WaveSelector activeWave={waveType} onSelect={handleWaveSelect} />
              </div>
            </div>
            <Sequencer />
            <Lfo />
          </div>
          <div className={styles.moduleColumn}>
            <Mixer />
            <Filter />
            <Crush />
            <Random />
          </div>
          <div className={styles.moduleColumn}>
            <Space />
            <Adsr />
            <Swirl />
          </div>
        </div>
        <Keyboard />
      </div>
    </div>
  );
}
