import { useEffect, useState } from 'react';
import AlbumCover from './AlbumCover';
import AudioPlayer from './AudioPlayer';
import GuessInput from './GuessInput';
import ProgressBar from './ProgressBar';
import { MAX_ATTEMPTS } from './gameReducer';
import { getSnippetSeconds } from './utils';
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

  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null);

  useEffect(() => {
    setFeedback(null);
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
        <span className={styles.attemptCounter}>{songFinished ? '—' : attemptsLabel}</span>
      </div>

      <AlbumCover imageUrl={track.albumArt} state={coverState} />

      {songFinished ? (
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
      ) : (
        <>
          <AudioPlayer
            src={track.previewUrl}
            maxSeconds={snippetSeconds}
            resetKey={`${state.currentIndex}-${state.attempt}-${state.extendActive ? 'ext' : 'norm'}`}
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

          <GuessInput onSubmit={handleGuess} disabled={feedback === 'right'} />

          <div className={styles.lifelineRow}>
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
            <span className={styles.lifelineRemaining}>
              {state.lifelinesRemaining} lifeline{state.lifelinesRemaining === 1 ? '' : 's'} left
            </span>
          </div>

          <button type="button" className={styles.skipButton} onClick={onSkip}>
            Skip song (counts as failed)
          </button>
        </>
      )}
    </div>
  );
}
