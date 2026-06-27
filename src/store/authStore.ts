import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { AiUsageToday } from '../api/auth';
import { saveTokens, clearTokens, getToken } from '../api/client';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const ONBOARDING_KEY = 'savora_onboarding_done';

interface User {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  memberSince: string;
  avatar?: string;
  aiUsageToday?: AiUsageToday;
}

interface AuthState {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  hasSeenOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<{ emailConfirmationRequired: boolean }>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  leaveGuest: () => void;
  checkOnboarding: () => Promise<void>;
  refreshUsage: () => Promise<void>;
}

function toUser(apiUser: authApi.ApiUser, email?: string): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: email ?? apiUser.email ?? '',
    isPremium: apiUser.is_premium,
    memberSince: apiUser.member_since
      ? new Date(apiUser.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    avatar: apiUser.avatar_url,
    aiUsageToday: apiUser.ai_usage_today,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isGuest: false,
  isLoading: true,
  user: null,
  token: null,
  hasSeenOnboarding: false,

  checkOnboarding: async () => {
    const done = await AsyncStorage.getItem(ONBOARDING_KEY);
    set({ hasSeenOnboarding: done === 'true' });
  },

  continueAsGuest: async () => {
    set({ isGuest: true, hasSeenOnboarding: true });
    AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  },

  leaveGuest: () => {
    set({ isGuest: false });
  },

  signIn: async (email, password) => {
    const res = await authApi.login(email, password);
    const { user, session } = res.data;
    await saveTokens(session.access_token, session.refresh_token);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({
      isAuthenticated: true,
      isGuest: false,
      user: toUser(user, email),
      token: session.access_token,
      hasSeenOnboarding: true,
    });
  },

  signInWithGoogle: async (idToken: string) => {
    const res = await authApi.googleSignIn(idToken);
    const { user, session } = res.data;
    await saveTokens(session.access_token, session.refresh_token);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({
      isAuthenticated: true,
      isGuest: false,
      user: toUser(user),
      token: session.access_token,
      hasSeenOnboarding: true,
    });
  },

  signUp: async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    if (res.data.email_confirmation_required) {
      return { emailConfirmationRequired: true };
    }
    return { emailConfirmationRequired: false };
  },

  signOut: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    try { await GoogleSignin.signOut(); } catch { /* ignore */ }
    await clearTokens();
    set({ isAuthenticated: false, isGuest: true, user: null, token: null });
  },

  restoreSession: async () => {
    const [token, onboardingDone] = await Promise.all([
      getToken(),
      AsyncStorage.getItem(ONBOARDING_KEY),
    ]);
    const seenOnboarding = onboardingDone === 'true';
    set({ hasSeenOnboarding: seenOnboarding });

    if (!token) {
      set({ isGuest: seenOnboarding, isLoading: false });
      return;
    }

    try {
      const res = await authApi.getMe();
      set({
        isAuthenticated: true,
        isGuest: false,
        user: toUser(res.data),
        token,
        isLoading: false,
      });
    } catch {
      await clearTokens();
      set({ isGuest: seenOnboarding, isLoading: false });
    }
  },

  refreshUsage: async () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) return;
    try {
      const res = await authApi.getMe();
      set((s) => ({
        user: s.user ? { ...s.user, aiUsageToday: res.data.ai_usage_today } : s.user,
      }));
    } catch { /* silent */ }
  },
}));
