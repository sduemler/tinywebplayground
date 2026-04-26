import styles from './ResultsScreen.module.css';
import type { DailyResult, LifetimeStats, Mode, SongResult } from './types';

interface ResultsScreenProps {
  mode: Mode;
  songResults: SongResult[];
  lifelinesUsed: number;
  dailyResult?: DailyResult;
  stats: LifetimeStats;
  onPlayAgain: () => void;
  onBackHome: () => void;
}

export default function ResultsScreen({
  mode,
  songResults,
  lifelinesUsed,
  dailyResult,
  stats,
  onPlayAgain,
  onBackHome,
}: ResultsScreenProps) {
  const correct = songResults.filter((r) => r.outcome === 'correct').length;
  const total = songResults.length;
  const perfect = correct === total && total > 0;

  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  return (
    <div className={styles.root}>
      <div className={styles.summaryCard}>
        <h2 className={styles.heading}>{mode === 'daily' ? "Today's Result" : 'Practice Result'}</h2>
        {dailyResult && <div className={styles.subline}>{dailyResult.date}</div>}

        <div className={styles.scoreRow}>
          <div className={styles.scoreNumber}>
            {correct}
            <span className={styles.scoreSlash}> / {total}</span>
          </div>
          <div className={styles.scoreLabel}>correct</div>
        </div>

        {perfect && <div className={styles.perfectBadge}>★ Perfect game ★</div>}

        <div className={styles.metaRow}>
          <span>{lifelinesUsed} lifeline{lifelinesUsed === 1 ? '' : 's'} used</span>
        </div>

        <ol className={styles.songList}>
          {songResults.map((r, i) => (
            <li key={i} className={styles.songItem} data-outcome={r.outcome}>
              <span className={styles.songIndex}>{i + 1}.</span>
              <span className={styles.songTitle}>{r.title}</span>
              <span className={styles.songArtist}>{r.artist}</span>
              <span className={styles.songOutcome}>
                {r.outcome === 'correct' ? '✓' : r.outcome === 'skipped' ? '↷' : '✗'}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {mode === 'daily' && (
        <div className={styles.statsCard}>
          <h3 className={styles.statsHeading}>Lifetime stats</h3>
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.gamesPlayed}</div>
              <div className={styles.statLabel}>Games</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{winRate}%</div>
              <div className={styles.statLabel}>Win rate</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.currentStreak}</div>
              <div className={styles.statLabel}>Streak</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.maxStreak}</div>
              <div className={styles.statLabel}>Max streak</div>
            </div>
          </div>
          <p className={styles.comeBack}>Come back tomorrow for the next daily challenge.</p>
        </div>
      )}

      <div className={styles.buttonRow}>
        {mode === 'practice' && (
          <button type="button" className={styles.primaryButton} onClick={onPlayAgain}>
            Play another
          </button>
        )}
        <button type="button" className={styles.secondaryButton} onClick={onBackHome}>
          Back to home
        </button>
      </div>
    </div>
  );
}
