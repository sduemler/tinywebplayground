import styles from "./DrumMachine.module.css";

interface Props {
  on: boolean;
  isCurrent: boolean;
  isPlaying: boolean;
  isFirstOfBar: boolean;
  onToggle: () => void;
  ariaLabel: string;
}

export default function BeatPad({
  on,
  isCurrent,
  isPlaying,
  isFirstOfBar,
  onToggle,
  ariaLabel,
}: Props) {
  const classes = [
    styles.pad,
    on ? styles.padOn : "",
    isCurrent && isPlaying ? styles.padCurrent : "",
    isFirstOfBar ? styles.padDownbeat : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      onClick={onToggle}
      aria-pressed={on}
      aria-label={ariaLabel}
    />
  );
}
