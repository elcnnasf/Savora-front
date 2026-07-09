import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Minimal recipe snapshot needed to render a "Continue where you left off" card.
// Kept in this store (not recentlyViewed, which is capped at 10 and evicts) so a
// half-finished recipe survives independently.
export interface InProgressCard {
  id: string;
  title: string;
  image_url?: string;
  cook_time?: number;
}

interface CookingProgressStore {
  progress: Record<string, number>;                                   // recipeId → percent 0-100
  snapshots: Record<string, { card: InProgressCard; updatedAt: number }>;
  setProgress: (recipeId: string, percent: number) => void;
  /** Record the recipe card when cooking starts, so Continue can show it. */
  registerInProgress: (card: InProgressCard) => void;
  clearProgress: (recipeId: string) => void;
  clearAll: () => void;
}

export const useCookingProgressStore = create<CookingProgressStore>()(
  persist(
    (set) => ({
      progress: {},
      snapshots: {},

      setProgress: (recipeId, percent) =>
        set((s) => {
          const snap = s.snapshots[recipeId];
          return {
            progress: { ...s.progress, [recipeId]: percent },
            // bump recency so the most recently touched recipe sorts to the top
            snapshots: snap
              ? { ...s.snapshots, [recipeId]: { ...snap, updatedAt: Date.now() } }
              : s.snapshots,
          };
        }),

      registerInProgress: (card) =>
        set((s) => ({
          snapshots: { ...s.snapshots, [card.id]: { card, updatedAt: Date.now() } },
        })),

      clearProgress: (recipeId) =>
        set((s) => {
          const progress = { ...s.progress };
          const snapshots = { ...s.snapshots };
          delete progress[recipeId];
          delete snapshots[recipeId];
          return { progress, snapshots };
        }),

      clearAll: () => set({ progress: {}, snapshots: {} }),
    }),
    {
      name: 'savora-cooking-progress',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
