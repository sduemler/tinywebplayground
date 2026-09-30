import { useEffect, useRef, useState } from 'react';
import Cassette, { LINES_PER_SIDE, type TapeLine } from './Cassette';
import styles from './FlipCassette.module.css';

export interface TapeSide {
  letter: 'A' | 'B';
  lines: Array<TapeLine | null>;
  /** Slot of the song playing now, if it's on this side. */
  currentLine: number | null;
}

interface FlipCassetteProps {
  title: string;
  sides: TapeSide[];
  /** The side the game is on. */
  activeSide: number;
  /** Changes whenever the game moves on; the tape turns back to the active side. */
  resetKey: string;
  spinning: boolean;
  progress: number;
}

const FLIP_MS = 520;

/**
 * A cassette that can be turned over. It flips on its own when the game reaches
 * side B, and once side B is in play the player can tap it to look back at side A.
 */
export default function FlipCassette({ title, sides, activeSide, resetKey, spinning, progress }: FlipCassetteProps) {
  const [shown, setShown] = useState(activeSide);
  const [flipping, setFlipping] = useState(false);
  const shownRef = useRef(activeSide);
  const targetRef = useRef(activeSide);
  const flippingRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  // Half-turn, swap the label at the edge-on moment, finish the turn. Requests
  // that arrive mid-flip are picked up when it lands.
  const run = () => {
    if (flippingRef.current || targetRef.current === shownRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shownRef.current = targetRef.current;
      setShown(targetRef.current);
      return;
    }
    flippingRef.current = true;
    setFlipping(true);
    timersRef.current.push(
      window.setTimeout(() => {
        shownRef.current = targetRef.current;
        setShown(targetRef.current);
      }, FLIP_MS / 2),
      window.setTimeout(() => {
        flippingRef.current = false;
        setFlipping(false);
        run();
      }, FLIP_MS)
    );
  };

  const flipTo = (side: number) => {
    targetRef.current = side;
    run();
  };

  useEffect(() => {
    flipTo(activeSide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSide, resetKey]);

  useEffect(() => () => timersRef.current.forEach((t) => window.clearTimeout(t)), []);

  const side = sides[shown] ?? sides[0];
  const canPeek = sides.length > 1 && activeSide > 0;
  const other = shown === 0 ? 1 : 0;

  const tape = (
    <Cassette
      title={title}
      side={side.letter}
      lines={side.lines}
      currentLine={side.currentLine}
      firstNumber={shown * LINES_PER_SIDE + 1}
      spinning={spinning}
      progress={progress}
    />
  );

  return (
    <div className={styles.stage}>
      {canPeek ? (
        <button
          type="button"
          className={styles.flipper}
          data-flipping={flipping}
          onClick={() => flipTo(other)}
          aria-label={`Turn the tape over to side ${sides[other].letter}`}
        >
          {tape}
        </button>
      ) : (
        <div className={styles.flipper} data-flipping={flipping}>
          {tape}
        </div>
      )}
      {canPeek && (
        <p className={styles.hint}>
          {shown === activeSide ? 'Tap the tape to see side A' : 'Tap again to turn back to side B'}
        </p>
      )}
    </div>
  );
}
