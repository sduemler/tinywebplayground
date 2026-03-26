import { useMemo } from 'react';
import { usePetGuesser } from './store';
import { bosses } from './bosses';
import styles from './PetGuesser.module.css';

export default function StatsBar() {
  const results = usePetGuesser((s) => s.results);

  const stats = useMemo(() => {
    const entries = Object.values(results);
    if (entries.length === 0) return null;

    const totalKills = entries.reduce((sum, r) => sum + r.killCount, 0);
    const petCount = entries.length;

    const most = entries.reduce((a, b) => (a.killCount >= b.killCount ? a : b));
    const least = entries.reduce((a, b) => (a.killCount <= b.killCount ? a : b));

    const mostBoss = bosses.find((b) => b.id === most.bossId);
    const leastBoss = bosses.find((b) => b.id === least.bossId);

    // Find the result closest to its projected drop rate
    let closestEntry = entries[0];
    let closestDiff = Infinity;
    for (const entry of entries) {
      const boss = bosses.find((b) => b.id === entry.bossId);
      if (!boss) continue;
      const diff = Math.abs(entry.killCount - boss.dropRate);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestEntry = entry;
      }
    }
    const closestBoss = bosses.find((b) => b.id === closestEntry.bossId);

    return {
      totalKills,
      petCount,
      most: { name: mostBoss?.bossName ?? '?', kills: most.killCount },
      least: { name: leastBoss?.bossName ?? '?', kills: least.killCount },
      closest: { name: closestBoss?.petName ?? '?', kills: closestEntry.killCount, rate: closestBoss?.dropRate ?? 0 },
    };
  }, [results]);

  if (!stats) return null;

  return (
    <div className={styles.statsBar}>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Total Kills</span>
        <span className={styles.statValue}>{stats.totalKills.toLocaleString()}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Pets</span>
        <span className={styles.statValue}>{stats.petCount}/{bosses.length}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Most Kills</span>
        <span className={styles.statValue}>{stats.most.name} ({stats.most.kills.toLocaleString()})</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Least Kills</span>
        <span className={styles.statValue}>{stats.least.name} ({stats.least.kills.toLocaleString()})</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Closest to Rate</span>
        <span className={styles.statValue}>{stats.closest.name} ({stats.closest.kills.toLocaleString()}/1:{stats.closest.rate.toLocaleString()})</span>
      </div>
    </div>
  );
}
