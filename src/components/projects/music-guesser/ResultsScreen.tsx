import StatsPanel from './StatsPanel';
import { formatTapeDate, stripTitleSuffix } from './utils';
import styles from './ResultsScreen.module.css';
import ui from './ui.module.css';
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

const MARKS = {
  correct: { symbol: '✓', label: 'got it' },
  failed: { symbol: '✗', label: 'missed' },
  skipped: { symbol: '–', label: 'skipped' },
} as const;

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

  return (
    <div className={styles.root}>
      <article className={styles.insert}>
        <header className={styles.insertHead}>
          <h2 className={styles.heading}>
            {mode === 'daily' ? "Today's mix" : 'Practice tape'}
            {dailyResult && <span className={styles.date}>{formatTapeDate(dailyResult.date)}</span>}
          </h2>
          <div className={styles.score} aria-label={`${correct} out of ${total} correct`}>
            {correct}
            <span className={styles.scoreOf}>of {total}</span>
          </div>
        </header>

        {perfect && <div className={styles.perfect}>Perfect tape</div>}

        <ol className={styles.tracklist}>
          {songResults.map((r, i) => (
            <li key={i} className={styles.track} data-outcome={r.outcome}>
              <span className={styles.trackNo}>{i + 1}</span>
              <span className={styles.trackName}>
                {stripTitleSuffix(r.title)}
                <span className={styles.trackArtist}>{r.artist}</span>
              </span>
              <span className={styles.mark} aria-label={MARKS[r.outcome].label}>
                {MARKS[r.outcome].symbol}
              </span>
            </li>
          ))}
        </ol>

        <p className={styles.footnote}>
          {lifelinesUsed === 0
            ? 'No lifelines used.'
            : `${lifelinesUsed} lifeline${lifelinesUsed === 1 ? '' : 's'} used.`}
          {mode === 'daily' && ' A new tape arrives tomorrow.'}
        </p>
      </article>

      {mode === 'daily' && <StatsPanel stats={stats} />}

      <div className={styles.buttonRow}>
        {mode === 'practice' && (
          <button type="button" className={ui.primary} onClick={onPlayAgain}>
            Pick another tape
          </button>
        )}
        <button type="button" className={ui.secondary} onClick={onBackHome}>
          Back to start
        </button>
      </div>
    </div>
  );
}
