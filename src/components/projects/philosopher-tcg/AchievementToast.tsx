import { useCallback, useEffect, useRef, useState } from "react";
import { useTcgStore } from "./store";
import { ACHIEVEMENT_BY_ID, type Achievement } from "./data/achievements";

const HOLD = 4200; // ms the popup stays fully visible
const EXIT = 480; // ms the slide-out animation takes

// A short, pleasant unlock chime synthesized with the Web Audio API — no asset
// file required. Triggered off a pack-open (a user gesture), so autoplay is OK.
function playChime() {
  if (typeof window === "undefined") return;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    // The context is created seconds after the triggering click; some browsers
    // start it suspended outside the gesture window.
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 · E5 · G5 · C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0006, t + 0.55);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1400);
  } catch {
    /* audio not available — popup still shows silently */
  }
}

function Seal() {
  return (
    <svg className="ach-pop-seal" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="20" fill="currentColor" opacity="0.16" />
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
      <path
        d="M16 24.5l5 5 11-11.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AchievementToast() {
  const newlyUnlocked = useTcgStore((s) => s.newlyUnlocked);
  const clearNewlyUnlocked = useTcgStore((s) => s.clearNewlyUnlocked);

  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Pull newly-unlocked ids into the local queue, then reset the store flag.
  useEffect(() => {
    if (newlyUnlocked.length === 0) return;
    const items = newlyUnlocked
      .map((id) => ACHIEVEMENT_BY_ID[id])
      .filter((a): a is Achievement => Boolean(a));
    if (items.length) setQueue((q) => [...q, ...items]);
    clearNewlyUnlocked();
  }, [newlyUnlocked, clearNewlyUnlocked]);

  // Show one popup at a time; advance when the current one finishes.
  useEffect(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setCurrent(next);
    setPhase("in");
    playChime();
    timers.current.push(setTimeout(() => setPhase("out"), HOLD));
    timers.current.push(setTimeout(() => setCurrent(null), HOLD + EXIT));
  }, [current, queue]);

  useEffect(() => () => clearTimers(), []);

  const dismiss = useCallback(() => {
    clearTimers();
    setPhase("out");
    timers.current.push(setTimeout(() => setCurrent(null), EXIT));
  }, []);

  if (!current) return null;

  return (
    <div
      className={`ach-pop ${phase}`}
      role="status"
      aria-live="polite"
      onClick={dismiss}
    >
      <Seal />
      <div className="ach-pop-text">
        <div className="ach-pop-label">Achievement Unlocked</div>
        <div className="ach-pop-name">{current.name}</div>
        <div className="ach-pop-desc">{current.description}</div>
      </div>
      <span className="ach-pop-shine" aria-hidden="true" />
    </div>
  );
}
