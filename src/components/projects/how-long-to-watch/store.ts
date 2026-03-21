import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchlistItem } from './types';

interface WatchlistStore {
  items: WatchlistItem[];
  addItem: (item: Omit<WatchlistItem, 'id'>) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  totalMinutes: () => number;
  hasMedia: (mediaId: number) => boolean;
}

export const useWatchlist = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => ({
          items: [
            ...state.items,
            { ...item, id: Math.random().toString(36).slice(2) + Date.now().toString(36) },
          ],
        })),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      clearAll: () => set({ items: [] }),

      totalMinutes: () => get().items.reduce((sum, i) => sum + i.totalMinutes, 0),

      hasMedia: (mediaId) => get().items.some((i) => i.mediaId === mediaId),
    }),
    { name: 'hltw-watchlist' }
  )
);
