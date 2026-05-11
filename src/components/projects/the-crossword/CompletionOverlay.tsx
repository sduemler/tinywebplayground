import { useMemo } from "react";
import styles from "./CompletionOverlay.module.css";
import type { EntryData } from "./types";

interface Props {
  solveCount: number;
  entries: Map<string, EntryData>;
  onPlayTimelapse: () => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function CompletionOverlay({
  solveCount,
  entries,
  onPlayTimelapse,
}: Props) {
  const topSolvers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries.values()) {
      if (entry.solvedBy) {
        counts.set(entry.solvedBy, (counts.get(entry.solvedBy) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  }, [entries]);

  const lastSolve = useMemo(() => {
    let best: EntryData | null = null;
    for (const entry of entries.values()) {
      if (entry.solveSequence != null) {
        if (!best || entry.solveSequence > best.solveSequence!) {
          best = entry;
        }
      }
    }
    return best;
  }, [entries]);

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h1 className={styles.title}>Congratulations!</h1>
        <p className={styles.stat}>
          All <strong>{solveCount}</strong> clues solved
        </p>

        {topSolvers.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Top Solvers</h2>
            <ol className={styles.podium}>
              {topSolvers.map(({ name, count }, i) => (
                <li key={name} className={styles.podiumRow}>
                  <span className={styles.medal}>{MEDALS[i]}</span>
                  <span className={styles.solverName}>{name}</span>
                  <span className={styles.solverCount}>{count}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {lastSolve && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Final Clue</h2>
            <p className={styles.finalClue}>{lastSolve.clue}</p>
            <p className={styles.finalAnswer}>
              {lastSolve.word}
              <span className={styles.finalSolver}>
                solved by {lastSolve.solvedBy}
              </span>
            </p>
          </div>
        )}

        <button className={styles.playBtn} onClick={onPlayTimelapse}>
          <span className={styles.playIcon}>▶</span>
          Watch the full timelapse
        </button>
        <div className={styles.comingSoon}>
          <p className={styles.comingSoonText}>Coming Soon</p>
          <p className={styles.comingSoonSub}>
            A new puzzle is being prepared. Check back later!
          </p>
        </div>
      </div>
    </div>
  );
}
