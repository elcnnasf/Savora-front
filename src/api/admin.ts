import { apiFetch } from './client';

export interface AdminRecipe {
  id: string;
  title: string;
  image_url?: string;
  cuisine?: string;
  difficulty?: string;
  cook_time: number;
  calories?: number;
  is_ai_generated: boolean;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_premium: boolean;
  is_pro: boolean;
  member_since: string;
  last_sign_in?: string;
  cooking_skill: string;
  created_at: string;
}

export function adminListRecipes(params?: { page?: number; limit?: number; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.page)  qs.append('page',  String(params.page));
  if (params?.limit) qs.append('limit', String(params.limit));
  if (params?.q)     qs.append('q',     params.q);
  const query = qs.toString();
  return apiFetch<{ success: boolean; data: { items: AdminRecipe[]; total: number; hasMore: boolean } }>(
    `/admin/recipes${query ? '?' + query : ''}`,
  );
}

export function adminUpdateRecipe(id: string, update: { title?: string; image_url?: string }) {
  return apiFetch<{ success: boolean }>(`/admin/recipes/${id}`, {
    method: 'PATCH',
    body: update,
  });
}

export function adminDeleteRecipe(id: string) {
  return apiFetch<{ success: boolean }>(`/admin/recipes/${id}`, {
    method: 'DELETE',
  });
}

export function adminSetPremium(userId: string, is_premium: boolean) {
  return apiFetch<{ success: boolean }>(`/admin/users/${userId}/premium`, {
    method: 'PATCH',
    body: { is_premium },
  });
}

export function adminSetPro(userId: string, is_pro: boolean) {
  return apiFetch<{ success: boolean }>(`/admin/users/${userId}/pro`, {
    method: 'PATCH',
    body: { is_pro },
  });
}

export function adminListUsers(params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.page)  qs.append('page',  String(params.page));
  if (params?.limit) qs.append('limit', String(params.limit));
  const query = qs.toString();
  return apiFetch<{ success: boolean; data: { items: AdminUser[]; total: number } }>(
    `/admin/users${query ? '?' + query : ''}`,
  );
}
