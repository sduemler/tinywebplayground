import { useCallback, useEffect, useRef, useState } from "react";
import type { PhilosopherCard } from "./types";
import { PHILOSOPHERS } from "./data/cards";
import { drawPack } from "./lib/draw";
import { ymd, msUntilMidnight } from "./lib/daily";
import { useTcgStore } from "./store";
import Pack from "./Pack";
import Card from "./Card";
import QuestionGate from "./QuestionGate";

type PackState = "idle" | "opening" | "pocket" | "emerged" | "fanned";

interface Props {
  onFocus: (card: PhilosopherCard) => void;
}

function Countdown() {
  const [ms, setMs] = useState(() => msUntilMidnight());
  useEffect(() => {
    const t = setInterval(() => setMs(msUntilMidnight()), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return (
    <span className="tcg-countdown">
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

export default function PackOpener({ onFocus }: Props) {
  const [packState, setPackState] = useState<PackState>("idle");
  const [pulled, setPulled] = useState<PhilosopherCard[]>([]);
  /** ids in the current pull that weren't owned before it (drives "New" badges) */
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());
  const [today, setToday] = useState(() => ymd());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** commits the in-flight pack open; null once recorded */
  const pendingFinish = useRef<(() => void) | null>(null);

  // Roll `today` over at local midnight so the locked screen unlocks without a
  // refresh; also re-check on tab focus (sleep/wake can outlive the timer).
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const arm = () => {
      t = setTimeout(() => {
        setToday(ymd());
        arm();
      }, msUntilMidnight() + 1000);
    };
    arm();
    const onVisible = () => {
      if (!document.hidden) setToday(ymd());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const recordPull = useTcgStore((s) => s.recordPull);
  const lastFreePackDate = useTcgStore((s) => s.lastFreePackDate);
  const bonusAnsweredDate = useTcgStore((s) => s.bonusAnsweredDate);
  const lastBonusPackDate = useTcgStore((s) => s.lastBonusPackDate);
  const devMode = useTcgStore((s) => s.devMode);
  const markFreePackOpened = useTcgStore((s) => s.markFreePackOpened);
  const markBonusPackOpened = useTcgStore((s) => s.markBonusPackOpened);
  const resetDaily = useTcgStore((s) => s.resetDaily);

  const freeReady = lastFreePackDate !== today;
  const questionReady = !freeReady && bonusAnsweredDate !== today;
  const bonusReady = bonusAnsweredDate === today && lastBonusPackDate !== today;
  const canOpen = devMode || freeReady || bonusReady;
  const slotLabel = devMode
    ? "Dev Pack"
    : freeReady
      ? "Daily Pack"
      : bonusReady
        ? "Bonus Pack"
        : "";

  const open = useCallback(() => {
    if (packState !== "idle") return;
    const slot = devMode
      ? "dev"
      : freeReady
        ? "free"
        : bonusReady
          ? "bonus"
          : null;
    if (!slot) return;

    const cards = drawPack(PHILOSOPHERS);
    // Newness is judged against ownership at draw time, before the pull is
    // recorded into the store.
    const ownedNow = useTcgStore.getState().owned;
    setNewIds(new Set(cards.filter((c) => !(ownedNow[c.id] > 0)).map((c) => c.id)));
    setPulled(cards);
    const ids = cards.map((c) => c.id);
    // Record the pull, fire achievements, and consume the day's slot only once
    // the cards are revealed, so the achievement popup never spoils the reveal.
    // The pending ref lets the unmount cleanup commit an in-flight open — the
    // cards are visible mid-animation, so bailing out must not offer a re-roll.
    const finish = () => {
      pendingFinish.current = null;
      recordPull(ids);
      if (slot === "free") markFreePackOpened();
      else if (slot === "bonus") markBonusPackOpened();
    };
    pendingFinish.current = finish;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPackState("fanned");
      finish();
      return;
    }
    setPackState("opening");
    timers.current.push(setTimeout(() => setPackState("pocket"), 1650));
    timers.current.push(setTimeout(() => setPackState("emerged"), 2400));
    timers.current.push(
      setTimeout(() => {
        setPackState("fanned");
        finish();
      }, 3250),
    );
  }, [
    packState,
    devMode,
    freeReady,
    bonusReady,
    recordPull,
    markFreePackOpened,
    markBonusPackOpened,
  ]);

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPulled([]);
    setNewIds(new Set());
    setPackState("idle");
  };

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      // Commit a pack that was opened but not yet recorded (unmounted
      // mid-animation) — only touches the store, safe after unmount.
      pendingFinish.current?.();
    },
    [],
  );

  const phaseLabels: Record<PackState, string> = {
    idle: slotLabel,
    opening: "Opening…",
    pocket: "—",
    emerged: "—",
    fanned: "Your Cards",
  };
  const showCards = ["opening", "pocket", "emerged", "fanned"].includes(packState);

  // When idle and nothing is openable, show the gate (question or locked).
  const idleGate =
    packState === "idle" && !canOpen
      ? questionReady
        ? "question"
        : "locked"
      : null;

  return (
    <div className="stage">
      {devMode && (
        <div className="dev-bar">
          <span className="dev-tag">Dev Mode</span>
          <span className="dev-note">Unlimited packs · daily limit bypassed</span>
          <button className="btn" onClick={resetDaily}>
            Reset daily limits
          </button>
        </div>
      )}

      {idleGate === "question" ? (
        <QuestionGate />
      ) : idleGate === "locked" ? (
        <div className="daily-locked">
          <div className="daily-locked-seal">✦</div>
          <div className="daily-locked-title">You’ve drawn today’s packs</div>
          <p className="daily-locked-text">
            The grimoire rests. Return tomorrow for another.
          </p>
          <div className="daily-locked-timer">
            Next pack in <Countdown />
          </div>
        </div>
      ) : (
        <>
          <div className="stage-label">{phaseLabels[packState]}</div>

          <div className="reveal">
            <Pack onOpen={open} state={packState}>
              {showCards &&
                pulled.map((p, i) => {
                  const stageClass =
                    packState === "emerged"
                      ? "show-emerged"
                      : packState === "fanned"
                        ? "show-fanned"
                        : "show-pocket";
                  return (
                    <div key={p.id} className={`card-slot pos-${i} ${stageClass}`}>
                      <Card
                        data={p}
                        onClick={() => packState === "fanned" && onFocus(p)}
                      />
                      {packState === "fanned" && newIds.has(p.id) && (
                        <span className="tcg-new-badge">New</span>
                      )}
                    </div>
                  );
                })}
            </Pack>
          </div>

          {packState === "fanned" && (
            <>
              <div className="hint">
                Click a card to view it · <span className="key">Esc</span> to close
              </div>
              <div className="actions">
                <button className="btn primary" onClick={reset}>
                  Continue
                </button>
              </div>
            </>
          )}
          {packState === "idle" && canOpen && (
            <div className="hint">
              {bonusReady && !freeReady && !devMode
                ? "Your bonus pack is ready · click to open"
                : "Click the pack to open"}
            </div>
          )}
        </>
      )}
    </div>
  );
}
