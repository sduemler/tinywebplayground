import { useMemo, useState } from "react";
import styles from "./Leaderboard.module.css";
import type { EntryData } from "./types";

interface Props {
  entries: Map<string, EntryData>;
}

export default function Leaderboard({ entries }: Props) {
  const [expanded, setExpanded] = useState(false);

  const rankings = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries.values()) {
      if (entry.solvedBy) {
        counts.set(entry.solvedBy, (counts.get(entry.solvedBy) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({ rank: i + 1, name, count }));
  }, [entries]);

  if (rankings.length === 0) return null;

  return (
    <>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>Contributors</h3>
          <button
            type="button"
            className={styles.expandBtn}
            onClick={() => setExpanded(true)}
            aria-label="Show all contributors"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M2 2h5V0H0v7h2V2zM14 14h-5v2h7V9h-2v5z" fill="currentColor" />
            </svg>
          </button>
        </div>
        <ol className={styles.list}>
          {rankings.slice(0, 10).map(({ rank, name, count }) => (
            <li key={name} className={styles.row}>
              <span className={styles.rank}>{rank}</span>
              <span className={styles.name}>{name}</span>
              <span className={styles.count}>{count}</span>
            </li>
          ))}
        </ol>
      </div>

      {expanded && (
        <div className={styles.overlay} onClick={() => setExpanded(false)}>
          <div className={styles.lightbox} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setExpanded(false)}
            >
              &times;
            </button>
            <h3 className={styles.lightboxTitle}>Contributors</h3>
            <ol className={styles.lightboxList}>
              {rankings.map(({ rank, name, count }) => (
                <li key={name} className={styles.row}>
                  <span className={styles.rank}>{rank}</span>
                  <span className={styles.name}>{name}</span>
                  <span className={styles.count}>{count}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
