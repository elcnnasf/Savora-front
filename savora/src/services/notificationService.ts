/**
 * Notification service — stubs for Expo Go.
 * Real notifications require a native build: npx expo run:android
 */
export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleMealReminders(_times: {
  breakfast: string;
  lunch: string;
  dinner: string;
}): Promise<boolean> {
  return false;
}

export async function cancelMealReminders(): Promise<void> {}

export async function scheduleRecipeSuggestionNotification(): Promise<void> {}

export async function cancelRecipeSuggestionNotification(): Promise<void> {}

export function isNotificationsAvailable(): boolean {
  return false;
}
