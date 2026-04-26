import { useEffect, useState } from 'react';
import GameScreen from './GameScreen';
import HomeScreen from './HomeScreen';
import PlaylistPicker from './PlaylistPicker';
import ResultsScreen from './ResultsScreen';
import { TOTAL_LIFELINES, buildInitialState, gameReducer, isGameComplete } from './gameReducer';
import { useMusicGuesserStore } from './store';
import { apiFetch, getLocalDateString } from './utils';
import styles from './MusicGuesser.module.css';
import type { GameState, Mode, Phase, Track } from './types';

interface DailyResponse {
  success: boolean;
  date: string;
  tracks: Track[];
  error?: string;
}

export default function MusicGuesser() {
  const [phase, setPhase] = useState<Phase>('home');
  const [mode, setMode] = useState<Mode>('daily');
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const today = getLocalDateString();
  const dailyResults = useMusicGuesserStore((s) => s.dailyResults);
  const stats = useMusicGuesserStore((s) => s.stats);
  const recordGame = useMusicGuesserStore((s) => s.recordGame);

  const todayResult = dailyResults[today];

  const startDaily = async () => {
    setMode('daily');
    setError(null);

    if (todayResult) {
      setPhase('results');
      return;
    }

    setPhase('loading');
    try {
      const data = await apiFetch<DailyResponse>(`/api/music/daily?date=${today}`);
      if (!data.success) throw new Error(data.error || 'Daily load failed');
      setGameState(buildInitialState(data.tracks, 'daily', today));
      setPhase('playing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily challenge');
      setPhase('home');
    }
  };

  const startPractice = () => {
    setMode('practice');
    setError(null);
    setPhase('picking');
  };

  const startPracticeWithPlaylist = async (playlistId: string) => {
    setError(null);
    setPhase('loading');
    try {
      const data = await apiFetch<{ success: boolean; tracks: Track[]; error?: string }>(
        `/api/music/playlist?id=${encodeURIComponent(playlistId)}`
      );
      if (!data.success) throw new Error(data.error || 'Playlist load failed');
      setGameState(buildInitialState(data.tracks, 'practice', undefined, playlistId));
      setPhase('playing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist');
      setPhase('picking');
    }
  };

  // When the in-game state finishes the last song, persist + transition to results.
  useEffect(() => {
    if (phase === 'playing' && gameState && isGameComplete(gameState)) {
      const lifelinesUsed = TOTAL_LIFELINES - gameState.lifelinesRemaining;
      recordGame({
        mode: gameState.mode,
        date: gameState.date,
        songResults: gameState.songResults,
        lifelinesUsed,
      });
      setPhase('results');
    }
  }, [phase, gameState, recordGame]);

  const handleBackHome = () => {
    setGameState(null);
    setError(null);
    setPhase('home');
  };

  if (phase === 'home') {
    return (
      <div className={styles.root}>
        <HomeScreen
          onPickDaily={startDaily}
          onPickPractice={startPractice}
          dailyAlreadyPlayed={!!todayResult}
          stats={stats}
        />
        {error && <div className={styles.errorBlock}>{error}</div>}
      </div>
    );
  }

  if (phase === 'picking') {
    return (
      <div className={styles.root}>
        <PlaylistPicker
          onPick={(id) => startPracticeWithPlaylist(id)}
          onBack={handleBackHome}
        />
        {error && <div className={styles.errorBlock}>{error}</div>}
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className={styles.root}>
        <div className={styles.loadingBlock}>
          Loading {mode === 'daily' ? "today's songs" : 'songs'}…
        </div>
      </div>
    );
  }

  if (phase === 'playing' && gameState) {
    return (
      <div className={styles.root}>
        <GameScreen
          state={gameState}
          onGuessCorrect={(selected) =>
            setGameState((s) => (s ? gameReducer(s, { type: 'guessCorrect', selected }) : s))
          }
          onGuessWrong={() =>
            setGameState((s) => (s ? gameReducer(s, { type: 'guessWrong' }) : s))
          }
          onSkip={() => setGameState((s) => (s ? gameReducer(s, { type: 'skip' }) : s))}
          onUseLifeline={(kind) =>
            setGameState((s) => (s ? gameReducer(s, { type: 'useLifeline', kind }) : s))
          }
          onNextSong={() =>
            setGameState((s) => (s ? gameReducer(s, { type: 'nextSong' }) : s))
          }
        />
      </div>
    );
  }

  if (phase === 'results') {
    // Two paths: viewing today's locked result from a previous play, or just-finished game.
    const viewingLocked = mode === 'daily' && !!todayResult && !gameState;
    const songResults = viewingLocked
      ? todayResult.songResults
      : gameState?.songResults ?? [];
    const lifelinesUsed = viewingLocked
      ? todayResult.lifelinesUsed
      : gameState
        ? TOTAL_LIFELINES - gameState.lifelinesRemaining
        : 0;

    return (
      <div className={styles.root}>
        <ResultsScreen
          mode={mode}
          songResults={songResults}
          lifelinesUsed={lifelinesUsed}
          dailyResult={mode === 'daily' ? todayResult : undefined}
          stats={stats}
          onPlayAgain={() => {
            setGameState(null);
            setPhase(mode === 'practice' ? 'picking' : 'home');
          }}
          onBackHome={handleBackHome}
        />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.loadingBlock}>Phase: {phase}.</div>
    </div>
  );
}
