/**
 * Notification service — local scheduled notifications via expo-notifications.
 *
 * Works in dev/EAS builds. Expo Go removed notification support on Android
 * (SDK 53+), so everything degrades to a no-op there and the Settings screen
 * shows an explanatory alert via isNotificationsAvailable().
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useUserStore } from '../store/userStore';
import { TRANSLATIONS, Language } from '../i18n/translations';

// appOwnership is deprecated (can be null on newer SDKs) — check both signals
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function isNotificationsAvailable(): boolean {
  return Platform.OS !== 'web' && !isExpoGo;
}

// Show notifications even while the app is in the foreground
if (isNotificationsAvailable()) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ── Localized notification texts ─────────────────────────────

function langKey(): Language {
  const language = useUserStore.getState().language;
  return language === 'Azerbaijani' ? 'az'
    : language === 'Russian' ? 'ru'
    : language === 'Turkish' ? 'tr'
    : 'en';
}

function nt(key: string): string {
  const dict = (TRANSLATIONS[langKey()] as any)?.notificationTexts
    ?? (TRANSLATIONS.en as any).notificationTexts;
  return dict?.[key] ?? key;
}

// ── Permission ───────────────────────────────────────────────

const CHANNEL_ID = 'reminders';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationsAvailable()) return false;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });
    }
    return true;
  } catch {
    return false;
  }
}

// ── Meal reminders (daily, 3 fixed identifiers) ──────────────

type Meal = 'breakfast' | 'lunch' | 'dinner';
const MEAL_IDS: Record<Meal, string> = {
  breakfast: 'meal-breakfast',
  lunch:     'meal-lunch',
  dinner:    'meal-dinner',
};

function parseTime(s: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((s ?? '').trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

// Fires 2 s after a toggle is switched on so the user gets instant proof the
// pipeline works — otherwise nothing visible happens until the scheduled hour
async function sendEnabledConfirmation(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: 'enable-confirmation',
    content: {
      title: nt('enabledTitle'),
      body:  nt('enabledBody'),
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: CHANNEL_ID,
    },
  });
}

export async function scheduleMealReminders(times: {
  breakfast: string;
  lunch: string;
  dinner: string;
}): Promise<boolean> {
  if (!isNotificationsAvailable()) return false;
  try {
    await cancelMealReminders();
    for (const meal of Object.keys(MEAL_IDS) as Meal[]) {
      const tm = parseTime(times[meal]);
      if (!tm) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: MEAL_IDS[meal],
        content: {
          title: nt(`${meal}Title`),
          body:  nt(`${meal}Body`),
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: tm.hour,
          minute: tm.minute,
          channelId: CHANNEL_ID,
        },
      });
    }
    await sendEnabledConfirmation();
    return true;
  } catch {
    return false;
  }
}

export async function cancelMealReminders(): Promise<void> {
  if (!isNotificationsAvailable()) return;
  try {
    await Promise.all(
      Object.values(MEAL_IDS).map((id) => Notifications.cancelScheduledNotificationAsync(id)),
    );
  } catch { /* ignore */ }
}

// ── Daily recipe suggestion ──────────────────────────────────

const SUGGESTION_ID = 'daily-recipe-suggestion';

export async function scheduleRecipeSuggestionNotification(): Promise<void> {
  if (!isNotificationsAvailable()) return;
  try {
    await cancelRecipeSuggestionNotification();
    // Late afternoon — when people start thinking about dinner
    await Notifications.scheduleNotificationAsync({
      identifier: SUGGESTION_ID,
      content: {
        title: nt('suggestionTitle'),
        body:  nt('suggestionBody'),
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 17,
        minute: 0,
        channelId: CHANNEL_ID,
      },
    });
    await sendEnabledConfirmation();
  } catch { /* ignore */ }
}

export async function cancelRecipeSuggestionNotification(): Promise<void> {
  if (!isNotificationsAvailable()) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(SUGGESTION_ID);
  } catch { /* ignore */ }
}
