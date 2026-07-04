import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CookingProgressStore {
  progress: Record<string, number>; // recipeId → percent 0-100
  setProgress: (recipeId: string, percent: number) => void;
  clearProgress: (recipeId: string) => void;
  clearAll: () => void;
}

export const useCookingProgressStore = create<CookingProgressStore>()(
  persist(
    (set) => ({
      progress: {},
      setProgress: (recipeId, percent) =>
        set((s) => ({ progress: { ...s.progress, [recipeId]: percent } })),
      clearProgress: (recipeId) =>
        set((s) => {
          const next = { ...s.progress };
          delete next[recipeId];
          return { progress: next };
        }),
      clearAll: () => set({ progress: {} }),
    }),
    {
      name: 'savora-cooking-progress',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
