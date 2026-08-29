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
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const recordPull = useTcgStore((s) => s.recordPull);
  const lastFreePackDate = useTcgStore((s) => s.lastFreePackDate);
  const bonusAnsweredDate = useTcgStore((s) => s.bonusAnsweredDate);
  const lastBonusPackDate = useTcgStore((s) => s.lastBonusPackDate);
  const devMode = useTcgStore((s) => s.devMode);
  const markFreePackOpened = useTcgStore((s) => s.markFreePackOpened);
  const markBonusPackOpened = useTcgStore((s) => s.markBonusPackOpened);
  const resetDaily = useTcgStore((s) => s.resetDaily);

  const today = ymd();
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
    setPulled(cards);
    const ids = cards.map((c) => c.id);
    // record the pull, fire achievements, and consume the day's slot only once
    // the cards are revealed — so the achievement popup never spoils the reveal,
    // and an aborted/navigated-away open doesn't burn the slot.
    const finish = () => {
      recordPull(ids);
      if (slot === "free") markFreePackOpened();
      else if (slot === "bonus") markBonusPackOpened();
    };

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
    setPackState("idle");
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

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
