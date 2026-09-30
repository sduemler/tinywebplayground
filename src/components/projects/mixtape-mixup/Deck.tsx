import { useEffect, useRef, useState } from 'react';
import FlipCassette, { type TapeSide } from './FlipCassette';
import { fetchFreshPreview, isPreviewUrlFresh } from './utils';
import styles from './Deck.module.css';
import type { LifelineKind } from './types';

const PREVIEW_SECONDS = 30;

export const LIFELINE_LABELS: Record<LifelineKind, string> = {
  blur: 'Blurry cover',
  extend: 'Play 30s',
  hint: 'Title blanks',
};

interface DeckProps {
  /** Track identity used to resolve a fresh preview URL on demand. */
  title: string;
  artist: string;
  /** Preview URL baked into the game payload; used only while still unexpired. */
  fallbackUrl?: string;
  maxSeconds: number;
  /** Bumping this value forces playback to restart (e.g., on attempt change). */
  resetKey: number | string;
  volume: number;
  onVolumeChange: (v: number) => void;
  /** What's written on the cassette, per side. */
  tape: {
    title: string;
    sides: TapeSide[];
    activeSide: number;
    resetKey: string;
  };
  /** Omit once the song is over: the lifeline and skip keys are hidden. */
  lifelines?: {
    remaining: number;
    usedThisSong: LifelineKind[];
    onUse: (kind: LifelineKind) => void;
  };
  onSkipSong?: () => void;
}

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function KeyIcon({ kind }: { kind: 'play' | 'stop' | 'skip' | LifelineKind }) {
  const common = {
    viewBox: '0 0 20 20',
    width: 18,
    height: 18,
    'aria-hidden': true,
  } as const;
  switch (kind) {
    case 'play':
      return (
        <svg {...common}>
          <path d="M6 4l10 6-10 6z" fill="currentColor" />
        </svg>
      );
    case 'stop':
      return (
        <svg {...common}>
          <rect x="5" y="5" width="10" height="10" fill="currentColor" />
        </svg>
      );
    case 'skip':
      return (
        <svg {...common}>
          <path d="M3 4l7 6-7 6zM10 4l7 6-7 6z" fill="currentColor" />
        </svg>
      );
    case 'blur':
      return (
        <svg {...common}>
          <rect
            x="3"
            y="3"
            width="14"
            height="14"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeDasharray="2.5 2"
          />
          <circle cx="10" cy="10" r="3" fill="currentColor" opacity="0.6" />
        </svg>
      );
    case 'extend':
      return (
        <svg {...common}>
          <path
            d="M2 10h10M9 6l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M16 4v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'hint':
      return (
        <svg {...common}>
          <path d="M3 15h3M8.5 15h3M14 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M3.5 11l2-6 2 6M4.2 9h2.6"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export default function Deck({
  title,
  artist,
  fallbackUrl,
  maxSeconds,
  resetKey,
  volume,
  onVolumeChange,
  tape,
  lifelines,
  onSkipSong,
}: DeckProps) {
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

  // New song (or attempt) — reset playback.
  useEffect(() => {
    stop();
    setError(false);
  }, [resetKey]);

  // New song — drop any cached URL.
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

  const clipPct = Math.min(100, (maxSeconds / PREVIEW_SECONDS) * 100);
  const playedPct = Math.min(100, (progress / PREVIEW_SECONDS) * 100);

  return (
    <div className={styles.deck}>
      <audio ref={audioRef} preload="none" />

      <div className={styles.well}>
        <FlipCassette {...tape} spinning={playing} progress={progress / PREVIEW_SECONDS} />
      </div>

      <div className={styles.controls}>
        <div className={styles.meterRow}>
          <div className={styles.counter} aria-live="off">
            <span className={styles.counterDigits}>{formatClock(progress)}</span>
            <span className={styles.counterOf}>of {formatClock(maxSeconds)}</span>
          </div>
          <div
            className={styles.tapeTrack}
            role="progressbar"
            aria-label="Clip playback"
            aria-valuemin={0}
            aria-valuemax={maxSeconds}
            aria-valuenow={Math.round(progress)}
          >
            <div className={styles.tapeClip} style={{ width: `${clipPct}%` }} />
            <div className={styles.tapePlayed} style={{ width: `${playedPct}%` }} />
          </div>
          <label className={styles.volume}>
            <span className={styles.volumeLabel}>Vol</span>
            <input
              type="range"
              className={styles.volumeRange}
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Volume"
            />
          </label>
        </div>

        {error && (
          <button type="button" className={styles.errorNote} onClick={play}>
            The clip didn't load. Press to try again.
          </button>
        )}

        <div className={styles.keys} data-full={!!lifelines}>
          <button
            type="button"
            className={`${styles.key} ${styles.keyPlay}`}
            onClick={playing ? stop : play}
            disabled={loading}
            aria-pressed={playing}
            style={{ gridArea: 'play' }}
          >
            <KeyIcon kind={playing ? 'stop' : 'play'} />
            <span className={styles.keyText}>
              {loading ? 'Loading' : playing ? 'Stop' : `Play ${maxSeconds}s`}
            </span>
          </button>

          {lifelines &&
            (['blur', 'extend', 'hint'] as LifelineKind[]).map((kind) => {
              const used = lifelines.usedThisSong.includes(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  className={`${styles.key} ${styles.keyLifeline}`}
                  disabled={used || lifelines.remaining <= 0}
                  aria-pressed={used}
                  onClick={() => lifelines.onUse(kind)}
                  style={{ gridArea: kind }}
                >
                  <KeyIcon kind={kind} />
                  <span className={styles.keyText}>{LIFELINE_LABELS[kind]}</span>
                </button>
              );
            })}

          {onSkipSong && (
            <button
              type="button"
              className={`${styles.key} ${styles.keySkip}`}
              onClick={onSkipSong}
              style={{ gridArea: 'skip' }}
            >
              <KeyIcon kind="skip" />
              <span className={styles.keyText}>Skip song</span>
            </button>
          )}
        </div>

        {lifelines && (
          <p className={styles.lifelineNote}>
            {lifelines.remaining === 0
              ? 'No lifelines left for this tape'
              : `${lifelines.remaining} lifeline${lifelines.remaining === 1 ? '' : 's'} left for this tape`}
          </p>
        )}
      </div>
    </div>
  );
}
