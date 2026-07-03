import { apiFetch } from './client';
import { ApiRecipe, RecipeTranslation } from '../navigation/types';

interface RecipeListResponse {
  success: boolean;
  data: {
    items: ApiRecipe[];
    total: number;
    page: number;
    hasMore: boolean;
  };
}

export function fetchRecipes(params?: {
  q?: string;
  tags?: string;
  cuisine?: string;
  difficulty?: string;
  max_cook_time?: number;
  min_rating?: number;
  max_calories?: number;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.q)             qs.append('q',             params.q);
  if (params?.tags)          qs.append('tags',          params.tags);
  if (params?.cuisine)       qs.append('cuisine',       params.cuisine);
  if (params?.difficulty)    qs.append('difficulty',    params.difficulty);
  if (params?.max_cook_time) qs.append('max_cook_time', String(params.max_cook_time));
  if (params?.min_rating)    qs.append('min_rating',    String(params.min_rating));
  if (params?.max_calories)  qs.append('max_calories',  String(params.max_calories));
  if (params?.page)          qs.append('page',          String(params.page));
  if (params?.limit)         qs.append('limit',         String(params.limit));
  const query = qs.toString();
  return apiFetch<RecipeListResponse>(`/recipes${query ? '?' + query : ''}`);
}

export function fetchRecipeById(id: string, lang?: string) {
  const qs = lang && lang !== 'en' ? `?lang=${lang}` : '';
  return apiFetch<{ success: boolean; data: ApiRecipe }>(`/recipes/${id}${qs}`);
}

export interface MatchedRecipe {
  id: string;
  title: string;
  image_url?: string;
  cuisine?: string;
  difficulty?: string;
  cook_time?: number;
  calories?: number;
  servings?: number;
  tags?: string[];
  ingredients: { name: string; amount: string }[];
  translations?: Record<string, RecipeTranslation>;
  match_percent: number;
  matched_count: number;
  total_count: number;
  matched_ingredients: string[];
}

export function matchRecipes(ingredients: string[]) {
  return apiFetch<{ success: boolean; data: MatchedRecipe[] }>('/recipes/match', {
    method: 'POST',
    body: { ingredients },
  });
}

export function getSavedRecipes() {
  return apiFetch<{ success: boolean; data: ApiRecipe[] }>('/recipes/saved');
}

export function saveRecipe(id: string) {
  return apiFetch<{ success: boolean }>(`/recipes/${id}/save`, { method: 'POST' });
}

export function unsaveRecipe(id: string) {
  return apiFetch<{ success: boolean }>(`/recipes/${id}/save`, { method: 'DELETE' });
}

export function getRecipeSavedStatus(id: string) {
  return apiFetch<{ success: boolean; data: { saved: boolean } }>(`/recipes/${id}/save`);
}

export function rateRecipe(id: string, rating: number) {
  return apiFetch<{ success: boolean; data: { rating_avg: number | null; rating_count: number; user_rating: number } }>(
    `/recipes/${id}/rate`,
    { method: 'POST', body: { rating } },
  );
}

export function getMyRating(id: string) {
  return apiFetch<{ success: boolean; data: { rating: number | null } }>(`/recipes/${id}/rating`);
}
