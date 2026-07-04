import { apiFetch } from './client';
import { ApiRecipe } from '../navigation/types';
import { UserPreferences } from '../store/userStore';

export interface AiPreferences {
  dietary_restrictions?: string[];
  cuisine?: string;
  max_cook_time?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  allergies?: string[];
  disliked_ingredients?: string[];
  spice_level?: string;
  favorite_proteins?: string[];
  health_goal?: string;
  max_calories_per_meal?: number;
}

const PREP_TIME_TO_MINUTES: Record<string, number> = {
  'Quick (<15 min)': 15, '15-30 min': 30, '30-60 min': 60, 'Long (60+ min)': 120,
};

/** Map the full Taste Preferences profile onto the AI request shape. */
export function buildAiPreferences(prefs: UserPreferences): AiPreferences {
  return {
    dietary_restrictions:  (prefs.dietary ?? []).length > 0 ? prefs.dietary : undefined,
    cuisine:               (prefs.cuisines ?? [])[0],
    max_cook_time:         PREP_TIME_TO_MINUTES[prefs.prepTimePreference] ?? undefined,
    servings:              prefs.servingSize ?? 2,
    allergies:             (prefs.allergies ?? []).length > 0 ? prefs.allergies : undefined,
    disliked_ingredients:  (prefs.dislikedIngredients ?? []).length > 0 ? prefs.dislikedIngredients : undefined,
    spice_level:           prefs.spiceLevel,
    favorite_proteins:     (prefs.favoriteProteins ?? []).length > 0 ? prefs.favoriteProteins : undefined,
    health_goal:           prefs.healthGoal && prefs.healthGoal !== 'No Goal' ? prefs.healthGoal : undefined,
    max_calories_per_meal: prefs.maxCaloriesPerMeal || undefined,
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  success: boolean;
  data: { reply: string };
}

interface GenerateRecipeResponse {
  success: boolean;
  data: ApiRecipe;
}

export function sendChatMessage(message: string, history: ChatMessage[], language?: string) {
  return apiFetch<ChatResponse>('/ai/chat', {
    method: 'POST',
    body: { message, history, language },
  });
}

export interface MealPlanParams {
  week_start: string;
  location?: string;
  budget?: 'budget' | 'moderate' | 'premium';
  calorie_goal?: number;
  dietary_preferences?: string[];
  spice_level?: string;
  cuisine_preference?: string;
  language?: string;
  allergies?: string[];
  disliked_ingredients?: string[];
  favorite_proteins?: string[];
  meals_per_day?: number;
  health_goal?: string;
}

export function generateMealPlan(params: MealPlanParams) {
  return apiFetch<{ success: boolean; data: { inserted: number } }>('/ai/meal-plan', {
    method: 'POST',
    body: params,
  });
}

export function scanIngredients(imageBase64: string) {
  return apiFetch<{ success: boolean; data: { ingredients: string[] } }>('/ai/scan-ingredients', {
    method: 'POST',
    body: { image_base64: imageBase64 },
  });
}

export interface RecipeSuggestion {
  name: string;      // user's language
  nameEn: string;    // English (used for recipe generation)
  description: string;
  mainIngredients: string[];
  cuisine: string;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SuggestRecipesResponse {
  success: boolean;
  data: { suggestions: RecipeSuggestion[] };
}

export function suggestRecipes(params: { query: string; language?: string }) {
  return apiFetch<SuggestRecipesResponse>('/ai/suggest-recipes', {
    method: 'POST',
    body: params,
  });
}

export function generateRecipe(params: {
  description?: string;
  ingredients?: string[];
  language?: string;
  preferences?: AiPreferences;
}) {
  return apiFetch<GenerateRecipeResponse>('/ai/generate-recipe', {
    method: 'POST',
    body: params,
  });
}
