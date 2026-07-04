import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MealGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

export interface UserPreferences {
  dietary: string[];
  cuisines: string[];
  spiceLevel: string;
  allergies: string[];
  cookingSkill: string;
  prepTimePreference: string;
  budget: string;
  dislikedIngredients: string[];
  mealFrequency: number;
  servingSize: number;
  healthGoal: string;
  favoriteProteins: string[];
  /** kcal cap per meal; 0 = no limit */
  maxCaloriesPerMeal: number;
}

export interface MealReminderTimes {
  breakfast: string;
  lunch: string;
  dinner: string;
}

interface UserStore {
  mealGoals: MealGoals;
  preferences: UserPreferences;
  darkMode: boolean;
  mealReminders: boolean;
  mealReminderTimes: MealReminderTimes;
  recipeSuggestions: boolean;
  cookingTips: boolean;
  language: string;
  units: 'Metric' | 'Imperial';
  todayCaloriesConsumed: number;
  setMealGoals: (goals: Partial<MealGoals>) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  setDarkMode: (v: boolean) => void;
  setMealReminders: (v: boolean) => void;
  setMealReminderTimes: (v: MealReminderTimes) => void;
  setRecipeSuggestions: (v: boolean) => void;
  setCookingTips: (v: boolean) => void;
  setLanguage: (v: string) => void;
  setUnits: (v: 'Metric' | 'Imperial') => void;
  setTodayCaloriesConsumed: (v: number) => void;
  resetUserData: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      mealGoals: { calories: 2000, protein: 150, carbs: 200, fat: 65, water: 8 },
      preferences: {
        dietary: [],
        cuisines: [],
        spiceLevel: 'Medium',
        allergies: [],
        cookingSkill: 'Home Cook',
        prepTimePreference: '15-30 min',
        budget: 'Moderate',
        dislikedIngredients: [],
        mealFrequency: 3,
        servingSize: 2,
        healthGoal: 'No Goal',
        favoriteProteins: [],
        maxCaloriesPerMeal: 0,
      },
      darkMode: false,
      mealReminders: false,
      mealReminderTimes: { breakfast: '08:00', lunch: '13:00', dinner: '19:00' },
      recipeSuggestions: false,
      cookingTips: false,
      language: 'English',
      units: 'Metric',
      todayCaloriesConsumed: 0,
      setMealGoals:             (goals) => set((s) => ({ mealGoals:   { ...s.mealGoals,   ...goals } })),
      setPreferences:           (prefs) => set((s) => ({ preferences: { ...s.preferences, ...prefs } })),
      setDarkMode:              (v) => set({ darkMode: v }),
      setMealReminders:         (v) => set({ mealReminders: v }),
      setMealReminderTimes:     (v) => set({ mealReminderTimes: v }),
      setRecipeSuggestions:     (v) => set({ recipeSuggestions: v }),
      setCookingTips:           (v) => set({ cookingTips: v }),
      setLanguage:              (v) => set({ language: v }),
      setUnits:                 (v) => set({ units: v }),
      setTodayCaloriesConsumed: (v) => set({ todayCaloriesConsumed: v }),
      resetUserData: () => set({
        preferences: {
          dietary: [],
          cuisines: [],
          spiceLevel: 'Medium',
          allergies: [],
          cookingSkill: 'Home Cook',
          prepTimePreference: '15-30 min',
          budget: 'Moderate',
          dislikedIngredients: [],
          mealFrequency: 3,
          servingSize: 2,
          healthGoal: 'No Goal',
          favoriteProteins: [],
          maxCaloriesPerMeal: 0,
        },
        mealGoals: { calories: 2000, protein: 150, carbs: 200, fat: 65, water: 8 },
        todayCaloriesConsumed: 0,
        mealReminders: false,
        mealReminderTimes: { breakfast: '08:00', lunch: '13:00', dinner: '19:00' },
        recipeSuggestions: false,
        cookingTips: false,
      }),
    }),
    {
      name:    'savora-user-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
