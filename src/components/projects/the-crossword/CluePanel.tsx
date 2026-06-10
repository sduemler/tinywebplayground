import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./CluePanel.module.css";
import { useCrosswordStore } from "./store";
import type { EntryData, ClueMedia } from "./types";

function ClueMediaBlock({ media }: { media: ClueMedia }) {
  if (media.type === "image") {
    return (
      <img
        className={styles.media}
        src={media.src}
        alt={media.alt ?? "Clue image"}
      />
    );
  }
  if (media.type === "audio") {
    return (
      <audio
        className={styles.mediaAudio}
        src={media.src}
        controls
        preload="metadata"
      />
    );
  }
  return (
    <video
      className={styles.media}
      src={media.src}
      controls
      preload="metadata"
    />
  );
}

interface Props {
  entry: EntryData;
  prefilled: (string | null)[];
  onSubmit?: (
    entryId: string,
    answer: string,
  ) => Promise<{ correct: boolean }>;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  inline?: boolean;
  /** When true, solving is disabled (e.g. puzzle hasn't launched yet). */
  locked?: boolean;
}

export default function CluePanel({ entry, prefilled, onSubmit, inputRef, inline, locked }: Props) {
  const [userLetters, setUserLetters] = useState<string[]>([]);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [isWrong, setIsWrong] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const localInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = inputRef || localInputRef;
  const cursorRef = useRef(0);
  const cooldownUntil = useCrosswordStore((s) => s.cooldownUntil);
  const setCooldown = useCrosswordStore((s) => s.setCooldown);

  const isCoolingDown = cooldownUntil ? Date.now() < cooldownUntil : false;
  const disabled = locked || isCoolingDown || submitting || isCorrect;

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

  const updateCursor = (idx: number) => {
    cursorRef.current = idx;
    setCursorIndex(idx);
  };

  useEffect(() => {
    setUserLetters(new Array(entry.length).fill(""));
    setIsWrong(false);
    setIsCorrect(false);
    const first = findNextEmpty(0);
    updateCursor(first);
    hiddenInputRef.current?.focus();
  }, [entry.id, entry.length, findNextEmpty]);

  const markWrong = () => {
    setIsWrong(true);
    setCooldown(Date.now() + 3000);
    setTimeout(() => {
      setIsWrong(false);
      setUserLetters(new Array(entry.length).fill(""));
      updateCursor(findNextEmpty(0));
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
        if (result.correct) {
          setIsCorrect(true);
        } else {
          markWrong();
        }
      } catch {
        markWrong();
      } finally {
        setSubmitting(false);
      }
    } else {
      if (answer.toUpperCase() !== entry.word) markWrong();
    }
  };

  const typeLetter = useCallback(
    (letter: string) => {
      let idx = cursorRef.current;
      if (prefilled[idx] !== null) {
        idx = findNextEmpty(idx);
      }
      if (prefilled[idx] === null) {
        setUserLetters((prev) => {
          const next = [...prev];
          next[idx] = letter.toUpperCase();
          return next;
        });
        updateCursor(findNextEmpty(idx + 1));
      }
    },
    [prefilled, findNextEmpty],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      const idx = cursorRef.current;
      setUserLetters((prev) => {
        const next = [...prev];
        if (next[idx]) {
          next[idx] = "";
        } else {
          const prev2 = findPrevEmpty(idx - 1);
          if (prev2 !== idx) {
            next[prev2] = "";
            updateCursor(prev2);
          }
        }
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      updateCursor(findPrevEmpty(cursorRef.current - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = findNextEmpty(cursorRef.current + 1);
      if (next > cursorRef.current || next === 0) updateCursor(next);
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      typeLetter(e.key);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    if (disabled) return;
    const input = e.currentTarget;
    const val = input.value;
    input.value = "";
    const letters = val.replace(/[^a-zA-Z]/g, "");
    for (const ch of letters) {
      typeLetter(ch);
    }
  };

  const focusInput = () => {
    hiddenInputRef.current?.focus();
  };

  return (
    <div className={`${styles.panel} ${inline ? styles.panelInline : ""}`}>
      {entry.media && <ClueMediaBlock media={entry.media} />}
      <div className={styles.clueText}>{entry.clue}</div>
      <div className={styles.slotsRow}>
        <div
          className={`${styles.slots} ${isWrong ? styles.slotsWrong : ""} ${isCorrect ? styles.slotsCorrect : ""}`}
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
                  if (!isPrefilled && !disabled) updateCursor(i);
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
            onInput={handleInput}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            disabled={disabled}
          />
        </div>
        <button
          type="button"
          className={`${styles.submit} ${isCorrect ? styles.submitCorrect : ""}`}
          disabled={!allFilled || disabled}
          onClick={handleSubmit}
        >
          {locked ? "🔒" : submitting ? "..." : isCorrect ? "✓" : "Check"}
        </button>
      </div>
    </div>
  );
}
