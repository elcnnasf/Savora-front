import { apiFetch } from './client';
import { ApiRecipe } from '../navigation/types';

export interface Collection {
  id: string;
  name: string;
  emoji?: string | null;
  color?: string | null;
  share_id?: string | null;
  recipe_count: number;
  covers: string[];
  created_at?: string;
}

export function getCollections() {
  return apiFetch<{ success: boolean; data: Collection[] }>('/collections');
}

export function createCollection(input: { name: string; emoji?: string; color?: string }) {
  return apiFetch<{ success: boolean; data: Collection }>('/collections', {
    method: 'POST',
    body: input,
  });
}

export function renameCollection(id: string, input: { name?: string; emoji?: string; color?: string }) {
  return apiFetch<{ success: boolean; data: Collection }>(`/collections/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteCollection(id: string) {
  return apiFetch<{ success: boolean }>(`/collections/${id}`, { method: 'DELETE' });
}

export function getCollectionRecipes(id: string) {
  return apiFetch<{ success: boolean; data: { collection: Collection; recipes: ApiRecipe[] } }>(
    `/collections/${id}/recipes`,
  );
}

export function addRecipeToCollection(id: string, recipeId: string) {
  return apiFetch<{ success: boolean }>(`/collections/${id}/recipes`, {
    method: 'POST',
    body: { recipe_id: recipeId },
  });
}

export function removeRecipeFromCollection(id: string, recipeId: string) {
  return apiFetch<{ success: boolean }>(`/collections/${id}/recipes/${recipeId}`, {
    method: 'DELETE',
  });
}

export function getCollectionsForRecipe(recipeId: string) {
  return apiFetch<{ success: boolean; data: { collection_ids: string[] } }>(
    `/collections/recipe/${recipeId}`,
  );
}

export function shareCollection(id: string) {
  return apiFetch<{ success: boolean; data: { share_id: string } }>(`/collections/${id}/share`, {
    method: 'POST',
  });
}
