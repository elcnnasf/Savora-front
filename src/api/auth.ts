import { apiFetch } from './client';

export interface AiUsageToday {
  recipes_count:     number;
  meal_plans_count:  number;
  scans_count:       number;
  suggestions_count: number;
  ai_chat_count:     number;
}

export interface ApiUser {
  id: string;
  name: string;
  email?: string;
  is_premium: boolean;
  is_pro: boolean;
  member_since?: string;
  avatar_url?: string;
  ai_usage_today?: AiUsageToday;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

interface AuthData {
  user: ApiUser;
  session: Session;
}

interface RegisterPendingData {
  email_confirmation_required: true;
  email: string;
}

export function login(email: string, password: string) {
  return apiFetch<{ success: boolean; data: AuthData }>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function forgotPassword(email: string) {
  return apiFetch<{ success: boolean; message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    auth: false,
  });
}

export function resetPassword(email: string, token: string, newPassword: string) {
  return apiFetch<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { email, token, new_password: newPassword },
    auth: false,
  });
}

export function register(name: string, email: string, password: string) {
  return apiFetch<{ success: boolean; data: RegisterPendingData }>('/auth/register', {
    method: 'POST',
    body: { name, email, password },
    auth: false,
  });
}

export function getMe() {
  return apiFetch<{ success: boolean; data: ApiUser }>('/auth/me');
}

export function logout() {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export function googleSignIn(idToken: string) {
  return apiFetch<{ success: boolean; data: AuthData }>('/auth/google', {
    method: 'POST',
    body: { id_token: idToken },
    auth: false,
  });
}

export function subscribe(plan: 'premium' | 'pro' | 'free') {
  return apiFetch<{ success: boolean; data: { plan: string; is_premium: boolean; is_pro: boolean } }>(
    '/auth/subscribe',
    { method: 'POST', body: { plan } },
  );
}

export function getTastePrefs() {
  return apiFetch<{ success: boolean; data: { taste_prefs: unknown | null } }>('/auth/preferences');
}

export function saveTastePrefs(prefs: unknown) {
  return apiFetch<{ success: boolean }>('/auth/preferences', {
    method: 'PUT',
    body: { taste_prefs: prefs },
  });
}
