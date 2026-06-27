import { apiFetch } from './client';
import { ApiRecipe } from '../navigation/types';

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
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.q)          qs.append('q',          params.q);
  if (params?.tags)       qs.append('tags',       params.tags);
  if (params?.cuisine)    qs.append('cuisine',    params.cuisine);
  if (params?.difficulty) qs.append('difficulty', params.difficulty);
  if (params?.page)       qs.append('page',       String(params.page));
  if (params?.limit)      qs.append('limit',      String(params.limit));
  const query = qs.toString();
  return apiFetch<RecipeListResponse>(`/recipes${query ? '?' + query : ''}`);
}

export function fetchRecipeById(id: string) {
  return apiFetch<{ success: boolean; data: ApiRecipe }>(`/recipes/${id}`);
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
