import { useEffect, useRef, useState } from 'react';
import { fetchFreshPreview, isPreviewUrlFresh } from './utils';
import styles from './AudioPlayer.module.css';

interface AudioPlayerProps {
  /** Track identity used to resolve a fresh preview URL on demand. */
  title: string;
  artist: string;
  /** Preview URL baked into the game payload; used only while still unexpired. */
  fallbackUrl?: string;
  maxSeconds: number;
  /** Bumping this value forces playback to restart (e.g., on attempt change). */
  resetKey: number | string;
  volume?: number;
}

export default function AudioPlayer({
  title,
  artist,
  fallbackUrl,
  maxSeconds,
  resetKey,
  volume = 0.75,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  // Cache the resolved (fresh) URL across plays of the same song.
  const resolvedRef = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

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

  /** Returns a playable URL, reusing a fresh one or fetching a new token. */
  const resolveUrl = async (forceRefresh = false): Promise<string> => {
    if (!forceRefresh) {
      if (isPreviewUrlFresh(resolvedRef.current)) return resolvedRef.current!;
      if (isPreviewUrlFresh(fallbackUrl)) {
        resolvedRef.current = fallbackUrl!;
        return fallbackUrl!;
      }
    }
    const fresh = await fetchFreshPreview(title, artist);
    resolvedRef.current = fresh;
    return fresh;
  };

  const startPlayback = async (url: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.src !== url) audio.src = url;
    audio.currentTime = 0;
    audio.volume = volume;
    await audio.play();
    setPlaying(true);
    setError(false);
    stopTimerRef.current = window.setTimeout(() => stop(), maxSeconds * 1000);
  };

  const play = async () => {
    clearStopTimer();
    setError(false);
    setLoading(true);
    try {
      // First attempt with whatever we can resolve cheaply.
      await startPlayback(await resolveUrl());
    } catch {
      // The token may have expired (403) — force a brand-new one and retry once.
      try {
        await startPlayback(await resolveUrl(true));
      } catch {
        setPlaying(false);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // New song (or attempt) — reset playback and drop any cached URL for the song.
  useEffect(() => {
    stop();
    setError(false);
  }, [resetKey]);

  useEffect(() => {
    resolvedRef.current = null;
    setError(false);
  }, [title, artist]);

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
      <audio ref={audioRef} preload="none" />
      <button
        type="button"
        className={styles.playButton}
        onClick={playing ? stop : play}
        disabled={loading}
        aria-label={playing ? 'Stop' : 'Play snippet'}
      >
        {loading ? (
          <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true" className={styles.spinner}>
            <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="33" strokeDashoffset="10" />
          </svg>
        ) : playing ? (
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
      {error ? (
        <button type="button" className={styles.retryLabel} onClick={play}>
          Preview failed — retry
        </button>
      ) : (
        <span className={styles.timeLabel}>{maxSeconds}s</span>
      )}
    </div>
  );
}
