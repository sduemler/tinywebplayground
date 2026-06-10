import { useState, useMemo, useCallback, useEffect } from "react";
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
import PlayerStatsModal from "./PlayerStatsModal";
import CountdownBanner from "./CountdownBanner";
import type { EntryData, PuzzleJson } from "./types";
import puzzleRaw from "@data/the-crossword/puzzle.json";

const puzzleData = puzzleRaw as unknown as PuzzleJson;
const PUZZLE_ID = "puzzle-001";

function buildStaticEntries(puzzle: PuzzleJson): Map<string, EntryData> {
  const map = new Map<string, EntryData>();
  for (const e of puzzle.entries) {
    map.set(e.id, {
      ...e,
      unlocked: e.id === puzzle.startEntryId,
      unlockedAt: null,
      solvedBy: null,
      solvedAt: null,
      solveSequence: null,
      wrongAttempts: 0,
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
    blocked: fbBlocked,
  } = useFirebaseData(PUZZLE_ID);
  const {
    uid,
    nickname: nicknameData,
    loading: nickLoading,
    submitNickname,
  } = useNickname();
  const solveHistory = useSolveHistory(PUZZLE_ID);

  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showContributors, setShowContributors] = useState(false);
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
            unlockedAt: fbEntry.unlockedAt,
            solvedBy: fbEntry.solvedBy,
            solvedAt: fbEntry.solvedAt,
            solveSequence: fbEntry.solveSequence,
            wrongAttempts: fbEntry.wrongAttempts,
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

  // Launch gate: until meta.launchAt passes, the board is read-only and a
  // countdown banner shows. A null launchAt (e.g. puzzle-001) means no gate.
  const launchAt = meta?.launchAt ?? null;
  const [now, setNow] = useState(() => Date.now());
  const locked = launchAt != null && now < launchAt.getTime();
  useEffect(() => {
    if (launchAt == null || Date.now() >= launchAt.getTime()) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= launchAt.getTime()) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [launchAt]);

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
      const data = result.data as {
        correct: boolean;
        solveSequence?: number;
      };
      if (!data.correct) {
        const recordFn = httpsCallable(functions, "recordWrongAttempt");
        recordFn({ puzzleId: PUZZLE_ID, entryId }).catch(() => {});
      }
      return data;
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
      if (locked) return { correct: false };
      if (!hasSeenNicknamePrompt && !nicknameData) {
        setPendingSolve({ entryId, answer });
        setShowNicknameModal(true);
        return { correct: false };
      }
      return submitSolve(entryId, answer);
    },
    [hasSeenNicknamePrompt, nicknameData, locked],
  );

  const handleNicknameClose = () => {
    setShowNicknameModal(false);
    if (pendingSolve) {
      submitSolve(pendingSolve.entryId, pendingSolve.answer);
      setPendingSolve(null);
    }
  };

  if (fbLoading && !fbBlocked && firebaseEntries.size === 0) {
    return <div className={styles.loading}>Loading puzzle...</div>;
  }

  return (
    <div className={styles.root}>
      {locked && <CountdownBanner launchAt={launchAt} now={now} />}
      {(fbBlocked || fbError) && (
        <div className={styles.banner}>
          <span>
            Can’t reach the live puzzle — an ad blocker may be blocking it.
            Allowlist this site or disable your blocker, then reload.
          </span>
          <button
            className={styles.bannerReload}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      )}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <SolveCounter count={solveCount} />
          <a
            className={styles.archiveLink}
            href="/projects/the-crossword-archive"
          >
            Past puzzles
          </a>
        </div>
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
          <button
            className={styles.timelapseBtn}
            onClick={() => setShowContributors(true)}
            title="Contributors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M4.5 2.5h9v3a4.5 4.5 0 1 1-9 0v-3Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 4h-2v1.5A2.5 2.5 0 0 0 5 8M13.5 4h2v1.5A2.5 2.5 0 0 1 13 8"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M9 10v2.3M6 15.5h6M7.2 12.8h3.6l.5 2.7h-4.6l.5-2.7Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className={styles.timelapseBtn}
            onClick={() => setShowStats(true)}
            title="Your stats"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2.5" y="9" width="3.2" height="6" rx="0.6" fill="currentColor" />
              <rect x="7.4" y="5" width="3.2" height="10" rx="0.6" fill="currentColor" />
              <rect x="12.3" y="2" width="3.2" height="13" rx="0.6" fill="currentColor" />
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
            locked={locked}
          />
        ) : (
          <ClueListView
            entries={unlockedEntries}
            allEntries={entries}
            onClueClick={handleClueClick}
            onSolve={handleSolveAttempt}
            locked={locked}
          />
        )}
        <Leaderboard
          entries={entries}
          showPanel={view === "grid"}
          expanded={showContributors}
          onExpandedChange={setShowContributors}
        />
      </div>

      {showTimelapse && (
        <TimelapsePlayer
          puzzleData={puzzleData}
          entries={entries}
          solveHistory={solveHistory}
          onClose={() => setShowTimelapse(false)}
        />
      )}

      {showNicknameModal && (
        <NicknameModal
          onSubmit={submitNickname}
          onClose={handleNicknameClose}
        />
      )}

      {showStats && (
        <PlayerStatsModal
          uid={uid}
          entries={entries}
          solveHistory={solveHistory}
          onClose={() => setShowStats(false)}
        />
      )}

      {isComplete && !showFullTimelapse && (
        <CompletionOverlay
          solveCount={solveCount}
          entries={entries}
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
