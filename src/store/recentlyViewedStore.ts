import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiRecipe } from '../navigation/types';

const MAX_ITEMS = 10;

interface RecentlyViewedStore {
  recipes: ApiRecipe[];
  addRecipe: (recipe: ApiRecipe) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      recipes: [],
      addRecipe: (recipe) => {
        const current = get().recipes;
        const filtered = current.filter((r) => r.id !== recipe.id);
        set({ recipes: [recipe, ...filtered].slice(0, MAX_ITEMS) });
      },
      clear: () => set({ recipes: [] }),
    }),
    {
      name: 'savora-recently-viewed',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
