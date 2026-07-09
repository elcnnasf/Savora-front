import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { AiUsageToday } from '../api/auth';
import { saveTokens, clearTokens, getToken } from '../api/client';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRecentlyViewedStore } from './recentlyViewedStore';
import { useShoppingListStore } from './shoppingListStore';
import { useCookingProgressStore } from './cookingProgressStore';
import { useUserStore } from './userStore';
import { initPurchases, logOutPurchases } from '../services/purchaseService';

function clearUserLocalStores() {
  useRecentlyViewedStore.getState().clear();
  useCookingProgressStore.getState().clearAll();
  useShoppingListStore.setState({ items: {} as any });
  useUserStore.getState().resetUserData();
}

// Pull the account's saved Taste Preferences from the server (survives
// reinstalls / new devices). Fire-and-forget: any failure just leaves the
// local defaults in place.
async function hydrateTastePrefs() {
  try {
    const res = await authApi.getTastePrefs();
    const prefs = res.data?.taste_prefs as Record<string, unknown> | null;
    if (prefs && typeof prefs === 'object') {
      useUserStore.getState().setPreferences(prefs as any);
      useUserStore.getState().setPreferencesCompleted(true);
    }
  } catch { /* offline or migration not run yet — keep local state */ }
}

const ONBOARDING_KEY = 'savora_onboarding_done';
const USER_CACHE_KEY = 'savora_user_cache';

// fetch throws TypeError("Network request failed") when the device is offline
function isNetworkError(e: any): boolean {
  return e instanceof TypeError || /network request failed|failed to fetch/i.test(e?.message ?? '');
}

interface User {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  isPro: boolean;
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
  completeOnboarding: () => void;
  refreshUsage: () => Promise<void>;
  updateSubscription: (plan: 'premium' | 'pro' | 'free') => void;
  updateProfile: (patch: { name?: string; avatar_url?: string | null }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

function toUser(apiUser: authApi.ApiUser, email?: string): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: email ?? apiUser.email ?? '',
    isPremium: apiUser.is_premium,
    isPro:     apiUser.is_pro ?? false,
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

  completeOnboarding: () => {
    set({ hasSeenOnboarding: true });
    AsyncStorage.setItem(ONBOARDING_KEY, 'true');
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
    clearUserLocalStores();
    const u = toUser(user, email);
    AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
    // hasSeenOnboarding intentionally NOT set here — first-time users who signed in
    // without finishing the intro slides get them once, right after login
    set({
      isAuthenticated: true,
      isGuest: false,
      user: u,
      token: session.access_token,
    });
    hydrateTastePrefs();
    initPurchases(u.id);
  },

  signInWithGoogle: async (idToken: string) => {
    const res = await authApi.googleSignIn(idToken);
    const { user, session } = res.data;
    await saveTokens(session.access_token, session.refresh_token);
    clearUserLocalStores();
    const u = toUser(user);
    AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
    set({
      isAuthenticated: true,
      isGuest: false,
      user: u,
      token: session.access_token,
    });
    hydrateTastePrefs();
    initPurchases(u.id);
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
    logOutPurchases();
    await clearTokens();
    await AsyncStorage.removeItem(USER_CACHE_KEY);
    clearUserLocalStores();
    set({ isAuthenticated: false, isGuest: true, user: null, token: null });
  },

  updateProfile: async (patch) => {
    const res = await authApi.updateProfile(patch);
    const current = get().user;
    const u = toUser(res.data, current?.email);
    // getMe/update returns no ai_usage — keep the usage we already had
    const merged: User = { ...u, aiUsageToday: current?.aiUsageToday ?? u.aiUsageToday };
    AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(merged)).catch(() => {});
    set({ user: merged });
  },

  deleteAccount: async () => {
    // Throws on failure so the screen can show an error and keep the session.
    await authApi.deleteAccount();
    try { await GoogleSignin.signOut(); } catch { /* ignore */ }
    logOutPurchases();
    await clearTokens();
    await AsyncStorage.removeItem(USER_CACHE_KEY);
    clearUserLocalStores();
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
      const u = toUser(res.data);
      AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
      set({
        isAuthenticated: true,
        isGuest: false,
        user: u,
        token,
        isLoading: false,
      });
      initPurchases(u.id);
      // Fresh install with an existing session: local prefs are gone but the
      // account's are on the server — restore them
      if (!useUserStore.getState().preferencesCompleted) hydrateTastePrefs();
    } catch (e) {
      // Offline app start must NOT log the user out — restore the cached profile
      // and keep the token so saved content stays accessible without internet
      if (isNetworkError(e)) {
        const raw = await AsyncStorage.getItem(USER_CACHE_KEY);
        if (raw) {
          set({
            isAuthenticated: true,
            isGuest: false,
            user: JSON.parse(raw),
            token,
            isLoading: false,
          });
          return;
        }
      }
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

  updateSubscription: (plan) => {
    set((s) => s.user ? {
      user: {
        ...s.user,
        isPremium: plan === 'premium' || plan === 'pro',
        isPro:     plan === 'pro',
      },
    } : {});
  },
}));
