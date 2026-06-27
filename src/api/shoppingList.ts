import { apiFetch } from './client';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
  is_checked: boolean;
  created_at: string;
}

interface ListResponse {
  success: boolean;
  data: { items: ShoppingItem[]; grouped: Record<string, ShoppingItem[]> };
}

export const getShoppingList = () =>
  apiFetch<ListResponse>('/shopping-list');

export const addItem = (name: string, quantity?: string, category?: string) =>
  apiFetch<{ success: boolean; data: ShoppingItem }>('/shopping-list/items', {
    method: 'POST',
    body: { name, quantity, category },
  });

export const updateItem = (id: string, patch: Partial<Pick<ShoppingItem, 'name' | 'quantity' | 'is_checked' | 'category'>>) =>
  apiFetch<{ success: boolean; data: ShoppingItem }>(`/shopping-list/items/${id}`, {
    method: 'PATCH',
    body: patch,
  });

export const deleteItem = (id: string) =>
  apiFetch(`/shopping-list/items/${id}`, { method: 'DELETE' });

export const clearChecked = () =>
  apiFetch('/shopping-list/checked', { method: 'DELETE' });
