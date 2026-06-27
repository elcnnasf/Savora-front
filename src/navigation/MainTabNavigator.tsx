import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Compass, MessageCircle, Bookmark, User } from 'lucide-react-native';
import { MainTabParamList } from './types';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import HomeScreen from '../screens/home/HomeScreen';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import AIChatScreen from '../screens/chat/AIChatScreen';
import SavedScreen from '../screens/saved/SavedScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const TAB_ICON_SIZE = 22;

export default function MainTabNavigator() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: isDark ? colors.surface : colors.card,
          borderTopWidth: isDark ? 0 : 0,
          borderTopColor: colors.border,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0 : 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabel: ({ color, children }) => (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={{ color, fontSize: 10, marginTop: 2, textAlign: 'center', flexShrink: 1 }}
          >
            {children}
          </Text>
        ),
        tabBarIcon: ({ color, focused }) => {
          const props = { size: TAB_ICON_SIZE, color, strokeWidth: focused ? 2.5 : 1.8 };
          switch (route.name) {
            case 'Home':     return <Home {...props} />;
            case 'Discover': return <Compass {...props} />;
            case 'AIChat':   return <MessageCircle {...props} />;
            case 'Saved':    return <Bookmark {...props} />;
            case 'Profile':  return <User {...props} />;
            default:         return null;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('nav.home') }} />
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ tabBarLabel: t('nav.discover') }} />
      <Tab.Screen name="AIChat" component={AIChatScreen} options={{ tabBarLabel: t('nav.chat') }} />
      <Tab.Screen name="Saved" component={SavedScreen} options={{ tabBarLabel: t('nav.saved') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('nav.profile') }} />
    </Tab.Navigator>
  );
}
