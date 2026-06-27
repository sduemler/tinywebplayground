import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PromptStat, TypingPrompt } from "./types";
import { computeAccuracy, computeWpm, countCorrect } from "./utils";
import styles from "./TypingTerror.module.css";

interface Props {
  prompt: TypingPrompt;
  index: number; // 0-based prompt position
  total: number; // total prompts in the set
  onComplete: (stat: PromptStat) => void;
}

export default function TypingTest({ prompt, index, total, onComplete }: Props) {
  const target = prompt.text;
  const [typed, setTyped] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [tick, setTick] = useState(0); // drives the live timer/WPM
  const [focused, setFocused] = useState(false);
  const [done, setDone] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const keystrokesRef = useRef(0);
  const errorsRef = useRef(0);
  const statRef = useRef<PromptStat | null>(null);

  // Tier 3 spreads its letters apart, so we freeze the line breaks at their
  // starting positions and render each line in a non-wrapping block. This keeps
  // every line on its own line as the spacing grows (no reflow mid-passage).
  const lockLines = prompt.tier === 3;
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [lines, setLines] = useState<number[][] | null>(null);

  // Live ticking timer while typing is in progress.
  useEffect(() => {
    if (startTime === null || done) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, [startTime, done]);

  // Focus the hidden input on mount / when the prompt changes.
  useEffect(() => {
    inputRef.current?.focus();
  }, [prompt]);

  // Move focus to the continue button once a prompt is finished.
  useEffect(() => {
    if (done) continueRef.current?.focus();
  }, [done]);

  // Measure the natural line breaks once, then lock them in (tier 3 only).
  useLayoutEffect(() => {
    if (!lockLines || lines !== null) return;
    const spans = spansRef.current;
    if (!spans.length) return;
    const groups: number[][] = [];
    let cur: number[] = [];
    let lastTop: number | null = null;
    for (let i = 0; i < target.length; i++) {
      const el = spans[i];
      if (!el) continue;
      const top = el.offsetTop;
      if (lastTop === null || top === lastTop) cur.push(i);
      else {
        groups.push(cur);
        cur = [i];
      }
      lastTop = top;
    }
    if (cur.length) groups.push(cur);
    if (groups.length) setLines(groups);
  }, [lockLines, lines, target]);

  function reset() {
    setTyped("");
    setStartTime(null);
    setDone(false);
    keystrokesRef.current = 0;
    errorsRef.current = 0;
    statRef.current = null;
    inputRef.current?.focus();
  }

  function finish(finalTyped: string, started: number) {
    const ms = Math.max(1, Date.now() - started);
    const correctChars = countCorrect(finalTyped, target);
    const stat: PromptStat = {
      tier: prompt.tier,
      wpm: computeWpm(correctChars, ms),
      accuracy: computeAccuracy(
        keystrokesRef.current - errorsRef.current,
        keystrokesRef.current
      ),
      ms,
      correctChars,
      totalKeystrokes: keystrokesRef.current,
      errors: errorsRef.current,
      chars: target.length,
    };
    statRef.current = stat;
    setDone(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (done) return;
    // Cap to the target length; ignore anything past the end.
    const value = e.target.value.slice(0, target.length);
    let started = startTime;
    if (started === null && value.length > 0) {
      started = Date.now();
      setStartTime(started);
    }
    // Count newly added characters toward keystrokes / errors.
    if (value.length > typed.length) {
      for (let i = typed.length; i < value.length; i++) {
        keystrokesRef.current += 1;
        if (value[i] !== target[i]) errorsRef.current += 1;
      }
    }
    setTyped(value);
    if (value.length === target.length && started !== null) {
      finish(value, started);
    }
  }

  // Live stats (recomputed on each keystroke and timer tick).
  const live = useMemo(() => {
    const correct = countCorrect(typed, target);
    const ms = startTime === null ? 0 : Date.now() - startTime;
    return {
      wpm: computeWpm(correct, ms),
      accuracy: typed.length === 0 ? 100 : computeAccuracy(correct, typed.length),
      seconds: ms / 1000,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, tick, startTime, target]);

  const progress = target.length === 0 ? 0 : typed.length / target.length;
  const stat = statRef.current;

  // While measuring (tier 3, before line breaks are locked) each char span
  // collects a ref so we can read its laid-out line position.
  const measuring = lockLines && lines === null;
  const renderChar = (i: number) => {
    const ch = target[i];
    let cls = styles.pending;
    if (i < typed.length) {
      cls = typed[i] === ch ? styles.correct : styles.incorrect;
    } else if (i === typed.length && !done) {
      cls = styles.caret;
    }
    // Render a visible marker when a space is typed incorrectly.
    const display = ch === " " && cls === styles.incorrect ? "·" : ch;
    return (
      <span
        key={i}
        ref={
          measuring
            ? (el) => {
                spansRef.current[i] = el;
              }
            : undefined
        }
        className={cls}
      >
        {display}
      </span>
    );
  };

  return (
    <div
      className={styles.test}
      data-tier={prompt.tier}
      data-done={done ? "true" : undefined}
      style={{ "--progress": progress.toFixed(3) } as React.CSSProperties}
      onClick={() => !done && inputRef.current?.focus()}
    >
      <div className={styles.testMeta}>
        <span className={styles.passageCount}>
          Passage {index + 1} <span aria-hidden="true">/</span> {total}
        </span>
        <div className={styles.liveStats} aria-hidden="true">
          <span>{done ? stat?.wpm ?? 0 : live.wpm} wpm</span>
          <span>{done ? stat?.accuracy ?? 100 : live.accuracy}%</span>
          <span>{(done ? (stat?.ms ?? 0) / 1000 : live.seconds).toFixed(0)}s</span>
        </div>
      </div>

      <p className={styles.prompt}>
        {lockLines && lines
          ? lines.map((group, li) => (
              <span key={li} className={styles.line}>
                {group.map((i) => renderChar(i))}
              </span>
            ))
          : target.split("").map((_, i) => renderChar(i))}
      </p>

      {/* Hidden capture field — keeps the soft keyboard available on mobile. */}
      <input
        ref={inputRef}
        className={styles.hiddenInput}
        value={typed}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={target.length}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        aria-label={`Type passage ${index + 1} of ${total}`}
        disabled={done}
      />

      {!focused && !done && (
        <button
          type="button"
          className={styles.focusHint}
          onClick={() => inputRef.current?.focus()}
        >
          Tap to type
        </button>
      )}

      <div className={styles.testControls}>
        {!done ? (
          <button type="button" className={styles.ghostButton} onClick={reset}>
            Restart passage
          </button>
        ) : (
          <button
            ref={continueRef}
            type="button"
            className={styles.primaryButton}
            onClick={() => stat && onComplete(stat)}
          >
            {index + 1 < total ? "Continue →" : "See your results →"}
          </button>
        )}
      </div>
    </div>
  );
}
