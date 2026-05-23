import styles from "./StatsCallout.module.css";
import LiveCounter from "./LiveCounter";
import type { SurvivalStats } from "./lifespan";
import type { Sex } from "./types";

interface Props {
  stats: SurvivalStats;
  birthYear: number;
  sex: Sex;
  countryName: string;
  dataYear: number;
}

function descriptor(sex: Sex): string {
  if (sex === "F") return "women";
  if (sex === "M") return "men";
  return "people";
}

export default function StatsCallout({
  stats,
  birthYear,
  sex,
  countryName,
}: Props) {
  const pctRounded =
    stats.pctOfCohortStillAlive >= 99.5
      ? "99+"
      : stats.pctOfCohortStillAlive.toFixed(
          stats.pctOfCohortStillAlive < 10 ? 1 : 0,
        );

  return (
    <div className={styles.root}>
      <p className={styles.summaryLine}>
        Of all the <strong>{descriptor(sex)}</strong> born in{" "}
        <strong>{birthYear}</strong> in <strong>{countryName}</strong>,{" "}
        <em>{pctRounded}%</em> are still here with you.
      </p>

      <div className={styles.statRow}>
        <div className={styles.statBox}>
          <p className={styles.statLabel}>Still here</p>
          <p className={styles.statValue}>
            {pctRounded}
            <span className={styles.statValueSuffix}>%</span>
          </p>
          <p className={styles.statSub}>of your cohort</p>
        </div>
        <div className={styles.statBox}>
          <p className={styles.statLabel}>Median death age</p>
          <p className={styles.statValue}>{stats.medianDeathAge}</p>
          <p className={styles.statSub}>for folks your age now</p>
        </div>
        <div className={styles.statBox}>
          <p className={styles.statLabel}>Years to median</p>
          <p className={styles.statValue}>
            {stats.medianRemainingYears > 0
              ? `~${stats.medianRemainingYears}`
              : "0"}
          </p>
          <p className={styles.statSub}>statistically speaking</p>
        </div>
      </div>

      <LiveCounter birthYear={birthYear} />
    </div>
  );
}
