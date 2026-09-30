import styles from './StatsPanel.module.css';
import type { LifetimeStats } from './types';

interface StatsPanelProps {
  stats: LifetimeStats;
  heading?: string;
}

export default function StatsPanel({ stats, heading = 'Your daily tapes' }: StatsPanelProps) {
  if (stats.gamesPlayed === 0) return null;

  const winRate = Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
  const items = [
    { value: stats.gamesPlayed, label: 'Played' },
    { value: `${winRate}%`, label: 'Won' },
    { value: stats.currentStreak, label: 'Streak' },
    { value: stats.maxStreak, label: 'Best streak' },
  ];

  return (
    <section className={styles.panel} aria-label={heading}>
      <h3 className={styles.heading}>{heading}</h3>
      <div className={styles.grid}>
        {items.map((it) => (
          <div key={it.label} className={styles.stat}>
            <div className={styles.value}>{it.value}</div>
            <div className={styles.label}>{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
