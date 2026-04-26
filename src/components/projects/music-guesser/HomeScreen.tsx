import StatsPanel from './StatsPanel';
import styles from './MusicGuesser.module.css';
import type { LifetimeStats } from './types';

interface HomeScreenProps {
  onPickDaily: () => void;
  onPickPractice: () => void;
  dailyAlreadyPlayed: boolean;
  stats: LifetimeStats;
}

export default function HomeScreen({ onPickDaily, onPickPractice, dailyAlreadyPlayed, stats }: HomeScreenProps) {
  return (
    <>
      <h1 className={styles.title}>Music Guesser</h1>
      <p className={styles.subtitle}>
        Listen to a snippet, guess the song. Three tries, three lifelines, ten songs.
      </p>

      <div className={styles.modeGrid}>
        <button className={styles.modeCard} onClick={onPickDaily}>
          <h2 className={styles.modeCardTitle}>Daily Challenge</h2>
          <p className={styles.modeCardBody}>
            Same 10 songs for everyone today. Build a streak — come back tomorrow.
          </p>
          {dailyAlreadyPlayed && <span className={styles.modeCardBadge}>View today's result</span>}
        </button>

        <button className={styles.modeCard} onClick={onPickPractice}>
          <h2 className={styles.modeCardTitle}>Practice</h2>
          <p className={styles.modeCardBody}>
            Pick a curated playlist or paste your own Spotify playlist URL. Replay forever.
          </p>
        </button>
      </div>

      <StatsPanel stats={stats} />
    </>
  );
}
