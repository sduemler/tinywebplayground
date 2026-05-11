import { useEffect, useState } from 'react';
import AlbumCover from './AlbumCover';
import AudioPlayer from './AudioPlayer';
import GuessInput from './GuessInput';
import ProgressBar from './ProgressBar';
import { MAX_ATTEMPTS } from './gameReducer';
import { getSnippetSeconds } from './utils';
import { useMusicGuesserStore } from './store';
import styles from './GameScreen.module.css';
import type { GameState, LifelineKind, SearchResult } from './types';

interface GameScreenProps {
  state: GameState;
  onGuessCorrect: (selected: SearchResult) => void;
  onGuessWrong: () => void;
  onSkip: () => void;
  onUseLifeline: (kind: LifelineKind) => void;
  onNextSong: () => void;
}

export default function GameScreen({
  state,
  onGuessCorrect,
  onGuessWrong,
  onSkip,
  onUseLifeline,
  onNextSong,
}: GameScreenProps) {
  const track = state.tracks[state.currentIndex];
  const songResult = state.songResults[state.currentIndex];
  const songFinished = !!songResult;

  const volume = useMusicGuesserStore((s) => s.volume);
  const setVolume = useMusicGuesserStore((s) => s.setVolume);
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null);
  const [wrongGuesses, setWrongGuesses] = useState<SearchResult[]>([]);

  useEffect(() => {
    setFeedback(null);
    setWrongGuesses([]);
  }, [state.currentIndex]);

  if (!track) return null;

  const coverState: 'hidden' | 'blurred' | 'revealed' = songFinished
    ? 'revealed'
    : state.blurRevealed
      ? 'blurred'
      : 'hidden';

  const snippetSeconds = getSnippetSeconds(state.attempt, state.extendActive);
  const attemptsLabel = `Attempt ${Math.min(state.attempt + 1, MAX_ATTEMPTS)} / ${MAX_ATTEMPTS}`;

  const handleGuess = (selected: SearchResult) => {
    if (selected.id === track.id) {
      setFeedback('right');
      onGuessCorrect(selected);
    } else {
      setFeedback('wrong');
      setWrongGuesses((prev) => [...prev, selected]);
      window.setTimeout(() => setFeedback(null), 800);
      onGuessWrong();
    }
  };

  return (
    <div className={styles.root}>
      <ProgressBar total={state.tracks.length} results={state.songResults} currentIndex={state.currentIndex} />

      <div className={styles.statusRow}>
        <span className={styles.songCounter}>
          Song {state.currentIndex + 1} / {state.tracks.length}
        </span>
      </div>

      {songFinished ? (
        <>
          <AlbumCover imageUrl={track.albumArt} state={coverState} />
          <div className={styles.revealBlock}>
            <div className={`${styles.revealBadge} ${styles[`badge_${songResult.outcome}`]}`}>
              {songResult.outcome === 'correct' ? 'Got it!' : songResult.outcome === 'failed' ? 'Out of attempts' : 'Skipped'}
            </div>
            <div className={styles.revealTitle}>{track.title}</div>
            <div className={styles.revealArtist}>{track.artist}</div>
            <button type="button" className={styles.nextButton} onClick={onNextSong}>
              {state.currentIndex + 1 >= state.tracks.length ? 'See results' : 'Next song →'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.playArea}>
            <div className={styles.volumeSlider}>
              <svg className={styles.volumeIcon} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                <path d="M10 3L5.5 7H2v6h3.5L10 17V3z" fill="currentColor" />
                <path d="M13 7.5a4 4 0 010 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M15 5.5a7 7 0 010 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
              <input
                type="range"
                className={styles.volumeRange}
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume"
              />
              <svg className={styles.volumeIcon} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                <path d="M10 3L5.5 7H2v6h3.5L10 17V3z" fill="currentColor" />
                <path d="M14 8l-4 4M10 8l4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            <div className={styles.coverWrapper}>
              <AlbumCover imageUrl={track.albumArt} state={coverState} />
            </div>

            <div className={styles.sidePanel}>
              <div className={styles.attemptLabel}>{attemptsLabel}</div>
              <fieldset className={styles.lifelinesField}>
                <legend className={styles.lifelinesLegend}>Lifelines</legend>
                <div className={styles.lifelineButtons}>
                  {(['blur', 'extend', 'hint'] as LifelineKind[]).map((kind) => {
                    const used = state.lifelinesUsedThisSong.includes(kind);
                    const noneLeft = state.lifelinesRemaining <= 0;
                    const label = kind === 'blur' ? 'Blur cover' : kind === 'extend' ? 'Extend to 30s' : 'Decade + genre';
                    return (
                      <button
                        key={kind}
                        type="button"
                        className={styles.lifelineButton}
                        disabled={used || noneLeft}
                        onClick={() => onUseLifeline(kind)}
                        data-used={used}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className={styles.lifelineRemaining}>
                  {state.lifelinesRemaining} left
                </div>
              </fieldset>
              <button type="button" className={styles.skipButton} onClick={onSkip}>
                Skip song
              </button>
            </div>
          </div>

          <AudioPlayer
            src={track.previewUrl}
            maxSeconds={snippetSeconds}
            resetKey={`${state.currentIndex}-${state.attempt}-${state.extendActive ? 'ext' : 'norm'}`}
            volume={volume}
          />

          {state.hintRevealed && (
            <div className={styles.hintBanner}>
              <span className={styles.hintLabel}>Hint:</span>
              <span>{track.decade}</span>
              {track.genre && track.genre !== 'unknown' && (
                <>
                  <span className={styles.hintDot}>•</span>
                  <span>{track.genre}</span>
                </>
              )}
            </div>
          )}

          {feedback === 'wrong' && <div className={styles.feedbackWrong}>Not quite — try again</div>}

          <GuessInput onSubmit={handleGuess} disabled={feedback === 'right'} currentTrack={track} />
          <button
            type="button"
            className={styles.skipGuessButton}
            onClick={onGuessWrong}
            disabled={feedback === 'right'}
          >
            {state.attempt + 1 >= MAX_ATTEMPTS ? 'Give up' : `Skip guess (${MAX_ATTEMPTS - state.attempt - 1} left)`}
          </button>
          {wrongGuesses.length > 0 && (
            <ul className={styles.wrongList}>
              {wrongGuesses.map((g, i) => (
                <li key={`${g.id}-${i}`} className={styles.wrongItem}>
                  <span className={styles.wrongX}>✗</span>
                  <span className={styles.wrongTitle}>{g.title}</span>
                  <span className={styles.wrongArtist}>{g.artist}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
