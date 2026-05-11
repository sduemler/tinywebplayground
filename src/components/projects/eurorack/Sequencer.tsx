import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSynthStore } from "./store";
import {
  initAudio,
  startSequencer,
  stopSequencer,
  setSequencerBpm,
  updateSequencerOpts,
} from "./audio";
import { NOTE_NAMES } from "./notes";
import ModuleHelp from "./ModuleHelp";
import EditableValue from "./EditableValue";
import type { SeqStep } from "./types";
import styles from "./Eurorack.module.css";

const BPM_MIN = 40;
const BPM_MAX = 240;
const GATE_STEPS = 1000;
const GATE_MIN = 0.05;
const GATE_MAX = 1;
const MIN_OCT = 1;
const MAX_OCT = 7;

const palette: React.CSSProperties = {
  ["--module-bg" as string]:
    "linear-gradient(180deg, #3a2a0a 0%, #1f1605 100%)",
  ["--module-border" as string]: "rgba(220, 180, 80, 0.3)",
  ["--module-text" as string]: "#e8d8a8",
  ["--module-accent" as string]: "#f0c040",
  ["--module-track" as string]: "#120a02",
  ["--module-width" as string]: "min(calc(var(--module-u, 40px) * 20), 95vw)",
};

const OCTAVES = [1, 2, 3, 4, 5, 6, 7] as const;

function NotePicker({
  step,
  onPick,
  onClose,
}: {
  step: SeqStep;
  onPick: (note: string, octave: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return (
    <div ref={ref} className={styles.notePicker}>
      <div className={styles.notePickerOctaves}>
        {OCTAVES.map((o) => (
          <button
            key={o}
            type="button"
            className={`${styles.notePickerOct} ${o === step.octave ? styles.notePickerOctActive : ""}`}
            onClick={() => onPick(step.note, o)}
          >
            {o}
          </button>
        ))}
      </div>
      <div className={styles.notePickerNotes}>
        {NOTE_NAMES.map((n) => (
          <button
            key={n}
            type="button"
            className={`${styles.notePickerNote} ${n === step.note ? styles.notePickerNoteActive : ""} ${n.includes("#") ? styles.notePickerNoteSharp : ""}`}
            onClick={() => onPick(n, step.octave)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Sequencer() {
  const {
    seqPlaying,
    seqBpm,
    seqLoopLength,
    seqGate,
    seqSteps,
    seqCurrentStep,
    setSeqPlaying: storeSetPlaying,
    setSeqBpm: storeSetBpm,
    setSeqLoopLength: storeSetLoopLength,
    setSeqGate: storeSetGate,
    setSeqStep: storeSetStep,
    setSeqCurrentStep: storeSetCurrentStep,
  } = useSynthStore();

  // Push live edits into the running sequencer without restarting.
  useEffect(() => {
    if (!seqPlaying) return;
    updateSequencerOpts({
      loopLength: seqLoopLength,
      gate: seqGate,
      steps: seqSteps,
    });
  }, [seqPlaying, seqLoopLength, seqGate, seqSteps]);

  useEffect(() => {
    if (!seqPlaying) return;
    setSequencerBpm(seqBpm);
  }, [seqPlaying, seqBpm]);

  useEffect(() => {
    return () => {
      stopSequencer();
    };
  }, []);

  const handlePlay = useCallback(async () => {
    if (seqPlaying) {
      stopSequencer();
      storeSetPlaying(false);
      storeSetCurrentStep(-1);
      return;
    }
    await initAudio();
    startSequencer({
      bpm: seqBpm,
      loopLength: seqLoopLength,
      gate: seqGate,
      steps: seqSteps,
      onTick: (i) => storeSetCurrentStep(i),
    });
    storeSetPlaying(true);
  }, [
    seqPlaying,
    seqBpm,
    seqLoopLength,
    seqGate,
    seqSteps,
    storeSetPlaying,
    storeSetCurrentStep,
  ]);

  const handleBpm = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      storeSetBpm(Number(e.target.value));
    },
    [storeSetBpm],
  );

  const handleGate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = GATE_MIN + (Number(e.target.value) / GATE_STEPS) * (GATE_MAX - GATE_MIN);
      storeSetGate(v);
    },
    [storeSetGate],
  );

  const handleToggleLength = useCallback(
    (len: 8 | 16) => {
      storeSetLoopLength(len);
    },
    [storeSetLoopLength],
  );

  const [pickerOpen, setPickerOpen] = useState<number | null>(null);

  const handleToggleStep = useCallback(
    (index: number) => {
      storeSetStep(index, { on: !seqSteps[index].on });
    },
    [seqSteps, storeSetStep],
  );

  const handlePickNote = useCallback(
    (index: number, note: string, octave: number) => {
      storeSetStep(index, { note, octave });
      setPickerOpen(null);
    },
    [storeSetStep],
  );

  const rows = useMemo(() => {
    return [seqSteps.slice(0, 8), seqSteps.slice(8, 16)];
  }, [seqSteps]);

  return (
    <div className={styles.module} style={palette}>
      <ModuleHelp
        title="Sequencer"
        description="A 16-step pattern sequencer. Forces Trigger mode while running so each step fires through the envelope."
        controls={[
          { name: "Play/Stop", description: "Starts and stops playback." },
          { name: "BPM", description: "Tempo in beats per minute, 40–240." },
          { name: "Length", description: "Play the first 8 or all 16 steps." },
          {
            name: "Gate",
            description:
              "How long each note sustains as a fraction of one step.",
          },
          {
            name: "Steps",
            description:
              "Click the note to pick a pitch; the power button toggles the step on/off.",
          },
        ]}
      />
      <h3 className={styles.moduleHeader}>Sequencer</h3>
      <div className={styles.moduleBody}>
        <div className={styles.seqControlRow}>
          <button
            type="button"
            className={`${styles.autoPlayButton} ${
              seqPlaying ? styles.autoPlayButtonActive : ""
            }`}
            onClick={handlePlay}
            aria-pressed={seqPlaying}
          >
            {seqPlaying ? "Stop" : "Play"}
          </button>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>BPM</span>
            <input
              type="range"
              min={BPM_MIN}
              max={BPM_MAX}
              step={1}
              value={seqBpm}
              onChange={handleBpm}
              className={styles.moduleSlider}
              aria-label="Sequencer BPM"
            />
            <EditableValue
              value={seqBpm}
              min={BPM_MIN}
              max={BPM_MAX}
              precision={0}
              onCommit={(v) => storeSetBpm(v)}
              ariaLabel="Sequencer BPM"
            />
          </div>
          <div className={styles.moduleKnob}>
            <span className={styles.moduleKnobLabel}>Gate</span>
            <input
              type="range"
              min={0}
              max={GATE_STEPS}
              step={1}
              value={Math.round(
                ((seqGate - GATE_MIN) / (GATE_MAX - GATE_MIN)) * GATE_STEPS,
              )}
              onChange={handleGate}
              className={styles.moduleSlider}
              aria-label="Sequencer gate"
            />
            <EditableValue
              value={seqGate * 100}
              min={GATE_MIN * 100}
              max={GATE_MAX * 100}
              precision={0}
              unit="%"
              onCommit={(v) => storeSetGate(v / 100)}
              ariaLabel="Sequencer gate"
            />
          </div>
          <div className={styles.seqLengthGroup} role="group" aria-label="Loop length">
            <span className={styles.moduleKnobLabel}>Length</span>
            <div className={styles.seqLengthButtons}>
              <button
                type="button"
                className={`${styles.seqLengthButton} ${
                  seqLoopLength === 8 ? styles.seqLengthButtonActive : ""
                }`}
                onClick={() => handleToggleLength(8)}
                aria-pressed={seqLoopLength === 8}
              >
                8
              </button>
              <button
                type="button"
                className={`${styles.seqLengthButton} ${
                  seqLoopLength === 16 ? styles.seqLengthButtonActive : ""
                }`}
                onClick={() => handleToggleLength(16)}
                aria-pressed={seqLoopLength === 16}
              >
                16
              </button>
            </div>
          </div>
        </div>
        <div className={styles.seqGrid}>
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className={styles.seqRow}>
              {row.map((step, colIdx) => {
                const index = rowIdx * 8 + colIdx;
                const isActive = seqPlaying && seqCurrentStep === index;
                const beyondLoop = index >= seqLoopLength;
                return (
                  <div
                    key={index}
                    className={`${styles.seqCell} ${
                      step.on ? styles.seqCellOn : ""
                    } ${isActive ? styles.seqCellActive : ""} ${
                      beyondLoop ? styles.seqCellDim : ""
                    }`}
                  >
                    <button
                      type="button"
                      className={styles.seqCellButton}
                      onMouseDown={(e) => { if (pickerOpen === index) e.stopPropagation(); }}
                      onClick={() => setPickerOpen(pickerOpen === index ? null : index)}
                      aria-label={`Step ${index + 1} ${step.note}${step.octave}`}
                    >
                      {step.note}
                      {step.octave}
                    </button>
                    {pickerOpen === index && (
                      <NotePicker
                        step={step}
                        onPick={(note, octave) => handlePickNote(index, note, octave)}
                        onClose={() => setPickerOpen(null)}
                      />
                    )}
                    <button
                      type="button"
                      className={`${styles.seqToggle} ${step.on ? styles.seqToggleOn : ""}`}
                      onClick={() => handleToggleStep(index)}
                      aria-pressed={step.on}
                      aria-label={`Step ${index + 1} ${step.on ? "disable" : "enable"}`}
                    >
                      <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
                        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="8" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
