import styles from "./SolveCounter.module.css";

interface Props {
  count: number;
}

export default function SolveCounter({ count }: Props) {
  return (
    <div className={styles.counter}>
      <span className={styles.number}>{count.toLocaleString()}</span>
      <span className={styles.label}>solved</span>
    </div>
  );
}
