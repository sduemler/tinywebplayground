import { bosses } from './bosses';
import { usePetGuesser } from './store';
import BossCard from './BossCard';
import StatsBar from './StatsBar';
import styles from './PetGuesser.module.css';

export default function PetGuesser() {
  const resetAll = usePetGuesser((s) => s.resetAll);
  const hasResults = usePetGuesser((s) => Object.keys(s.results).length > 0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <p className={styles.description}>
          Click a boss to simulate your pet drop RNG. How lucky will you be?
        </p>
        {hasResults && (
          <button className={styles.resetBtn} onClick={resetAll}>
            Reset All
          </button>
        )}
      </div>

      <div className={styles.bossGrid}>
        {bosses.map((boss) => (
          <BossCard key={boss.id} boss={boss} />
        ))}
      </div>

      <StatsBar />
    </div>
  );
}
