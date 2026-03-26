import { useState, useRef, useCallback } from 'react';
import type { Boss } from './types';
import { usePetGuesser } from './store';
import styles from './PetGuesser.module.css';

interface Props {
  boss: Boss;
}

function simulateKills(dropRate: number): number {
  let kills = 0;
  do {
    kills++;
  } while (Math.floor(Math.random() * dropRate) + 1 !== 1);
  return kills;
}

export default function BossCard({ boss }: Props) {
  const result = usePetGuesser((s) => s.results[boss.id]);
  const simulatingBossId = usePetGuesser((s) => s.simulatingBossId);
  const setResult = usePetGuesser((s) => s.setResult);
  const setSimulating = usePetGuesser((s) => s.setSimulating);

  const [displayCount, setDisplayCount] = useState<number | null>(null);
  const rafRef = useRef<number>(0);

  const isSimulating = simulatingBossId === boss.id;
  const isComplete = !!result;
  const isDisabled = !!simulatingBossId || isComplete;

  const handleClick = useCallback(() => {
    if (isDisabled) return;

    const finalKc = simulateKills(boss.dropRate);
    setSimulating(boss.id);
    setDisplayCount(1);

    const duration = 2500;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayCount(Math.max(1, Math.round(eased * finalKc)));
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayCount(finalKc);
        setResult(boss.id, finalKc);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [boss.id, boss.dropRate, isDisabled, setResult, setSimulating]);

  const cardClass = [
    styles.bossCard,
    isSimulating ? styles.bossCardSimulating : '',
    isComplete ? styles.bossCardComplete : '',
    isDisabled && !isSimulating && !isComplete ? styles.bossCardDisabled : '',
  ].filter(Boolean).join(' ');

  return (
    <button className={cardClass} onClick={handleClick} disabled={isComplete}>
      <img
        src={boss.image}
        alt={boss.petName}
        className={styles.petImage}
      />
      {isSimulating && displayCount !== null && (
        <span className={styles.killCountAnimating}>
          {displayCount.toLocaleString()}
        </span>
      )}
      {isComplete && result && (
        <span className={styles.killCountFinal}>
          {result.killCount.toLocaleString()} kills
        </span>
      )}
      {!isSimulating && !isComplete && (
        <span className={styles.dropRate}>1/{boss.dropRate.toLocaleString()}</span>
      )}
      <span className={styles.bossName}>{boss.bossName}</span>
      <span className={styles.petName}>{boss.petName}</span>
    </button>
  );
}
