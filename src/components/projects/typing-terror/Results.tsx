import type { PromptStat, TypingSet } from "./types";
import { computeAccuracy, computeWpm, formatTime } from "./utils";
import styles from "./TypingTerror.module.css";

interface Props {
  set: TypingSet;
  stats: PromptStat[];
  newBests: boolean[];
  onAgain: () => void;
}

const TIER_LABELS = ["The calm", "The turn", "The horror"];

export default function Results({ set, stats, newBests, onAgain }: Props) {
  const totalMs = stats.reduce((s, p) => s + p.ms, 0);
  const totalCorrect = stats.reduce((s, p) => s + p.correctChars, 0);
  const totalKeys = stats.reduce((s, p) => s + p.totalKeystrokes, 0);
  const totalErrors = stats.reduce((s, p) => s + p.errors, 0);

  const wpm = computeWpm(totalCorrect, totalMs);
  const accuracy = computeAccuracy(totalKeys - totalErrors, totalKeys);

  return (
    <div className={styles.results} data-tier={3}>
      <p className={styles.resultsKicker}>You survived all three passages.</p>

      <div className={styles.scoreRow}>
        <div className={styles.bigScore}>
          <span className={styles.bigScoreValue}>{wpm}</span>
          <span className={styles.bigScoreLabel}>wpm</span>
        </div>
        <div className={styles.bigScore}>
          <span className={styles.bigScoreValue}>{accuracy}%</span>
          <span className={styles.bigScoreLabel}>accuracy</span>
        </div>
        <div className={styles.bigScore}>
          <span className={styles.bigScoreValue}>{formatTime(totalMs / 1000)}</span>
          <span className={styles.bigScoreLabel}>time</span>
        </div>
      </div>

      <ul className={styles.tierBreakdown}>
        {stats.map((s, i) => (
          <li key={i} className={styles.tierRow} data-tier={s.tier}>
            <span className={styles.tierName}>
              {TIER_LABELS[i]}
              {newBests[i] && <span className={styles.tierBest}> ★ best</span>}
            </span>
            <span className={styles.tierStat}>{s.wpm} wpm</span>
            <span className={styles.tierStat}>{s.accuracy}%</span>
          </li>
        ))}
      </ul>

      <div className={styles.reveal}>
        <span className={styles.revealLabel}>What you were typing</span>
        <span className={styles.revealBook}>{set.book}</span>
        <span className={styles.revealAuthor}>
          {set.author} · {set.year}
        </span>
      </div>

      <button type="button" className={styles.primaryButton} onClick={onAgain}>
        Type again
      </button>
    </div>
  );
}
