export type Phase = 'home' | 'picking' | 'loading' | 'playing' | 'results';

export type Mode = 'daily' | 'practice';

export type LifelineKind = 'blur' | 'extend' | 'hint';

export type SongOutcome = 'correct' | 'failed' | 'skipped';

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  decade: string;
  genre: string;
  previewUrl: string;
}

export interface SearchResult {
  id: string;
  title: string;
  artist: string;
}

export interface SongResult {
  trackId: string;
  title: string;
  artist: string;
  outcome: SongOutcome;
  attemptsUsed: number;
  lifelinesUsed: LifelineKind[];
}

export interface GameState {
  mode: Mode;
  date?: string;
  playlistId?: string;
  tracks: Track[];
  currentIndex: number;
  attempt: number;
  lifelinesRemaining: number;
  lifelinesUsedThisSong: LifelineKind[];
  songResults: SongResult[];
  blurRevealed: boolean;
  extendActive: boolean;
  hintRevealed: boolean;
}

export interface DailyResult {
  date: string;
  correct: number;
  lifelinesUsed: number;
  perfect: boolean;
  songResults: SongResult[];
}

export interface LifetimeStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null;
}
