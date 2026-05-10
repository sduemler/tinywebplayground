import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./CluePanel.module.css";
import { useCrosswordStore } from "./store";
import type { EntryData } from "./types";

interface Props {
  entry: EntryData;
  prefilled: (string | null)[];
  onSubmit?: (
    entryId: string,
    answer: string,
  ) => Promise<{ correct: boolean }>;
}

export default function CluePanel({ entry, prefilled, onSubmit }: Props) {
  const [userLetters, setUserLetters] = useState<string[]>([]);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [isWrong, setIsWrong] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const cooldownUntil = useCrosswordStore((s) => s.cooldownUntil);
  const setCooldown = useCrosswordStore((s) => s.setCooldown);

  const isCoolingDown = cooldownUntil ? Date.now() < cooldownUntil : false;
  const disabled = isCoolingDown || submitting;

  const findNextEmpty = useCallback(
    (from: number): number => {
      for (let i = from; i < entry.length; i++) {
        if (prefilled[i] === null) return i;
      }
      for (let i = 0; i < from; i++) {
        if (prefilled[i] === null) return i;
      }
      return from;
    },
    [entry.length, prefilled],
  );

  const findPrevEmpty = useCallback(
    (from: number): number => {
      for (let i = from; i >= 0; i--) {
        if (prefilled[i] === null) return i;
      }
      return from;
    },
    [prefilled],
  );

  useEffect(() => {
    setUserLetters(new Array(entry.length).fill(""));
    setIsWrong(false);
    setCursorIndex(findNextEmpty(0));
    hiddenInputRef.current?.focus();
  }, [entry.id, entry.length, findNextEmpty]);

  const markWrong = () => {
    setIsWrong(true);
    setCooldown(Date.now() + 3000);
    setTimeout(() => {
      setIsWrong(false);
      setUserLetters(new Array(entry.length).fill(""));
      setCursorIndex(findNextEmpty(0));
    }, 3000);
  };

  const allFilled = prefilled.every(
    (p, i) => p !== null || userLetters[i],
  );

  const handleSubmit = async () => {
    if (!allFilled || disabled) return;
    const answer = prefilled
      .map((p, i) => p || userLetters[i])
      .join("");

    if (onSubmit) {
      setSubmitting(true);
      try {
        const result = await onSubmit(entry.id, answer);
        if (!result.correct) markWrong();
      } catch {
        markWrong();
      } finally {
        setSubmitting(false);
      }
    } else {
      if (answer.toUpperCase() !== entry.word) markWrong();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      if (userLetters[cursorIndex]) {
        const next = [...userLetters];
        next[cursorIndex] = "";
        setUserLetters(next);
      } else {
        const prev = findPrevEmpty(cursorIndex - 1);
        if (prev !== cursorIndex) {
          const next = [...userLetters];
          next[prev] = "";
          setUserLetters(next);
          setCursorIndex(prev);
        }
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setCursorIndex(findPrevEmpty(cursorIndex - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = findNextEmpty(cursorIndex + 1);
      if (next > cursorIndex || next === 0) setCursorIndex(next);
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      let idx = cursorIndex;
      if (prefilled[idx] !== null) {
        idx = findNextEmpty(idx);
      }
      if (prefilled[idx] === null) {
        const next = [...userLetters];
        next[idx] = e.key.toUpperCase();
        setUserLetters(next);
        setCursorIndex(findNextEmpty(idx + 1));
      }
    }
  };

  const focusInput = () => {
    hiddenInputRef.current?.focus();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.clueText}>{entry.clue}</div>
      <div className={styles.slotsRow}>
        <div
          className={`${styles.slots} ${isWrong ? styles.slotsWrong : ""}`}
          onClick={focusInput}
        >
          {Array.from({ length: entry.length }, (_, i) => {
            const letter = prefilled[i] || userLetters[i];
            const isPrefilled = prefilled[i] !== null;
            const isActive = i === cursorIndex && !isPrefilled && !disabled;
            return (
              <div
                key={i}
                className={`${styles.slot} ${isPrefilled ? styles.slotPrefilled : ""} ${isActive ? styles.slotActive : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isPrefilled && !disabled) setCursorIndex(i);
                  focusInput();
                }}
              >
                <span className={styles.slotLetter}>{letter}</span>
              </div>
            );
          })}
          <input
            ref={hiddenInputRef}
            className={styles.hiddenInput}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="characters"
            inputMode="text"
            disabled={disabled}
            tabIndex={-1}
          />
        </div>
        <button
          type="button"
          className={styles.submit}
          disabled={!allFilled || disabled}
          onClick={handleSubmit}
        >
          {submitting ? "..." : "Check"}
        </button>
      </div>
    </div>
  );
}
