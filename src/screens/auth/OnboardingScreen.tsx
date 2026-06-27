import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChefHat, Sparkles, CalendarDays, Camera } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: <ChefHat size={64} color={Colors.primary} strokeWidth={1.5} />,
    title: 'Cook smarter,\neat better',
    subtitle: 'Discover thousands of recipes tailored to your taste, dietary needs, and cooking skill.',
    bg: '#F0FDF4',
  },
  {
    id: '2',
    icon: <Sparkles size={64} color={Colors.primary} strokeWidth={1.5} />,
    title: 'AI that cooks\nwith you',
    subtitle: "Describe what you want and let Savora's AI generate a custom recipe in seconds.",
    bg: '#EFF6FF',
  },
  {
    id: '3',
    icon: <CalendarDays size={64} color={Colors.primary} strokeWidth={1.5} />,
    title: 'Plan your week\neffortlessly',
    subtitle: 'Smart meal planning with auto-generated shopping lists, synced to your goals.',
    bg: '#F5F3FF',
  },
  {
    id: '4',
    icon: <Camera size={64} color={Colors.primary} strokeWidth={1.5} />,
    title: 'Scan ingredients,\nget recipes',
    subtitle: 'Point your camera at any ingredient and instantly find recipes that use it.',
    bg: '#FFF7ED',
  },
];

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { hasSeenOnboarding, checkOnboarding, continueAsGuest } = useAuthStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  // restoreSession in AppNavigator handles auto-guest when onboarding is done

  function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
      setActiveIndex(activeIndex + 1);
    } else {
      navigation.navigate('SignIn');
    }
  }

  function handleGuest() {
    continueAsGuest();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoImg} resizeMode="contain" />
          <Text style={styles.logo}>savora</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.skip}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
              {item.icon}
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextText}>
            {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>

        {activeIndex === SLIDES.length - 1 ? (
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.signInLink}>
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInAccent}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleGuest} style={styles.signInLink}>
            <Text style={styles.guestText}>Browse as Guest</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoImg: { width: 28, height: 28, borderRadius: 6 },
  logo: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  skip: {
    fontSize: FontSize.base,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: FontSize.xxxl * 1.25,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.6,
  },
  bottom: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
    gap: Spacing.base,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base + 2,
    alignItems: 'center',
  },
  nextText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  signInLink: { alignItems: 'center' },
  signInText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  signInAccent: { color: Colors.primary, fontWeight: FontWeight.semibold },
  guestText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
});
