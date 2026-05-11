import { useState, useMemo, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { useCrosswordStore } from "./store";
import { useFirebaseData } from "./useFirebaseData";
import { useNickname } from "./useNickname";
import { useSolveHistory } from "./useSolveHistory";
import styles from "./TheCrossword.module.css";
import GridView from "./GridView";
import ClueListView from "./ClueListView";
import SolveCounter from "./SolveCounter";
import ViewToggle from "./ViewToggle";
import NicknameModal from "./NicknameModal";
import TimelapsePlayer from "./TimelapsePlayer";
import CompletionOverlay from "./CompletionOverlay";
import Leaderboard from "./Leaderboard";
import type { EntryData, PuzzleJson } from "./types";
import puzzleRaw from "@data/the-crossword/puzzle.json";

const puzzleData = puzzleRaw as PuzzleJson;
const PUZZLE_ID = "puzzle-001";

function buildStaticEntries(puzzle: PuzzleJson): Map<string, EntryData> {
  const map = new Map<string, EntryData>();
  for (const e of puzzle.entries) {
    map.set(e.id, {
      ...e,
      unlocked: e.id === puzzle.startEntryId,
      solvedBy: null,
      solvedAt: null,
      solveSequence: null,
    });
  }
  return map;
}

export default function TheCrossword() {
  const view = useCrosswordStore((s) => s.view);
  const setSelectedEntry = useCrosswordStore((s) => s.setSelectedEntry);
  const setView = useCrosswordStore((s) => s.setView);
  const hasSeenNicknamePrompt = useCrosswordStore(
    (s) => s.hasSeenNicknamePrompt,
  );

  const {
    entries: firebaseEntries,
    meta,
    loading: fbLoading,
    error: fbError,
  } = useFirebaseData(PUZZLE_ID);
  const {
    nickname: nicknameData,
    loading: nickLoading,
    submitNickname,
  } = useNickname();
  const solveHistory = useSolveHistory(PUZZLE_ID);

  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showTimelapse, setShowTimelapse] = useState(false);
  const [showFullTimelapse, setShowFullTimelapse] = useState(false);
  const [resetViewTrigger, setResetViewTrigger] = useState(0);
  const [zoomTrigger, setZoomTrigger] = useState<{ direction: "in" | "out"; count: number }>({ direction: "in", count: 0 });
  const [pendingSolve, setPendingSolve] = useState<{
    entryId: string;
    answer: string;
  } | null>(null);

  const entries = useMemo(() => {
    if (firebaseEntries.size > 0) {
      const merged = new Map<string, EntryData>();
      for (const [id, fbEntry] of firebaseEntries) {
        const staticEntry = puzzleData.entries.find((e) => e.id === id);
        if (staticEntry) {
          merged.set(id, {
            ...staticEntry,
            unlocked: fbEntry.unlocked,
            solvedBy: fbEntry.solvedBy,
            solvedAt: fbEntry.solvedAt,
            solveSequence: fbEntry.solveSequence,
            adjacentEntryIds: staticEntry.adjacentEntryIds,
          });
        }
      }
      return merged;
    }
    return buildStaticEntries(puzzleData);
  }, [firebaseEntries]);

  const solveCount = meta?.solveCount ?? 0;
  const isComplete = meta?.isComplete ?? false;

  const unlockedEntries = useMemo(
    () => [...entries.values()].filter((e) => e.unlocked),
    [entries],
  );

  const handleClueClick = (entryId: string) => {
    setSelectedEntry(entryId);
    setView("grid");
  };

  const submitSolve = async (
    entryId: string,
    answer: string,
  ): Promise<{ correct: boolean }> => {
    try {
      const fn = httpsCallable(functions, "solveClue");
      const result = await fn({
        puzzleId: PUZZLE_ID,
        entryId,
        answer,
      });
      return result.data as { correct: boolean; solveSequence?: number };
    } catch (err) {
      console.error("solveClue error:", err);
      return { correct: false };
    }
  };

  const handleSolveAttempt = useCallback(
    async (
      entryId: string,
      answer: string,
    ): Promise<{ correct: boolean }> => {
      if (!hasSeenNicknamePrompt && !nicknameData) {
        setPendingSolve({ entryId, answer });
        setShowNicknameModal(true);
        return { correct: false };
      }
      return submitSolve(entryId, answer);
    },
    [hasSeenNicknamePrompt, nicknameData],
  );

  const handleNicknameClose = () => {
    setShowNicknameModal(false);
    if (pendingSolve) {
      submitSolve(pendingSolve.entryId, pendingSolve.answer);
      setPendingSolve(null);
    }
  };

  if (fbLoading && firebaseEntries.size === 0) {
    return <div className={styles.loading}>Loading puzzle...</div>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <SolveCounter count={solveCount} />
        <div className={styles.toolbarRight}>
          <button
            className={styles.timelapseBtn}
            onClick={() => setZoomTrigger({ direction: "in", count: zoomTrigger.count + 1 })}
            title="Zoom in"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 4v10M4 9h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className={styles.timelapseBtn}
            onClick={() => setZoomTrigger({ direction: "out", count: zoomTrigger.count + 1 })}
            title="Zoom out"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 9h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className={styles.timelapseBtn}
            onClick={() => setResetViewTrigger((n) => n + 1)}
            title="Reset view"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="3" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 7h4v4H7z" fill="currentColor" />
            </svg>
          </button>
          <button
            className={styles.timelapseBtn}
            onClick={() => setShowTimelapse((s) => !s)}
            title="Watch progress"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <circle
                cx="9"
                cy="9"
                r="7"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M7.5 6L12 9L7.5 12V6Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <ViewToggle />
        </div>
      </div>
      <div className={styles.content}>
        {view === "grid" ? (
          <GridView
            puzzleData={puzzleData}
            entries={entries}
            onSolve={handleSolveAttempt}
            resetViewTrigger={resetViewTrigger}
            zoomTrigger={zoomTrigger}
          />
        ) : (
          <ClueListView
            entries={unlockedEntries}
            allEntries={entries}
            onClueClick={handleClueClick}
            onSolve={handleSolveAttempt}
          />
        )}
        {view === "grid" && <Leaderboard entries={entries} />}
      </div>

      {showTimelapse && (
        <div className={styles.timelapseMini}>
          <TimelapsePlayer
            puzzleData={puzzleData}
            entries={entries}
            solveHistory={solveHistory}
            onClose={() => setShowTimelapse(false)}
          />
        </div>
      )}

      {showNicknameModal && (
        <NicknameModal
          onSubmit={submitNickname}
          onClose={handleNicknameClose}
        />
      )}

      {isComplete && !showFullTimelapse && (
        <CompletionOverlay
          solveCount={solveCount}
          onPlayTimelapse={() => setShowFullTimelapse(true)}
        />
      )}

      {showFullTimelapse && (
        <TimelapsePlayer
          puzzleData={puzzleData}
          entries={entries}
          solveHistory={solveHistory}
          fullscreen
          onClose={() => setShowFullTimelapse(false)}
        />
      )}
    </div>
  );
}
