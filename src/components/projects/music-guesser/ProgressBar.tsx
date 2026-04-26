import styles from './ProgressBar.module.css';
import type { SongResult } from './types';

interface ProgressBarProps {
  total: number;
  results: SongResult[];
  currentIndex: number;
}

export default function ProgressBar({ total, results, currentIndex }: ProgressBarProps) {
  const dots = Array.from({ length: total }, (_, i) => {
    const result = results[i];
    let state: 'pending' | 'current' | 'correct' | 'failed' | 'skipped' = 'pending';
    if (result) state = result.outcome;
    else if (i === currentIndex) state = 'current';
    return state;
  });

  return (
    <div className={styles.row} role="progressbar" aria-valuenow={results.length} aria-valuemax={total}>
      {dots.map((s, i) => (
        <span key={i} className={styles.dot} data-state={s} aria-label={`Song ${i + 1}: ${s}`} />
      ))}
    </div>
  );
}
