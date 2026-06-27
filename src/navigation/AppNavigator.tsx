import React, { useEffect } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import RecipeDetailScreen from '../screens/recipe/RecipeDetailScreen';
import AIRecipeScreen from '../screens/recipe/AIRecipeScreen';
import CookingModeScreen from '../screens/recipe/CookingModeScreen';
import MealPlannerScreen from '../screens/planner/MealPlannerScreen';
import ShoppingListScreen from '../screens/planner/ShoppingListScreen';
import ScanScreen from '../screens/scan/ScanScreen';
import TastePreferencesScreen from '../screens/profile/TastePreferencesScreen';
import MealGoalsScreen from '../screens/profile/MealGoalsScreen';
import MyProgressScreen from '../screens/profile/MyProgressScreen';
import AchievementsScreen from '../screens/profile/AchievementsScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import HelpSupportScreen from '../screens/profile/HelpSupportScreen';
import PremiumScreen from '../screens/profile/PremiumScreen';
import ManagePlanScreen from '../screens/profile/ManagePlanScreen';
import MatchedRecipesScreen from '../screens/scan/MatchedRecipesScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, isGuest, isLoading, restoreSession } = useAuthStore();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    restoreSession();
  }, []);

  const showMain = isAuthenticated || isGuest;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      {!showMain ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen
            name="RecipeDetail"
            component={RecipeDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="AIRecipe"
            component={AIRecipeScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="CookingMode"
            component={CookingModeScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="MealPlanner"
            component={MealPlannerScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="ShoppingList"
            component={ShoppingListScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Scan"
            component={ScanScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="TastePreferences"
            component={TastePreferencesScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="MealGoals"
            component={MealGoalsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="MyProgress"
            component={MyProgressScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Achievements"
            component={AchievementsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="HelpSupport"
            component={HelpSupportScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Premium"
            component={PremiumScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="ManagePlan"
            component={ManagePlanScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="MatchedRecipes"
            component={MatchedRecipesScreen}
            options={{ animation: 'slide_from_right' }}
          />
          {/* Auth screens accessible from within guest mode */}
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
        </>
      )}
    </Stack.Navigator>
    </>
  );
}
