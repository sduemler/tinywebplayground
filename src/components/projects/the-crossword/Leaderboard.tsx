import { useMemo } from "react";
import styles from "./Leaderboard.module.css";
import type { EntryData } from "./types";

interface Props {
  entries: Map<string, EntryData>;
}

export default function Leaderboard({ entries }: Props) {
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
    <div className={styles.panel}>
      <h3 className={styles.title}>Leaderboard</h3>
      <ol className={styles.list}>
        {rankings.map(({ rank, name, count }) => (
          <li key={name} className={styles.row}>
            <span className={styles.rank}>{rank}</span>
            <span className={styles.name}>{name}</span>
            <span className={styles.count}>{count}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
