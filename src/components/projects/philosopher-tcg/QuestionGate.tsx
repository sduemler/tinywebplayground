import { useMemo, useState } from "react";
import { useTcgStore } from "./store";
import {
  questionForToday,
  SNARKY_REMARKS,
  GENUINE_REMARKS,
} from "./data/questions";

const MIN_WORDS = 25;
/** Answers at least this long are eligible for the rare genuine compliment. */
const GENUINE_MIN_WORDS = 60;
const GENUINE_CHANCE = 0.1;

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// Shown once the daily pack is used: answer an open-ended philosophical prompt
// (any thoughtful response) to earn one bonus pack for the day. The grimoire
// replies with snark — or, 1 time in 10 for a long answer, actual respect —
// before handing over the pack.
export default function QuestionGate() {
  const answerBonus = useTcgStore((s) => s.answerBonus);
  const question = useMemo(() => questionForToday(), []);
  const [text, setText] = useState("");
  const [tooShort, setTooShort] = useState(false);
  const [remark, setRemark] = useState<{ text: string; genuine: boolean } | null>(
    null,
  );

  const submit = () => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    if (words < MIN_WORDS) {
      setTooShort(true);
      return;
    }
    const genuine =
      words >= GENUINE_MIN_WORDS && Math.random() < GENUINE_CHANCE;
    setRemark({
      text: pick(genuine ? GENUINE_REMARKS : SNARKY_REMARKS),
      genuine,
    });
  };

  if (remark) {
    return (
      <div className="question-gate">
        <div className="qg-eyebrow">The grimoire responds</div>
        <p className={`qg-remark ${remark.genuine ? "qg-remark-genuine" : ""}`}>
          “{remark.text}”
        </p>
        <div className="qg-actions">
          <button className="btn primary" onClick={answerBonus}>
            Claim Bonus Pack
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="question-gate">
      <div className="qg-eyebrow">Daily pack drawn — reflect for one more</div>
      <h2 className="qg-question">“{question}”</h2>
      <textarea
        className="qg-input"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (tooShort) setTooShort(false);
        }}
        placeholder="Set down your thoughts…"
        rows={4}
        maxLength={1000}
        aria-label="Your reflection"
      />
      <div className="qg-actions">
        <button className="btn primary" onClick={submit}>
          Reflect &amp; Unlock Pack
        </button>
        <span className={`qg-hint ${tooShort ? "qg-error" : ""}`}>
          {tooShort ? `Reflect a little more — at least ${MIN_WORDS} words.` : ""}
        </span>
      </div>
    </div>
  );
}
