import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Configure per-environment via an EXPO_PUBLIC_API_URL env var (see .env.example).
// Production MUST be https:// — cleartext http is only tolerated for local dev.
// Android emulator → http://10.0.2.2:3000 · real device (same WiFi) → your LAN IP
const DEFAULT_DEV_API = 'http://192.168.100.4:3000';
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_DEV_API;

if (!__DEV__ && API_URL.startsWith('http://')) {
  // Never ship a release pointing at cleartext — tokens would travel in the clear
  console.error('[security] Production API_URL must use https://. Refusing cleartext.');
}

export const TOKEN_KEY   = 'savora_access_token';
export const REFRESH_KEY = 'savora_refresh_token';

// Tokens live in the OS keystore (Keychain / Android Keystore), not AsyncStorage,
// so they are encrypted at rest and unreadable from a device backup or another app.
async function secureGet(key: string): Promise<string | null> {
  try {
    const v = await SecureStore.getItemAsync(key);
    if (v !== null) return v;
    // One-time migration: pull any token left in the old AsyncStorage location,
    // move it into SecureStore, then wipe the insecure copy.
    const legacy = await AsyncStorage.getItem(key);
    if (legacy !== null) {
      await SecureStore.setItemAsync(key, legacy);
      await AsyncStorage.removeItem(key);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getToken(): Promise<string | null> {
  return secureGet(TOKEN_KEY);
}

export async function saveTokens(access: string, refresh: string) {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {}),
    // clear any legacy plaintext copies too
    AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]).catch(() => {}),
  ]);
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  body?: unknown;
  auth?: boolean;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = await secureGet(REFRESH_KEY);
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    await saveTokens(json.data.access_token, json.data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiOptions = {},
  _retried = false,
): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh on 401: get a new access token and retry once
  if (res.status === 401 && auth && !_retried) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiFetch(path, opts, true);
    await clearTokens();
    throw new Error('Sessiyanız başa çatdı. Yenidən daxil olun.');
  }

  const json = await parseJsonOrThrow(res);
  if (!res.ok) throw new Error(json?.error ?? `Request failed: ${res.status}`);
  return json as T;
}

// Servers (and proxies / captive portals) sometimes reply with an HTML error page
// instead of JSON. Calling res.json() on that throws a cryptic
// "JSON Parse error: Unexpected character: <". Detect it and surface something useful.
async function parseJsonOrThrow(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Serverdən gözlənilməz cavab alındı (${res.status}). ` +
      `API ünvanını yoxlayın: ${API_URL}`,
    );
  }
}
