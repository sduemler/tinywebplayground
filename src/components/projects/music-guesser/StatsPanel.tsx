import styles from './StatsPanel.module.css';
import type { LifetimeStats } from './types';

interface StatsPanelProps {
  stats: LifetimeStats;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  if (stats.gamesPlayed === 0) return null;

  const winRate = Math.round((stats.gamesWon / stats.gamesPlayed) * 100);

  return (
    <section className={styles.panel} aria-label="Lifetime stats">
      <h3 className={styles.heading}>Your stats</h3>
      <div className={styles.grid}>
        <div className={styles.stat}>
          <div className={styles.value}>{stats.gamesPlayed}</div>
          <div className={styles.label}>Games</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.value}>{winRate}%</div>
          <div className={styles.label}>Win rate</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.value}>{stats.currentStreak}</div>
          <div className={styles.label}>Streak</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.value}>{stats.maxStreak}</div>
          <div className={styles.label}>Max streak</div>
        </div>
      </div>
    </section>
  );
}
