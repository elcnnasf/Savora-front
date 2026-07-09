import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell, Settings, ChevronRight, Crown, Utensils,
  CalendarDays, ShoppingCart, LogOut, Pencil,
  Camera, Sparkles, MessageCircle, ChefHat, Zap, LogIn, ShieldCheck,
  Globe, Check, X,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { AiUsageToday } from '../../api/auth';
import { RootStackParamList } from '../../navigation/types';
import { LANGUAGES, LANG_NATIVE } from '../../constants/languages';
import { UserAvatar } from '../../components/UserAvatar';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LIMITS = {
  free:    { recipes: 3,  suggestions: 5,  scans: 3,  chat: 10, mealPlans: 1 },
  premium: { recipes: 10, suggestions: 15, scans: 10, chat: 50, mealPlans: 3 },
  pro:     { recipes: 25, suggestions: 30, scans: 20, chat: 100, mealPlans: 5 },
};

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

  const { language, setLanguage } = useUserStore();
  const [resetIn, setResetIn] = useState(getTimeUntilMidnight());
  const [langSheetVisible, setLangSheetVisible] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setResetIn(getTimeUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  useFocusEffect(useCallback(() => {
    if (isAuthenticated) refreshUsage();
  }, [isAuthenticated]));

  const MENU_ITEMS = [
    { label: t('profile.tastePreferences'), sub: t('profile.tastePreferencesSub'),  icon: Utensils,      route: 'TastePreferences' as const, color: colors.quickScanIcon },
    { label: t('settings.language'),        sub: LANG_NATIVE[language] ?? language, icon: Globe,         route: null,                        color: colors.primary },
    { label: t('profile.mealPlansMenu'),    sub: t('profile.mealPlansMenuSub'),         icon: CalendarDays,  route: 'MealPlanner' as const,      color: colors.info },
    { label: t('profile.shoppingListsMenu'), sub: t('profile.shoppingListsMenuSub'),           icon: ShoppingCart,  route: 'ShoppingList' as const,     color: colors.quickPlanIcon },
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
          <Text style={styles.guestTitle}>{t('profile.guestTitle')}</Text>
          <Text style={styles.guestSubtitle}>
            {t('profile.guestSubtitle')}
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

  const isAdmin = user?.email === 'savorachef@gmail.com';
  const tier    = user?.isPro ? LIMITS.pro : user?.isPremium ? LIMITS.premium : LIMITS.free;

  const aiUsageItems = [
    { label: t('profile.recipes'),     value: usage.recipes_count,     max: tier.recipes,   icon: Utensils },
    { label: t('profile.suggestions'), value: usage.suggestions_count, max: tier.suggestions, icon: Sparkles },
    { label: t('profile.mealPlans'),   value: usage.meal_plans_count,  max: tier.mealPlans, icon: CalendarDays },
    { label: t('profile.scans'),       value: usage.scans_count,       max: tier.scans,     icon: Camera },
    { label: t('profile.chats'),       value: usage.ai_chat_count,     max: tier.chat,      icon: MessageCircle },
  ];

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
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('EditProfile')}>
            <UserAvatar avatar={user?.avatar} name={user?.name} size={72} />
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{user?.name}</Text>
              <TouchableOpacity
                style={styles.editBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Pencil size={13} color={colors.primary} strokeWidth={2} />
                <Text style={styles.editBtnText}>{t('editProfile.edit')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.emailRow}>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
            {(user?.isPremium || user?.isPro) && (
              <View style={styles.premiumBadgeRow}>
                <View style={styles.premiumBadge}>
                  <Crown size={11} color={colors.warning} strokeWidth={2} />
                  <Text style={styles.premiumBadgeText}>{user.isPro ? 'Pro' : t('profile.premium')}</Text>
                </View>
                <Text style={styles.memberSince}>{t('profile.memberSincePrefix')} {user.memberSince}</Text>
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
              const pct = isAdmin ? 0 : Math.min(item.value / item.max, 1);
              const isNearLimit = !isAdmin && pct >= 0.8;
              return (
                <View key={item.label} style={styles.usageItem}>
                  <Icon size={20} color={isAdmin ? colors.primary : isNearLimit ? colors.warning : colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.usageLabel}>{item.label}</Text>
                  <Text style={[styles.usageCount, isNearLimit && styles.usageCountWarn]}>
                    {item.value}/{isAdmin ? '∞' : item.max}
                  </Text>
                  <View style={styles.usageBarBg}>
                    <View style={[styles.usageBarFill, { width: isAdmin ? '0%' : `${Math.round(pct * 100)}%` as any, backgroundColor: isNearLimit ? colors.warning : colors.primary }]} />
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
              <Text style={styles.premiumBannerTitle}>{t('premiumScreen.title')}</Text>
            </View>
            <Text style={styles.premiumBannerSub}>
              {t('profile.premiumBannerSub')}
            </Text>
            <TouchableOpacity
              style={styles.managePlanBtn}
              onPress={() => navigation.navigate('ManagePlan')}
              activeOpacity={0.85}
            >
              <Text style={styles.managePlanText}>{t('managePlan.title')}</Text>
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
                onPress={() => item.route ? navigation.navigate(item.route as any) : setLangSheetVisible(true)}
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

        {user?.email === 'savorachef@gmail.com' && (
          <View style={[styles.menu, { marginTop: Spacing.sm }]}>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => navigation.navigate('AdminPanel')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#7C3AED18' }]}>
                <ShieldCheck size={18} color="#7C3AED" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{t('profile.adminPanel')}</Text>
                <Text style={styles.menuSub}>{t('profile.adminPanelSub')}</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

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

      {/* ── Language Sheet ─────────────────────────────────────────────── */}
      <Modal visible={langSheetVisible} transparent animationType="slide" onRequestClose={() => setLangSheetVisible(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setLangSheetVisible(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('settings.selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setLangSheetVisible(false)} activeOpacity={0.7}>
                <X size={20} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.optionRow, language === lang && styles.optionRowActive]}
                onPress={() => { setLanguage(lang); setLangSheetVisible(false); }}
                activeOpacity={0.75}
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>{lang}</Text>
                  <Text style={styles.optionDesc}>{LANG_NATIVE[lang]}</Text>
                </View>
                {language === lang && <Check size={18} color={colors.primary} strokeWidth={2.5} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: c.text, flexShrink: 1 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  editBtnText: { fontSize: FontSize.xs, color: c.primary, fontWeight: FontWeight.semibold },
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
  managePlanBtn: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, marginTop: Spacing.sm },
  managePlanText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#0A2416' },
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

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.background, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl, paddingTop: Spacing.sm,
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: Spacing.sm },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, marginBottom: Spacing.xs,
  },
  optionRowActive: { backgroundColor: c.primarySurface },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text },
  optionDesc: { fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },
});
