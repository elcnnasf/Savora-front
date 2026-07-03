import { apiFetch } from './client';
import { ApiRecipe } from '../navigation/types';

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
  preferences?: {
    dietary_restrictions?: string[];
    cuisine?: string;
    max_cook_time?: number;
    servings?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
}) {
  return apiFetch<GenerateRecipeResponse>('/ai/generate-recipe', {
    method: 'POST',
    body: params,
  });
}
