import styles from "./CompletionOverlay.module.css";

interface Props {
  solveCount: number;
  onPlayTimelapse: () => void;
}

export default function CompletionOverlay({
  solveCount,
  onPlayTimelapse,
}: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h1 className={styles.title}>Congratulations!</h1>
        <p className={styles.stat}>
          All <strong>{solveCount}</strong> clues solved
        </p>
        <button className={styles.playBtn} onClick={onPlayTimelapse}>
          <span className={styles.playIcon}>▶</span>
          Watch the full timelapse
        </button>
        <div className={styles.comingSoon}>
          <p className={styles.comingSoonText}>Coming Soon</p>
          <p className={styles.comingSoonSub}>
            A new puzzle is being prepared. Check back later!
          </p>
        </div>
      </div>
    </div>
  );
}
