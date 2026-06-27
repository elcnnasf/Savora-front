import { apiFetch } from './client';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealItem {
  id: string;
  meal_plan_id: string;
  recipe_id?: string;
  recipe_title: string;
  meal_type: MealType;
  day_of_week: number; // 0=Mon … 6=Sun
  calories?: number;
  notes?: string;
}

interface WeekPlanResponse {
  success: boolean;
  data: {
    plan_id?: string;
    week_start: string;
    total_calories: number;
    items: MealItem[];
    by_day: Record<number, MealItem[]>;
  };
}

/** weekStart = YYYY-MM-DD (Monday of the week) */
export function getWeekPlan(weekStart: string) {
  return apiFetch<WeekPlanResponse>(`/meal-plans/week/${weekStart}`);
}

export function addMealItem(weekStart: string, item: {
  recipe_title: string;
  meal_type: MealType;
  day_of_week: number;
  calories?: number;
  notes?: string;
}) {
  return apiFetch<{ success: boolean; data: MealItem }>(`/meal-plans/week/${weekStart}/items`, {
    method: 'POST',
    body: item,
  });
}

export function deleteMealItem(itemId: string) {
  return apiFetch(`/meal-plans/items/${itemId}`, { method: 'DELETE' });
}

export function clearDay(weekStart: string, day: number) {
  return apiFetch(`/meal-plans/week/${weekStart}/day/${day}`, { method: 'DELETE' });
}

/** Returns Monday of the current week as YYYY-MM-DD */
export function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  return mon.toISOString().split('T')[0];
}
