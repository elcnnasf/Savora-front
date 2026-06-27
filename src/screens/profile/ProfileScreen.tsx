import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell, Settings, ChevronRight, Crown, Utensils,
  Target, CalendarDays, ShoppingCart, LogOut, Pencil,
  Camera, Sparkles, MessageCircle, ChefHat, Zap, LogIn,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { AiUsageToday } from '../../api/auth';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FREE_LIMIT = 10;
const CHAT_LIMIT = 50;

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAuthenticated, signOut, refreshUsage } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const [resetIn, setResetIn] = useState(getTimeUntilMidnight());

  useEffect(() => {
    const id = setInterval(() => setResetIn(getTimeUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  useFocusEffect(useCallback(() => {
    if (isAuthenticated) refreshUsage();
  }, [isAuthenticated]));

  const MENU_ITEMS = [
    { label: t('profile.tastePreferences'), sub: 'Update your food preferences', icon: Utensils,      route: 'TastePreferences' as const, color: colors.quickScanIcon },
    { label: t('profile.mealGoals'),        sub: 'Your goals and target settings', icon: Target,       route: 'MealGoals' as const,         color: colors.primary },
    { label: 'Meal Plans',                  sub: 'Your weekly meal plans',          icon: CalendarDays, route: 'MealPlanner' as const,       color: colors.info },
    { label: 'Shopping Lists',              sub: 'Your shopping lists',             icon: ShoppingCart, route: 'ShoppingList' as const,      color: colors.quickPlanIcon },
  ];

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('nav.profile')}</Text>
        </View>
        <View style={styles.guestWall}>
          <View style={styles.guestAvatar}>
            <Text style={styles.guestAvatarText}>?</Text>
          </View>
          <Text style={styles.guestTitle}>You're browsing as a guest</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to access your profile, saved recipes, meal plans, and personalized AI suggestions.
          </Text>
          <TouchableOpacity style={styles.signInBtn} activeOpacity={0.85} onPress={() => navigation.navigate('SignIn')}>
            <LogIn size={18} color={colors.textInverse} strokeWidth={2} />
            <Text style={styles.signInBtnText}>{t('common.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const usage: AiUsageToday = user?.aiUsageToday ?? {
    recipes_count: 0, meal_plans_count: 0, scans_count: 0,
    suggestions_count: 0, ai_chat_count: 0,
  };

  const aiUsageItems = [
    { label: t('profile.recipes'),   value: usage.recipes_count,     max: FREE_LIMIT, icon: Utensils },
    { label: t('profile.mealPlans'), value: usage.meal_plans_count,  max: FREE_LIMIT, icon: CalendarDays },
    { label: t('profile.scans'),     value: usage.scans_count,       max: FREE_LIMIT, icon: Camera },
    { label: 'Suggestions',          value: usage.suggestions_count, max: FREE_LIMIT, icon: Sparkles },
    { label: t('profile.chats'),     value: usage.ai_chat_count,     max: CHAT_LIMIT, icon: MessageCircle },
  ];

  const initial = user?.name?.[0]?.toUpperCase() ?? 'U';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.profile')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => navigation.navigate('Settings' as any)}>
            <Settings size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Bell size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name}</Text>
            <View style={styles.emailRow}>
              <Text style={styles.email}>{user?.email}</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Pencil size={14} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {user?.isPremium && (
              <View style={styles.premiumBadgeRow}>
                <View style={styles.premiumBadge}>
                  <Crown size={11} color={colors.warning} strokeWidth={2} />
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </View>
                <Text style={styles.memberSince}>Member since {user.memberSince}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('profile.aiUsage')}</Text>
            <Text style={styles.cardSub}>{t('profile.resetsIn')} {resetIn}</Text>
          </View>
          <View style={styles.usageRow}>
            {aiUsageItems.map((item) => {
              const Icon = item.icon;
              const pct = Math.min(item.value / item.max, 1);
              const isNearLimit = pct >= 0.8;
              return (
                <View key={item.label} style={styles.usageItem}>
                  <Icon size={20} color={isNearLimit ? colors.warning : colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.usageLabel}>{item.label}</Text>
                  <Text style={[styles.usageCount, isNearLimit && styles.usageCountWarn]}>
                    {item.value}/{item.max}
                  </Text>
                  <View style={styles.usageBarBg}>
                    <View style={[styles.usageBarFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: isNearLimit ? colors.warning : colors.primary }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={styles.premiumBanner}
          onPress={() => navigation.navigate('ManagePlan')}
          activeOpacity={0.88}
        >
          <View style={styles.premiumBannerContent}>
            <View style={styles.premiumBannerTop}>
              <Crown size={18} color={colors.premiumGold} strokeWidth={2} />
              <Text style={styles.premiumBannerTitle}>Savora Premium</Text>
            </View>
            <Text style={styles.premiumBannerSub}>
              Unlimited AI, advanced features{'\n'}and personalized nutrition.
            </Text>
            <TouchableOpacity
              style={styles.managePlanBtn}
              onPress={() => navigation.navigate('ManagePlan')}
              activeOpacity={0.85}
            >
              <Text style={styles.managePlanText}>Manage Plan</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.premiumDecor}>
            <View style={styles.premiumDecorRing}>
              <Crown size={28} color="#F59E0B" strokeWidth={1.5} />
            </View>
            <View style={styles.premiumDecorBadge1}>
              <Zap size={11} color="rgba(255,255,255,0.9)" strokeWidth={2} />
            </View>
            <View style={styles.premiumDecorBadge2}>
              <ChefHat size={13} color="rgba(255,255,255,0.8)" strokeWidth={1.8} />
            </View>
            <View style={styles.premiumDecorBadge3}>
              <Sparkles size={10} color="#F59E0B" strokeWidth={2} />
            </View>
            <View style={styles.premiumDecorDot1} />
            <View style={styles.premiumDecorDot2} />
          </View>
        </TouchableOpacity>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, i === MENU_ITEMS.length - 1 && styles.menuItemLast]}
                onPress={() => navigation.navigate(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
                  <Icon size={18} color={item.color} strokeWidth={2} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.menu, { marginTop: Spacing.sm }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('HelpSupport')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.info + '18' }]}>
              <Bell size={18} color={colors.info} strokeWidth={2} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{t('profile.helpSupport')}</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={signOut}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.error + '18' }]}>
              <LogOut size={18} color={colors.error} strokeWidth={2} />
            </View>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.error }]}>{t('profile.signOut')}</Text>
            </View>
            <ChevronRight size={16} color={colors.error} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: c.text },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.base },

  guestWall: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  guestAvatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center' },
  guestAvatarText: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: c.textMuted },
  guestTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.text, textAlign: 'center' },
  guestSubtitle: { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', lineHeight: FontSize.sm * 1.6 },
  signInBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  signInBtnText: { color: c.textInverse, fontSize: FontSize.base, fontWeight: FontWeight.semibold },

  profileRow: { flexDirection: 'row', gap: Spacing.base, alignItems: 'center' },
  avatarContainer: {},
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.md },
  avatarText: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: c.textInverse },
  profileInfo: { flex: 1, gap: 4 },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: c.text },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  email: { fontSize: FontSize.sm, color: c.textSecondary },
  premiumBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  premiumBadgeText: { fontSize: FontSize.xs, color: c.warning, fontWeight: FontWeight.bold },
  memberSince: { fontSize: FontSize.xs, color: c.primary, fontWeight: FontWeight.medium },

  card: { backgroundColor: c.card, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: c.borderLight },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text },
  cardSub: { fontSize: FontSize.xs, color: c.textMuted },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  usageItem: { alignItems: 'center', gap: 4, flex: 1 },
  usageLabel: { fontSize: 9, color: c.textSecondary, textAlign: 'center' },
  usageCount: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.text },
  usageCountWarn: { color: c.warning },
  usageBarBg: { width: '80%', height: 4, backgroundColor: c.borderLight, borderRadius: BorderRadius.full, overflow: 'hidden' },
  usageBarFill: { height: '100%', borderRadius: BorderRadius.full },

  premiumBanner: { backgroundColor: c.premiumBg, borderRadius: BorderRadius.xl, padding: Spacing.base, flexDirection: 'row', overflow: 'hidden', minHeight: 130 },
  premiumBannerContent: { flex: 1, gap: Spacing.xs },
  premiumBannerTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  premiumBannerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.textInverse },
  premiumBannerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginTop: 2 },
  managePlanBtn: { backgroundColor: c.background, alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, marginTop: Spacing.sm },
  managePlanText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.premiumBg },
  premiumDecor: { width: 90, alignSelf: 'center', marginLeft: Spacing.sm, position: 'relative', alignItems: 'center', justifyContent: 'center', height: 110 },
  premiumDecorRing: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  premiumDecorBadge1: { position: 'absolute', top: 8, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  premiumDecorBadge2: { position: 'absolute', bottom: 10, left: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  premiumDecorBadge3: { position: 'absolute', bottom: 14, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center' },
  premiumDecorDot1: { position: 'absolute', top: 16, left: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  premiumDecorDot2: { position: 'absolute', top: 32, right: 0, width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(245,158,11,0.5)' },

  menu: { backgroundColor: c.card, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: c.borderLight },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: c.text },
  menuSub: { fontSize: FontSize.xs, color: c.textMuted, marginTop: 1 },
});
