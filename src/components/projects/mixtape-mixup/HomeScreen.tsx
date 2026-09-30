import { useState } from 'react';
import Cassette from './Cassette';
import StatsPanel from './StatsPanel';
import { GAME_NAME } from './brand';
import { formatTapeDate, getLocalDateString } from './utils';
import styles from './MixtapeMixup.module.css';
import type { LifetimeStats } from './types';

interface HomeScreenProps {
  onPickDaily: () => void;
  onPickPractice: () => void;
  dailyAlreadyPlayed: boolean;
  stats: LifetimeStats;
}

type TapeId = 'daily' | 'practice';

export default function HomeScreen({ onPickDaily, onPickPractice, dailyAlreadyPlayed, stats }: HomeScreenProps) {
  // Reels turn under the pointer or keyboard focus, like picking a tape up.
  const [active, setActive] = useState<TapeId | null>(null);
  const hoverProps = (id: TapeId) => ({
    onMouseEnter: () => setActive(id),
    onMouseLeave: () => setActive(null),
    onFocus: () => setActive(id),
    onBlur: () => setActive(null),
  });

  return (
    <>
      <header className={styles.hero}>
        <h1 className={styles.title}>{GAME_NAME}</h1>
        <p className={styles.subtitle}>
          Hear a few seconds of a song and name it. Ten songs a tape, three guesses each, and three
          lifelines to spend.
        </p>
      </header>

      <div className={styles.tapes}>
        <button type="button" className={styles.tapeButton} onClick={onPickDaily} {...hoverProps('daily')}>
          <Cassette
            title={`Today's mix, ${formatTapeDate(getLocalDateString())}`}
            side="A"
            spinning={active === 'daily'}
          />
          <span className={styles.tapeCaption}>
            {dailyAlreadyPlayed
              ? "You've played today's tape. See how you did."
              : 'The same ten songs for everyone today. A new tape tomorrow.'}
          </span>
        </button>

        <button type="button" className={styles.tapeButton} onClick={onPickPractice} {...hoverProps('practice')}>
          <Cassette
            title="Practice tape"
            side="B"
            spinning={active === 'practice'}
            stripes={['#c9b37a', '#8aa84a', '#5d6b2a']}
          />
          <span className={styles.tapeCaption}>
            Choose a playlist or paste your own Spotify link. Play as often as you like.
          </span>
        </button>
      </div>

      <StatsPanel stats={stats} />
    </>
  );
}
