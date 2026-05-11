import { useMemo, useState, useEffect, useRef } from "react";
import styles from "./ClueListView.module.css";
import CluePanel from "./CluePanel";
import { buildCellMap, computePrefilled } from "./canvas/renderer";
import type { EntryData } from "./types";

interface Props {
  entries: EntryData[];
  allEntries: Map<string, EntryData>;
  onClueClick: (entryId: string) => void;
  onSolve?: (
    entryId: string,
    answer: string,
  ) => Promise<{ correct: boolean }>;
}

export default function ClueListView({
  entries,
  allEntries,
  onClueClick,
  onSolve,
}: Props) {
  const [inlineEntryId, setInlineEntryId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const inlinePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (inlineEntryId) {
      const entry = allEntries.get(inlineEntryId);
      if (entry?.solvedBy) setInlineEntryId(null);
    }
  }, [allEntries, inlineEntryId]);

  useEffect(() => {
    if (inlineEntryId && inlinePanelRef.current) {
      inlinePanelRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [inlineEntryId]);

  const cellMap = useMemo(() => buildCellMap(allEntries), [allEntries]);

  const inlineEntry = inlineEntryId
    ? allEntries.get(inlineEntryId) ?? null
    : null;

  const inlinePrefilled = useMemo(() => {
    if (!inlineEntry) return [];
    return computePrefilled(inlineEntry, cellMap);
  }, [inlineEntry, cellMap]);

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

  const handleClue = (entryId: string) => {
    if (isMobile && onSolve) {
      setInlineEntryId(inlineEntryId === entryId ? null : entryId);
    } else {
      onClueClick(entryId);
    }
  };

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
                  className={`${styles.clueButton} ${isMobile && inlineEntryId === entry.id ? styles.clueButtonActive : ""}`}
                  onClick={() => handleClue(entry.id)}
                >
                  <span className={styles.clueText}>{entry.clue}</span>
                  <span className={styles.clueLength}>
                    {entry.length} letters
                  </span>
                </button>
                {isMobile &&
                  inlineEntryId === entry.id &&
                  inlineEntry &&
                  !inlineEntry.solvedBy && (
                    <div ref={inlinePanelRef} className={styles.inlinePanel}>
                      <CluePanel
                        entry={inlineEntry}
                        prefilled={inlinePrefilled}
                        onSubmit={onSolve}
                        inline
                      />
                    </div>
                  )}
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
              <li
                key={entry.id}
                className={`${styles.item} ${styles.solved}`}
              >
                <button
                  className={styles.clueButton}
                  onClick={() => onClueClick(entry.id)}
                >
                  <span className={styles.clueText}>{entry.clue}</span>
                  <span className={styles.solvedBy}>{entry.solvedBy}</span>
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
