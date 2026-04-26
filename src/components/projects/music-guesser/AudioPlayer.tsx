import { useEffect, useRef, useState } from 'react';
import styles from './AudioPlayer.module.css';

interface AudioPlayerProps {
  src: string;
  maxSeconds: number;
  /** Bumping this value forces playback to restart (e.g., on attempt change). */
  resetKey: number | string;
}

export default function AudioPlayer({ src, maxSeconds, resetKey }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const clearStopTimer = () => {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const stop = () => {
    clearStopTimer();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
    setProgress(0);
  };

  const play = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    clearStopTimer();
    audio.currentTime = 0;
    try {
      await audio.play();
      setPlaying(true);
      stopTimerRef.current = window.setTimeout(() => stop(), maxSeconds * 1000);
    } catch {
      setPlaying(false);
    }
  };

  useEffect(() => {
    stop();
  }, [resetKey, src]);

  useEffect(() => () => stop(), []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onEnd = () => stop();
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  const fillPct = Math.min(100, (progress / maxSeconds) * 100);

  return (
    <div className={styles.player}>
      <audio ref={audioRef} src={src} preload="auto" />
      <button
        type="button"
        className={styles.playButton}
        onClick={playing ? stop : play}
        aria-label={playing ? 'Stop' : 'Play snippet'}
      >
        {playing ? (
          <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true">
            <rect x="5" y="4" width="3.5" height="12" fill="currentColor" />
            <rect x="11.5" y="4" width="3.5" height="12" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true">
            <path d="M5 3.5l11 6.5L5 16.5z" fill="currentColor" />
          </svg>
        )}
      </button>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${fillPct}%` }} />
      </div>
      <span className={styles.timeLabel}>{maxSeconds}s</span>
    </div>
  );
}
