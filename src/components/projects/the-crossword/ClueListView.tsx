import { useMemo } from "react";
import styles from "./ClueListView.module.css";
import type { EntryData } from "./types";

interface Props {
  entries: EntryData[];
  onClueClick: (entryId: string) => void;
}

export default function ClueListView({ entries, onClueClick }: Props) {
  const { unsolvedByCategory, solved } = useMemo(() => {
    const unsolved = entries.filter((e) => !e.solvedBy);
    const groups = new Map<string, EntryData[]>();
    for (const entry of unsolved) {
      const cat = entry.category || "General";
      const list = groups.get(cat) || [];
      list.push(entry);
      groups.set(cat, list);
    }
    const sorted = [...groups.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    return {
      unsolvedByCategory: sorted,
      solved: entries.filter((e) => e.solvedBy),
    };
  }, [entries]);

  return (
    <div className={styles.container}>
      {unsolvedByCategory.map(([category, clues]) => (
        <section key={category}>
          <h3 className={styles.sectionTitle}>
            {category}
            <span className={styles.categoryCount}>{clues.length}</span>
          </h3>
          <ul className={styles.list}>
            {clues.map((entry) => (
              <li key={entry.id} className={styles.item}>
                <button
                  className={styles.clueButton}
                  onClick={() => onClueClick(entry.id)}
                >
                  <span className={styles.clueText}>{entry.clue}</span>
                  <span className={styles.clueLength}>
                    {entry.length} letters
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {solved.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>
            Solved
            <span className={styles.categoryCount}>{solved.length}</span>
          </h3>
          <ul className={styles.list}>
            {solved.map((entry) => (
              <li key={entry.id} className={`${styles.item} ${styles.solved}`}>
                <button
                  className={styles.clueButton}
                  onClick={() => onClueClick(entry.id)}
                >
                  <span className={styles.clueText}>{entry.clue}</span>
                  <span className={styles.solvedBy}>
                    {entry.solvedBy}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {entries.length === 0 && (
        <div className={styles.empty}>No clues unlocked yet</div>
      )}
    </div>
  );
}
