/**
 * RevenueCat purchase service.
 *
 * Real purchases need a dev/EAS build with EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
 * set — in Expo Go (no native module) or without a key everything reports
 * unavailable and ManagePlan falls back to the dev-only simulated payment,
 * which the backend only accepts outside production.
 *
 * The backend stays the source of truth: after a purchase the app calls
 * POST /auth/subscribe, which verifies entitlements against the RevenueCat
 * REST API before flipping is_premium / is_pro.
 */
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const API_KEY =
  (Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY) ?? '';

// Loaded lazily so Expo Go (which lacks the native module) never crashes
let Purchases: any = null;
if (!isExpoGo) {
  try {
    Purchases = require('react-native-purchases').default;
  } catch {
    Purchases = null;
  }
}

export function isPurchasesAvailable(): boolean {
  return Purchases != null && API_KEY.length > 0;
}

let configured = false;

/** Safe to call repeatedly; binds purchases to the Savora user id. */
export async function initPurchases(appUserID: string): Promise<void> {
  if (!isPurchasesAvailable()) return;
  try {
    if (!configured) {
      Purchases.configure({ apiKey: API_KEY, appUserID });
      configured = true;
    } else {
      await Purchases.logIn(appUserID);
    }
  } catch { /* purchases must never break auth */ }
}

export async function logOutPurchases(): Promise<void> {
  if (!isPurchasesAvailable() || !configured) return;
  try {
    await Purchases.logOut();
  } catch { /* anonymous already / not configured */ }
}

export type PurchaseOutcome = 'success' | 'cancelled';

/**
 * Buys the monthly package for a plan. Product identifiers must be
 * savora_premium_monthly / savora_pro_monthly in Play Console + RevenueCat.
 */
export async function purchasePlan(plan: 'premium' | 'pro'): Promise<PurchaseOutcome> {
  if (!isPurchasesAvailable()) throw new Error('purchases-unavailable');

  const offerings = await Purchases.getOfferings();
  const packages: any[] = [
    ...(offerings.current?.availablePackages ?? []),
    ...Object.values(offerings.all ?? {}).flatMap((o: any) => o.availablePackages ?? []),
  ];
  const wanted = `savora_${plan}`;
  const pkg = packages.find((p: any) =>
    (p.product?.identifier ?? '').startsWith(wanted),
  );
  if (!pkg) throw new Error(`No package found for plan "${plan}" — check RevenueCat offerings`);

  try {
    await Purchases.purchasePackage(pkg);
    return 'success';
  } catch (e: any) {
    if (e?.userCancelled) return 'cancelled';
    throw e;
  }
}

/** Re-syncs previous purchases (reinstall / new device). */
export async function restorePurchases(): Promise<void> {
  if (!isPurchasesAvailable()) throw new Error('purchases-unavailable');
  await Purchases.restorePurchases();
}
