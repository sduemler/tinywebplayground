import { useMemo, useState } from "react";
import { useTcgStore } from "./store";
import { questionForToday } from "./data/questions";

const MIN_WORDS = 25;

// Shown once the daily pack is used: answer an open-ended philosophical prompt
// (any thoughtful response) to earn one bonus pack for the day.
export default function QuestionGate() {
  const answerBonus = useTcgStore((s) => s.answerBonus);
  const question = useMemo(() => questionForToday(), []);
  const [text, setText] = useState("");
  const [tooShort, setTooShort] = useState(false);

  const submit = () => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    if (words >= MIN_WORDS) answerBonus();
    else setTooShort(true);
  };

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
