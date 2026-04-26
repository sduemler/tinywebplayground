import type { GameState, LifelineKind, SearchResult, SongResult, Track } from './types';

export type GameAction =
  | { type: 'guessCorrect'; selected: SearchResult }
  | { type: 'guessWrong' }
  | { type: 'skip' }
  | { type: 'useLifeline'; kind: LifelineKind }
  | { type: 'nextSong' };

export const TOTAL_LIFELINES = 3;
export const MAX_ATTEMPTS = 3;

export function buildInitialState(
  tracks: Track[],
  mode: 'daily' | 'practice',
  date?: string,
  playlistId?: string
): GameState {
  return {
    mode,
    date,
    playlistId,
    tracks,
    currentIndex: 0,
    attempt: 0,
    lifelinesRemaining: TOTAL_LIFELINES,
    lifelinesUsedThisSong: [],
    songResults: [],
    blurRevealed: false,
    extendActive: false,
    hintRevealed: false,
  };
}

function recordResult(state: GameState, outcome: SongResult['outcome']): SongResult {
  const track = state.tracks[state.currentIndex];
  return {
    trackId: track.id,
    title: track.title,
    artist: track.artist,
    outcome,
    attemptsUsed: outcome === 'correct' ? state.attempt + 1 : state.attempt,
    lifelinesUsed: [...state.lifelinesUsedThisSong],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'guessCorrect': {
      const result = recordResult(state, 'correct');
      return { ...state, songResults: [...state.songResults, result] };
    }

    case 'guessWrong': {
      const nextAttempt = state.attempt + 1;
      if (nextAttempt >= MAX_ATTEMPTS) {
        const result = recordResult({ ...state, attempt: MAX_ATTEMPTS }, 'failed');
        return {
          ...state,
          attempt: MAX_ATTEMPTS,
          songResults: [...state.songResults, result],
        };
      }
      return { ...state, attempt: nextAttempt, extendActive: false };
    }

    case 'skip': {
      const result = recordResult(state, 'skipped');
      return { ...state, songResults: [...state.songResults, result] };
    }

    case 'useLifeline': {
      if (state.lifelinesRemaining <= 0) return state;
      if (state.lifelinesUsedThisSong.includes(action.kind)) return state;

      const next = {
        ...state,
        lifelinesRemaining: state.lifelinesRemaining - 1,
        lifelinesUsedThisSong: [...state.lifelinesUsedThisSong, action.kind],
      };
      if (action.kind === 'blur') next.blurRevealed = true;
      if (action.kind === 'extend') next.extendActive = true;
      if (action.kind === 'hint') next.hintRevealed = true;
      return next;
    }

    case 'nextSong': {
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        attempt: 0,
        lifelinesUsedThisSong: [],
        blurRevealed: false,
        extendActive: false,
        hintRevealed: false,
      };
    }
  }
}

export function isSongComplete(state: GameState): boolean {
  return state.songResults.length > state.currentIndex;
}

export function isGameComplete(state: GameState): boolean {
  return state.songResults.length >= state.tracks.length;
}
