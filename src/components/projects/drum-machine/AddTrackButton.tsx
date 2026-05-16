import styles from "./DrumMachine.module.css";

interface Props {
  onClick: () => void;
}

export default function AddTrackButton({ onClick }: Props) {
  return (
    <button
      type="button"
      className={styles.addTrack}
      onClick={onClick}
      aria-label="Add a track"
      title="Add a track"
    >
      <span className={styles.addTrackPlus} aria-hidden>
        +
      </span>
      <span className={styles.addTrackLabel}>Add Track</span>
    </button>
  );
}
