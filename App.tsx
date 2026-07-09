import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import AppNavigator from './src/navigation/AppNavigator';

// Crash reporting — no-op until EXPO_PUBLIC_SENTRY_DSN is set (eas.json / .env).
// Disabled in dev so local errors don't pollute the dashboard.
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !__DEV__ && SENTRY_DSN.length > 0,
  // 10% of sessions send performance traces — enough signal, minimal overhead
  tracesSampleRate: 0.1,
});

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);
