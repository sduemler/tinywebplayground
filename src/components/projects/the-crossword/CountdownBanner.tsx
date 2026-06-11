import styles from "./CountdownBanner.module.css";

interface Props {
  /** Target launch time. null ⇒ scheduled date not set yet ("coming soon"). */
  launchAt: Date | null;
  /** Current time in ms (driven by the parent's 1s tick). */
  now: number;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const clock = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

// Beyond this horizon we treat the date as "not really scheduled" (e.g. the
// seed sentinel) and show "coming soon" instead of an absurd ticking number.
const SCHEDULED_HORIZON_MS = 365 * 86400 * 1000;

export default function CountdownBanner({ launchAt, now }: Props) {
  const remaining = launchAt ? launchAt.getTime() - now : null;
  const scheduled = remaining !== null && remaining <= SCHEDULED_HORIZON_MS;

  return (
    <div className={styles.banner}>
      <span className={styles.label}>PUZZLE 2</span>
      {scheduled ? (
        <span className={styles.clock} aria-live="off">
          {formatRemaining(remaining!)}
        </span>
      ) : (
        <span className={styles.soon}>COMING SOON</span>
      )}
      <span className={styles.note}>—  solving unlocks at launch</span>
    </div>
  );
}
