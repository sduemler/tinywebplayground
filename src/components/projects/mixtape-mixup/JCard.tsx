import type { ReactNode } from 'react';
import styles from './JCard.module.css';

interface JCardProps {
  /** Front panel, usually the album cover. */
  front: ReactNode;
  /** Short handwritten text along the spine. */
  spine: string;
  children: ReactNode;
}

/** The folded paper insert from a cassette case: front panel, spine, then the inside flap. */
export default function JCard({ front, spine, children }: JCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.front}>{front}</div>
      <div className={styles.spine}>
        <span className={styles.spineText}>{spine}</span>
      </div>
      <div className={styles.flap}>{children}</div>
    </div>
  );
}
