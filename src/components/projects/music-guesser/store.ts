import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DailyResult, LifetimeStats, Mode, SongResult } from './types';

const WIN_THRESHOLD = 5;

interface MusicGuesserStore {
  dailyResults: Record<string, DailyResult>;
  stats: LifetimeStats;
  recordGame: (params: {
    mode: Mode;
    date?: string;
    songResults: SongResult[];
    lifelinesUsed: number;
  }) => void;
}

const emptyStats: LifetimeStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: null,
};

function previousDateString(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const useMusicGuesserStore = create<MusicGuesserStore>()(
  persist(
    (set, get) => ({
      dailyResults: {},
      stats: emptyStats,

      recordGame: ({ mode, date, songResults, lifelinesUsed }) => {
        if (mode !== 'daily' || !date) return;
        if (get().dailyResults[date]) return; // already recorded

        const correct = songResults.filter((r) => r.outcome === 'correct').length;
        const perfect = correct === songResults.length;

        const result: DailyResult = {
          date,
          correct,
          lifelinesUsed,
          perfect,
          songResults,
        };

        const prev = get().stats;
        const won = correct >= WIN_THRESHOLD;
        const continuingStreak = prev.lastPlayedDate === previousDateString(date);
        const newStreak = won ? (continuingStreak ? prev.currentStreak + 1 : 1) : 0;

        set({
          dailyResults: { ...get().dailyResults, [date]: result },
          stats: {
            gamesPlayed: prev.gamesPlayed + 1,
            gamesWon: prev.gamesWon + (won ? 1 : 0),
            currentStreak: newStreak,
            maxStreak: Math.max(prev.maxStreak, newStreak),
            lastPlayedDate: date,
          },
        });
      },
    }),
    { name: 'music-guesser' }
  )
);

export const WIN_THRESHOLD_VALUE = WIN_THRESHOLD;
