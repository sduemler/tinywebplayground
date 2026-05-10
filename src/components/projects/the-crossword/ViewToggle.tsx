import { useCrosswordStore } from "./store";
import styles from "./ViewToggle.module.css";

export default function ViewToggle() {
  const view = useCrosswordStore((s) => s.view);
  const setView = useCrosswordStore((s) => s.setView);

  return (
    <div className={styles.toggle}>
      <button
        className={`${styles.btn} ${view === "grid" ? styles.active : ""}`}
        onClick={() => setView("grid")}
        aria-label="Grid view"
        title="Grid view"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="10" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="10" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <button
        className={`${styles.btn} ${view === "list" ? styles.active : ""}`}
        onClick={() => setView("list")}
        aria-label="List view"
        title="List view"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <line x1="1" y1="4" x2="17" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="1" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="1" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
