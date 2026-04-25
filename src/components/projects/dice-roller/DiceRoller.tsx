import { useEffect, useRef, useState } from "react";
import { parseDiceRoll, type RollResult } from "./dice";
import styles from "./DiceRoller.module.css";

export default function DiceRoller() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<RollResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const latest = history[0];

  const handleRoll = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      const rolled = parseDiceRoll(trimmed);
      setHistory((h) => [rolled, ...h]);
      setError(null);
      setInput("");
      setHistoryIndex(null);
      void copyResult(rolled.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid expression");
    }
  };

  const copyResult = async (value: number) => {
    try {
      await navigator.clipboard.writeText(value.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard may be unavailable — silently ignore.
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRoll();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setInput("");
      setHistoryIndex(null);
      setError(null);
      return;
    }
    if (e.key === "ArrowUp" && history.length > 0) {
      e.preventDefault();
      const next = historyIndex === null ? 0 : Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      setInput(history[next].input);
      return;
    }
    if (e.key === "ArrowDown" && historyIndex !== null) {
      e.preventDefault();
      if (historyIndex === 0) {
        setHistoryIndex(null);
        setInput("");
      } else {
        const next = historyIndex - 1;
        setHistoryIndex(next);
        setInput(history[next].input);
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <a
        className={styles.raycastNotice}
        href="https://www.raycast.com/sam_duemler/tabletop-dice-roller"
        target="_blank"
        rel="noopener noreferrer"
      >
        Also available as a Raycast extension →
      </a>

      <p className={styles.hint}>
        Dice notation with <code>+ − × ÷</code> and parentheses. Try{" "}
        <code>1d20 + 5</code> or <code>2d6 + 3d4 - 1</code>.
      </p>

      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHistoryIndex(null);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="1d20 + 5"
          spellCheck={false}
          autoComplete="off"
          aria-label="Dice notation"
        />
        <button
          type="button"
          className={styles.rollButton}
          onClick={handleRoll}
          disabled={!input.trim()}
        >
          Roll
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {latest && (
        <button
          type="button"
          className={styles.resultCard}
          onClick={() => copyResult(latest.result)}
          aria-label={`Copy result ${latest.result}`}
        >
          <div className={styles.resultLabel}>{latest.input}</div>
          <div className={styles.resultValue}>{formatResult(latest.result)}</div>
          {latest.breakdown && (
            <div className={styles.resultBreakdown}>{latest.breakdown}</div>
          )}
          <div className={styles.copyHint}>
            {copied ? "Copied!" : "Click to copy"}
          </div>
        </button>
      )}

      {history.length > 1 && (
        <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <span>History</span>
            <span className={styles.historyMeta}>↑ / ↓ to recall</span>
          </div>
          <ul className={styles.historyList}>
            {history.slice(1).map((h, i) => (
              <li key={i} className={styles.historyItem}>
                <span className={styles.historyInput}>{h.input}</span>
                <span className={styles.historyEquals}>=</span>
                <span className={styles.historyResult}>
                  {formatResult(h.result)}
                </span>
                {h.breakdown && (
                  <span className={styles.historyBreakdown}>{h.breakdown}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatResult(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}
