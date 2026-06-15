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
  locked?: boolean;
}

export default function ClueListView({
  entries,
  allEntries,
  onClueClick,
  onSolve,
  locked,
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
      if (entry?.solvedBy) {
        const timer = setTimeout(() => setInlineEntryId(null), 1200);
        return () => clearTimeout(timer);
      }
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
      solved: entries
        .filter((e) => e.solvedBy)
        .sort((a, b) => {
          if (!a.solvedAt || !b.solvedAt) return a.solvedAt ? -1 : 1;
          return b.solvedAt.getTime() - a.solvedAt.getTime();
        }),
    };
  }, [entries]);

  // The 10 most-recently unlocked, still-unsolved clues, newest first. Pinned at
  // the top of the list as a "spotlight"; these clues ALSO remain in their
  // category sections below. Purely derived from already-loaded entry state — no
  // extra Firestore reads, nothing that scales with puzzle size.
  const newlyUnlocked = useMemo(() => {
    return entries
      .filter((e) => !e.solvedBy)
      .sort((a, b) => {
        const at = a.unlockedAt ? a.unlockedAt.getTime() : 0;
        const bt = b.unlockedAt ? b.unlockedAt.getTime() : 0;
        if (bt !== at) return bt - at; // newest first; null unlockedAt sorts last
        return a.id.localeCompare(b.id); // stable order for same-solve unlocks
      })
      .slice(0, 10);
  }, [entries]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleSection = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleClue = (entryId: string) => {
    if (isMobile && onSolve) {
      setInlineEntryId(inlineEntryId === entryId ? null : entryId);
    } else {
      onClueClick(entryId);
    }
  };

  // A pinned "Newly Unlocked" item jumps to the CANONICAL clue rather than
  // hosting its own solver (so a clue can never open two inline editors at
  // once). On mobile: expand it inline in its category, un-collapsing that
  // section first — the existing inlineEntryId scroll effect brings it into
  // view. On desktop: hand off to the normal clue-click (grid focus).
  const handleJumpToClue = (entry: EntryData) => {
    if (isMobile && onSolve) {
      const cat = entry.category || "General";
      setCollapsed((prev) => {
        if (!prev.has(cat)) return prev;
        const next = new Set(prev);
        next.delete(cat);
        return next;
      });
      setInlineEntryId(entry.id);
    } else {
      onClueClick(entry.id);
    }
  };

  return (
    <div className={styles.container}>
      {newlyUnlocked.length > 0 && (
        <section>
          <button
            type="button"
            className={styles.sectionTitle}
            onClick={() => toggleSection("__newly__")}
            aria-expanded={!collapsed.has("__newly__")}
          >
            <span className={`${styles.chevron} ${collapsed.has("__newly__") ? styles.chevronCollapsed : ""}`}>▾</span>
            Newly Unlocked
            <span className={styles.categoryCount}>{newlyUnlocked.length}</span>
          </button>
          {!collapsed.has("__newly__") && (
            <ul className={styles.list}>
              {newlyUnlocked.map((entry) => (
                <li key={`new-${entry.id}`} className={styles.item}>
                  <button
                    className={styles.clueButton}
                    onClick={() => handleJumpToClue(entry)}
                  >
                    <span className={styles.clueText}>{entry.clue}</span>
                    {entry.category && (
                      <span className={styles.solvedCategory}>{entry.category}</span>
                    )}
                    <span className={styles.jumpArrow} aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {unsolvedByCategory.map(([category, clues]) => (
        <section key={category}>
          <button
            type="button"
            className={styles.sectionTitle}
            onClick={() => toggleSection(category)}
            aria-expanded={!collapsed.has(category)}
          >
            <span className={`${styles.chevron} ${collapsed.has(category) ? styles.chevronCollapsed : ""}`}>▾</span>
            {category}
            <span className={styles.categoryCount}>{clues.length}</span>
          </button>
          {!collapsed.has(category) && (
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
                    inlineEntry && (
                      <div ref={inlinePanelRef} className={styles.inlinePanel}>
                        <CluePanel
                          entry={inlineEntry}
                          prefilled={inlinePrefilled}
                          onSubmit={onSolve}
                          inline
                          locked={locked}
                        />
                      </div>
                    )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {solved.length > 0 && (
        <section>
          <button
            type="button"
            className={styles.sectionTitle}
            onClick={() => toggleSection("__solved__")}
            aria-expanded={!collapsed.has("__solved__")}
          >
            <span className={`${styles.chevron} ${collapsed.has("__solved__") ? styles.chevronCollapsed : ""}`}>▾</span>
            Solved
            <span className={styles.categoryCount}>{solved.length}</span>
          </button>
          {!collapsed.has("__solved__") && (
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
                    {entry.category && (
                      <span className={styles.solvedCategory}>{entry.category}</span>
                    )}
                    <span className={styles.solvedBy}>{entry.solvedBy}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {entries.length === 0 && (
        <div className={styles.empty}>No clues unlocked yet</div>
      )}
    </div>
  );
}
