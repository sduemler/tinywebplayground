import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./StatsCallout.module.css";

interface Props {
  birthYear: number;
}

// Rough global age-specific annual death rates (per 1,000 people).
// Source: WHO global mortality data (period rates, recent year), rounded.
const DEATH_RATES: Array<{ startAge: number; ratePerThousand: number }> = [
  { startAge: 0, ratePerThousand: 28 },
  { startAge: 1, ratePerThousand: 4.5 },
  { startAge: 5, ratePerThousand: 1.0 },
  { startAge: 10, ratePerThousand: 0.7 },
  { startAge: 15, ratePerThousand: 1.0 },
  { startAge: 20, ratePerThousand: 1.2 },
  { startAge: 25, ratePerThousand: 1.5 },
  { startAge: 30, ratePerThousand: 2.0 },
  { startAge: 35, ratePerThousand: 2.5 },
  { startAge: 40, ratePerThousand: 3.5 },
  { startAge: 45, ratePerThousand: 4.5 },
  { startAge: 50, ratePerThousand: 7.0 },
  { startAge: 55, ratePerThousand: 11.0 },
  { startAge: 60, ratePerThousand: 15.0 },
  { startAge: 65, ratePerThousand: 22.0 },
  { startAge: 70, ratePerThousand: 35.0 },
  { startAge: 75, ratePerThousand: 55.0 },
  { startAge: 80, ratePerThousand: 90.0 },
  { startAge: 85, ratePerThousand: 180.0 },
];

function deathRateAt(age: number): number {
  for (let i = DEATH_RATES.length - 1; i >= 0; i--) {
    if (age >= DEATH_RATES[i].startAge) return DEATH_RATES[i].ratePerThousand;
  }
  return DEATH_RATES[0].ratePerThousand;
}

// Approximate annual global births at decade markers (UN WPP, rounded).
const BIRTHS_BY_YEAR: Array<[number, number]> = [
  [1920, 80_000_000],
  [1930, 85_000_000],
  [1940, 90_000_000],
  [1950, 98_000_000],
  [1960, 115_000_000],
  [1970, 122_000_000],
  [1980, 128_000_000],
  [1990, 135_000_000],
  [2000, 133_000_000],
  [2010, 138_000_000],
  [2020, 135_000_000],
];

function estimatedGlobalBirths(year: number): number {
  const d = BIRTHS_BY_YEAR;
  if (year <= d[0][0]) return d[0][1];
  if (year >= d[d.length - 1][0]) return d[d.length - 1][1];
  for (let i = 0; i < d.length - 1; i++) {
    if (year >= d[i][0] && year <= d[i + 1][0]) {
      const t = (year - d[i][0]) / (d[i + 1][0] - d[i][0]);
      return d[i][1] + (d[i + 1][1] - d[i][1]) * t;
    }
  }
  return d[d.length - 1][1];
}

function survivorsAt(birthYear: number, age: number): number {
  let alive = estimatedGlobalBirths(birthYear);
  for (let a = 0; a < age; a++) {
    alive *= 1 - deathRateAt(a) / 1000;
  }
  return alive;
}

function formatRate(deathsPerSec: number): string {
  if (deathsPerSec <= 0) return "—";
  if (deathsPerSec >= 1) {
    return `≈ ${deathsPerSec.toFixed(1)} every second`;
  }
  const secsPerDeath = 1 / deathsPerSec;
  if (secsPerDeath < 60)
    return `≈ one every ${Math.round(secsPerDeath)} seconds`;
  if (secsPerDeath < 3600)
    return `≈ one every ${Math.round(secsPerDeath / 60)} minutes`;
  if (secsPerDeath < 86400)
    return `≈ one every ${Math.round(secsPerDeath / 3600)} hours`;
  return `≈ one every ${Math.round(secsPerDeath / 86400)} days`;
}

export default function LiveCounter({ birthYear }: Props) {
  const currentAge = new Date().getFullYear() - birthYear;

  const initial = useMemo(
    () => survivorsAt(birthYear, currentAge),
    [birthYear, currentAge],
  );
  const deathsPerSec = useMemo(() => {
    const annual = initial * (deathRateAt(currentAge) / 1000);
    return annual / (365.25 * 24 * 60 * 60);
  }, [initial, currentAge]);

  const mountRef = useRef<number>(Date.now());
  const [, setTick] = useState(0);

  useEffect(() => {
    mountRef.current = Date.now();
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [birthYear]);

  const elapsed = (Date.now() - mountRef.current) / 1000;
  const alive = Math.max(0, initial - elapsed * deathsPerSec);
  const display = Math.floor(alive).toLocaleString();

  return (
    <div className={styles.liveCounter}>
      <div className={styles.liveCounterText}>
        <p className={styles.liveCounterLabel}>
          <span className={styles.livePulse} aria-hidden="true" />
          People worldwide born in <strong>{birthYear}</strong>
        </p>
        <p className={styles.liveCounterSub}>
          who are still alive · global estimate
        </p>
      </div>
      <div className={styles.liveCounterValueGroup}>
        <p className={styles.liveCounterValue}>{display}</p>
        <p className={styles.liveCounterRate}>{formatRate(deathsPerSec)}</p>
      </div>
    </div>
  );
}
