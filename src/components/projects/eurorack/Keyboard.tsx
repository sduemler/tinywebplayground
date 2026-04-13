import { useCallback, useEffect, useRef, useState } from "react";
import { useSynthStore } from "./store";
import { initAudio, triggerNote, releaseNote } from "./audio";
import { KEY_LAYOUT, noteToHz, type KeyBinding } from "./notes";
import styles from "./Eurorack.module.css";

function keyId(binding: KeyBinding): string {
  return `${binding.note}-${binding.octaveOffset}`;
}

// White-key ordinal position within the visible range (used to lay out black
// keys absolutely on top of the white-key strip).
function whiteIndexBefore(i: number): number {
  let count = 0;
  for (let j = 0; j < i; j++) {
    if (!KEY_LAYOUT[j].isBlack) count++;
  }
  return count;
}

const WHITE_KEY_COUNT = KEY_LAYOUT.filter((k) => !k.isBlack).length;

export default function Keyboard() {
  const octave = useSynthStore((s) => s.octave);
  const triggerMode = useSynthStore((s) => s.triggerMode);
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const heldOrderRef = useRef<string[]>([]);
  const octaveRef = useRef(octave);

  useEffect(() => {
    octaveRef.current = octave;
  }, [octave]);

  // When the user flips back to drone mode, drop any notes that were held on
  // the on-screen keys so they don't ring forever after the keyboard slides away.
  useEffect(() => {
    if (triggerMode) return;
    heldOrderRef.current = [];
    setPressed((prev) => (prev.size === 0 ? prev : new Set()));
  }, [triggerMode]);

  const pressKey = useCallback((binding: KeyBinding) => {
    const id = keyId(binding);
    const hz = noteToHz(binding.note, octaveRef.current + binding.octaveOffset);
    const order = heldOrderRef.current;
    const existing = order.indexOf(id);
    if (existing !== -1) order.splice(existing, 1);
    order.push(id);
    setPressed((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    initAudio().then(() => triggerNote(hz));
  }, []);

  const releaseKey = useCallback((binding: KeyBinding) => {
    const id = keyId(binding);
    const order = heldOrderRef.current;
    const idx = order.indexOf(id);
    if (idx === -1) return;
    order.splice(idx, 1);
    setPressed((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (order.length === 0) {
      releaseNote();
    } else {
      const topId = order[order.length - 1];
      const topBinding = KEY_LAYOUT.find((b) => keyId(b) === topId);
      if (topBinding) {
        const hz = noteToHz(
          topBinding.note,
          octaveRef.current + topBinding.octaveOffset
        );
        initAudio().then(() => triggerNote(hz));
      }
    }
  }, []);

  useEffect(() => {
    if (!triggerMode) return;
    const handleDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const key = e.key.toLowerCase();
      const binding = KEY_LAYOUT.find((b) => b.keyboardKey === key);
      if (!binding) return;
      e.preventDefault();
      pressKey(binding);
    };
    const handleUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const binding = KEY_LAYOUT.find((b) => b.keyboardKey === key);
      if (!binding) return;
      releaseKey(binding);
    };
    document.addEventListener("keydown", handleDown);
    document.addEventListener("keyup", handleUp);
    return () => {
      document.removeEventListener("keydown", handleDown);
      document.removeEventListener("keyup", handleUp);
      heldOrderRef.current = [];
      releaseNote();
    };
  }, [triggerMode, pressKey, releaseKey]);

  const whites = KEY_LAYOUT.filter((b) => !b.isBlack);

  return (
    <div
      className={`${styles.pianoKeyboard} ${triggerMode ? styles.pianoKeyboardVisible : ""}`}
      aria-hidden={!triggerMode}
    >
      <div className={styles.pianoKeyRow}>
        {whites.map((binding) => {
          const id = keyId(binding);
          const isPressed = pressed.has(id);
          return (
            <button
              key={id}
              type="button"
              className={`${styles.pianoKeyWhite} ${isPressed ? styles.pianoKeyPressed : ""}`}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                pressKey(binding);
              }}
              onPointerUp={() => releaseKey(binding)}
              onPointerCancel={() => releaseKey(binding)}
              onPointerLeave={(e) => {
                if (e.buttons > 0) releaseKey(binding);
              }}
              aria-label={`${binding.note}${octave + binding.octaveOffset}`}
            >
              <span className={styles.pianoKeyLabel}>
                {binding.keyboardKey === "," ? "," : binding.keyboardKey.toUpperCase()}
              </span>
            </button>
          );
        })}
        {KEY_LAYOUT.map((binding, i) => {
          if (!binding.isBlack) return null;
          const id = keyId(binding);
          const isPressed = pressed.has(id);
          // Sit between the white key at whiteIndexBefore(i) - 1 and whiteIndexBefore(i).
          // whiteIndexBefore(i) == number of white keys before this black key, so
          // the black key's center is at that index on the white-key grid.
          const whiteIdx = whiteIndexBefore(i);
          const leftPercent = (whiteIdx / WHITE_KEY_COUNT) * 100;
          return (
            <button
              key={id}
              type="button"
              className={`${styles.pianoKeyBlack} ${isPressed ? styles.pianoKeyPressed : ""}`}
              style={{ left: `calc(${leftPercent}% - (var(--black-key-width) / 2))` }}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                pressKey(binding);
              }}
              onPointerUp={() => releaseKey(binding)}
              onPointerCancel={() => releaseKey(binding)}
              onPointerLeave={(e) => {
                if (e.buttons > 0) releaseKey(binding);
              }}
              aria-label={`${binding.note}${octave + binding.octaveOffset}`}
            >
              <span className={styles.pianoKeyLabel}>
                {binding.keyboardKey.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
