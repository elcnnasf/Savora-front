import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Persists the "Today's recommendation" choice so it stays fixed for the whole
// day per user (survives leaving/returning to the app), instead of reshuffling
// every time the Home screen regains focus.
export interface DailyPick {
  date: string;    // "YYYY-M-D"
  userId: string;
  recipeId: string;
}

interface DailyPickStore {
  pick: DailyPick | null;
  setPick: (p: DailyPick) => void;
}

export const useDailyPickStore = create<DailyPickStore>()(
  persist(
    (set) => ({
      pick: null,
      setPick: (pick) => set({ pick }),
    }),
    {
      name: 'savora-daily-pick',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function todayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
