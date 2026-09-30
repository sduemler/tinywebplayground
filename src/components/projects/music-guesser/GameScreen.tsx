import { useEffect, useState } from 'react';
import AlbumCover from './AlbumCover';
import Deck from './Deck';
import GuessInput from './GuessInput';
import JCard from './JCard';
import ProgressBar from './ProgressBar';
import { MAX_ATTEMPTS } from './gameReducer';
import { formatTapeDate, getSnippetSeconds, stripTitleSuffix, titleBlanks } from './utils';
import { useMusicGuesserStore } from './store';
import styles from './GameScreen.module.css';
import ui from './ui.module.css';
import type { GameState, LifelineKind, SearchResult } from './types';

interface GameScreenProps {
  state: GameState;
  onGuessCorrect: (selected: SearchResult) => void;
  onGuessWrong: () => void;
  onSkip: () => void;
  onUseLifeline: (kind: LifelineKind) => void;
  onNextSong: () => void;
}

const OUTCOME_STAMP = {
  correct: 'Got it',
  failed: 'Missed',
  skipped: 'Skipped',
} as const;

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

  // Once the song is over, let the whole preview play.
  const snippetSeconds = songFinished ? 30 : getSnippetSeconds(state.attempt, state.extendActive);
  const trackNumber = state.currentIndex + 1;
  const isLast = trackNumber >= state.tracks.length;
  const spine =
    state.mode === 'daily' && state.date ? `Daily mix, ${formatTapeDate(state.date)}` : 'Practice tape';
  const guessesLeft = MAX_ATTEMPTS - state.attempt;

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

      <Deck
        title={track.title}
        artist={track.artist}
        fallbackUrl={track.previewUrl}
        maxSeconds={snippetSeconds}
        resetKey={`${state.currentIndex}-${state.attempt}-${state.extendActive ? 'ext' : 'norm'}-${songFinished}`}
        volume={volume}
        onVolumeChange={setVolume}
        cassetteLabel={`Track ${trackNumber}`}
        cassetteNote={`of ${state.tracks.length} on this tape`}
        lifelines={
          songFinished
            ? undefined
            : {
                remaining: state.lifelinesRemaining,
                usedThisSong: state.lifelinesUsedThisSong,
                onUse: onUseLifeline,
              }
        }
        onSkipSong={songFinished ? undefined : onSkip}
      />

      <JCard front={<AlbumCover imageUrl={track.albumArt} state={coverState} />} spine={spine}>
        {songFinished ? (
          <div className={styles.reveal}>
            <span className={styles.stamp} data-outcome={songResult.outcome}>
              {OUTCOME_STAMP[songResult.outcome]}
            </span>
            <div className={styles.revealTitle}>{stripTitleSuffix(track.title)}</div>
            <div className={styles.revealArtist}>{track.artist}</div>
            <button type="button" className={`${ui.primary} ${styles.nextButton}`} onClick={onNextSong}>
              {isLast ? 'See your tape' : `On to track ${trackNumber + 1}`}
            </button>
          </div>
        ) : (
          <>
            <p className={styles.tries}>
              {guessesLeft} {guessesLeft === 1 ? 'guess' : 'guesses'} left
            </p>

            {state.hintRevealed && (
              <div className={styles.blanks} aria-label={`Title blanks: ${titleBlanks(track.title).length} words`}>
                {titleBlanks(track.title).map((word, wi) => (
                  <span key={wi} className={styles.blankWord}>
                    {word.map((ch, ci) => (
                      <span key={ci} className={ch === '_' ? styles.blank : styles.blankShown}>
                        {ch === '_' ? '' : ch}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            )}

            {wrongGuesses.length > 0 ? (
              <ul className={styles.wrongList} aria-label="Wrong guesses">
                {wrongGuesses.map((g, i) => (
                  <li key={`${g.id}-${i}`} className={styles.wrongItem}>
                    <s>
                      {g.title}, {g.artist}
                    </s>
                  </li>
                ))}
              </ul>
            ) : (
              !state.hintRevealed && (
                <p className={styles.emptyNote}>Press play, then search for the song below.</p>
              )
            )}
          </>
        )}
      </JCard>

      {!songFinished && (
        <div className={styles.guessArea}>
          {feedback === 'wrong' && <div className={styles.feedbackWrong}>Not that one.</div>}
          <GuessInput onSubmit={handleGuess} disabled={feedback === 'right'} currentTrack={track} />
          <button
            type="button"
            className={`${ui.quiet} ${styles.skipGuessButton}`}
            onClick={onGuessWrong}
            disabled={feedback === 'right'}
          >
            {guessesLeft <= 1 ? 'Give up on this song' : 'Pass and hear more'}
          </button>
        </div>
      )}
    </div>
  );
}
