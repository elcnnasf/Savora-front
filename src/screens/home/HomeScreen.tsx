import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Image, ActivityIndicator,
} from 'react-native';
import { SafeImage } from '../../components/ui/SafeImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera, Sparkles, CalendarDays, Heart, ChevronRight, Flame, Clock,
  ShoppingCart, Users, Bookmark,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useCookingProgressStore } from '../../store/cookingProgressStore';
import { useDailyPickStore, todayKey } from '../../store/dailyPickStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { RECIPES } from '../../data/mockData';
import { getGreetingKey } from '../../utils/date';
import { RootStackParamList, ApiRecipe } from '../../navigation/types';
import { fetchRecipes, saveRecipe, unsaveRecipe, getRecipeSavedStatus } from '../../api/recipes';
import { localizeRecipe } from '../../utils/recipeLocale';
import { useUserStore } from '../../store/userStore';
import { rankByPreferences } from '../../utils/preferenceScore';
import { UserAvatar } from '../../components/UserAvatar';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';

// Deterministic "pick of the day": stable for a given user for the whole day,
// rotates tomorrow, and differs per user. Keeps the AI recommendation daily
// instead of reshuffling on every screen focus.
function dailyPickIndex(seedKey: string, len: number): number {
  if (len <= 0) return 0;
  const now = new Date();
  const s = `${seedKey}|${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % len;
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAuthenticated } = useAuthStore();
  const preferences = useUserStore((s) => s.preferences);
  const cookingProgress = useCookingProgressStore((s) => s.progress);
  const cookingSnapshots = useCookingProgressStore((s) => s.snapshots);
  const dailyPick = useDailyPickStore((s) => s.pick);
  const setDailyPick = useDailyPickStore((s) => s.setPick);
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  const styles = makeStyles(colors);

  const [recommendations, setRecommendations] = useState<ApiRecipe[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // Refetch on every focus (not just mount) so titles pick up translations
  // added while the user was viewing a recipe. Fetch a wide pool, then rank
  // by Taste Preferences so "Today's recommendation" actually fits the user.
  useFocusEffect(useCallback(() => {
    fetchRecipes({ limit: 30 })
      .then((res) => setRecommendations(rankByPreferences(res.data.items, preferences)))
      .catch(() => {})
      .finally(() => setLoadingRecs(false));
  }, [preferences]));

  // Daily, per-user recommendation. It must stay fixed for the whole day even
  // when the screen loses/regains focus (and the API returns the pool in a
  // different order), so we persist the chosen recipe id and only reselect when
  // the day changes or the recipe was finished (progress = 100%).
  const uid = user?.id ?? 'guest';
  const today = todayKey();

  const featuredRaw: ApiRecipe | null = useMemo(() => {
    if (recommendations.length === 0) return null;
    // Exclude only *finished* recipes (100%) — starting to cook the featured
    // recipe must not make it disappear from the recommendation mid-day.
    const doneIds = new Set(
      Object.keys(cookingProgress).filter((id) => (cookingProgress[id] ?? 0) >= 100),
    );
    const pool = recommendations.filter((r) => !doneIds.has(r.id));
    const list = pool.length > 0 ? pool : recommendations;

    // Reuse today's stored pick if it's still valid and available.
    if (dailyPick && dailyPick.date === today && dailyPick.userId === uid) {
      const stored = list.find((r) => r.id === dailyPick.recipeId);
      if (stored) return stored;
    }
    const top = list.slice(0, Math.min(8, list.length));
    return top[dailyPickIndex(uid, top.length)] ?? null;
  }, [recommendations, cookingProgress, uid, today, dailyPick]);

  // Persist the pick once chosen (or when the day/pick changes).
  useEffect(() => {
    if (!featuredRaw) return;
    if (!dailyPick || dailyPick.date !== today || dailyPick.userId !== uid || dailyPick.recipeId !== featuredRaw.id) {
      setDailyPick({ date: today, userId: uid, recipeId: featuredRaw.id });
    }
  }, [featuredRaw?.id, today, uid]);

  const featured: ApiRecipe | null = useMemo(
    () => (featuredRaw ? localizeRecipe(featuredRaw, lang) : null),
    [featuredRaw, lang],
  );

  const [featuredSaved, setFeaturedSaved] = useState(false);
  const [savingFeatured, setSavingFeatured] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !featuredRaw) { setFeaturedSaved(false); return; }
    getRecipeSavedStatus(featuredRaw.id)
      .then((res) => setFeaturedSaved(res.data.saved))
      .catch(() => {});
  }, [isAuthenticated, featuredRaw?.id]);

  async function toggleFeaturedSave() {
    if (!isAuthenticated) { navigation.navigate('SignIn'); return; }
    if (!featuredRaw || savingFeatured) return;
    const prev = featuredSaved;
    setSavingFeatured(true);
    setFeaturedSaved(!prev); // optimistic
    try {
      if (prev) await unsaveRecipe(featuredRaw.id);
      else      await saveRecipe(featuredRaw.id);
    } catch {
      setFeaturedSaved(prev); // revert on failure
    } finally {
      setSavingFeatured(false);
    }
  }
  // Half-finished recipes (0 < progress < 100), newest first, kept for 3 days.
  // Sourced from the cooking-progress store's own snapshots so an item survives
  // even after it drops off the (capped) recently-viewed list.
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const inProgressCards = useMemo(() => {
    const cutoff = Date.now() - THREE_DAYS_MS;
    return Object.values(cookingSnapshots)
      .filter((s) => {
        const pct = cookingProgress[s.card.id] ?? 0;
        return pct > 0 && pct < 100 && s.updatedAt >= cutoff;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((s) => ({ ...s.card, pct: cookingProgress[s.card.id] ?? 0 }));
  }, [cookingSnapshots, cookingProgress]);
  const clearAllProgress = useCookingProgressStore((s) => s.clearAll);

  // "Continue" section must never be empty: guests and first-time users get
  // preference-ranked suggestions to start with (API pool, else bundled mocks)
  const continueFallback = useMemo(() => {
    if (inProgressCards.length > 0) return [];
    const fromApi = recommendations
      .filter((r) => r.id !== featuredRaw?.id)
      .slice(0, 5)
      .map((r) => localizeRecipe(r, lang));
    if (fromApi.length > 0) {
      return fromApi.map((r) => ({
        key: r.id,
        title: r.title,
        image: r.image_url || FALLBACK_IMAGE,
        time: r.cook_time ?? 0,
        open: () => navigation.navigate('RecipeDetail', { recipe: r }),
      }));
    }
    return RECIPES.slice(0, 5).map((r) => ({
      key: r.id,
      title: (r.translations?.[lang] as any)?.name ?? r.name,
      image: r.image || FALLBACK_IMAGE,
      time: r.cookTime,
      open: () => navigation.navigate('RecipeDetail', { recipeId: r.id }),
    }));
  }, [inProgressCards.length, recommendations, lang, featuredRaw?.id]);

  // Fallback mock featured for when API has no data
  const mockFeatured = RECIPES[0];
  const mockName = (r: typeof RECIPES[0]) => (r.translations?.[lang] as any)?.name ?? r.name;

  const QUICK_ACTIONS = [
    { label: t('home.scan'),         sublabel: t('home.scanSub'),         icon: Camera,       bg: '#16A34A',            route: 'Scan' as const },
    { label: t('home.aiRecipe'),     sublabel: t('home.aiRecipeSub'),     icon: Sparkles,     bg: colors.quickPlanIcon, route: 'AIRecipe' as const },
    { label: t('home.mealPlan'),     sublabel: t('home.mealPlanSub'),     icon: CalendarDays, bg: colors.warning,       route: 'MealPlanner' as const },
    { label: t('home.shoppingList'), sublabel: t('home.shoppingListSub'), icon: ShoppingCart, bg: colors.info,          route: 'ShoppingList' as const },
  ];

  function goAuth(route: keyof RootStackParamList) {
    if (!isAuthenticated) {
      navigation.navigate('SignIn');
    } else {
      navigation.navigate(route as any);
    }
  }

  function navigateToRecipe(recipe: ApiRecipe) {
    navigation.navigate('RecipeDetail', { recipe });
  }

  function navigateToMock(id: string) {
    navigation.navigate('RecipeDetail', { recipeId: id });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        overScrollMode="never"
      >

        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../../assets/logo-chef.png')} style={styles.logoImg} resizeMode="contain" />
            <Text style={styles.logoText}>savora</Text>
          </View>
          <View style={styles.headerRight}>
            {(user?.isPremium || user?.isPro) && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>{user?.isPro ? '👑 Pro' : '👑 Premium'}</Text>
              </View>
            )}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Profile' as any)}
            >
              <UserAvatar avatar={user?.avatar} name={user?.name} size={36} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.greetingSection}>
          <Text style={styles.greetingSub}>
            {t('home.' + getGreetingKey())}{user?.name ? `, ${user.name}` : ''} 👋
          </Text>
          {(() => {
            const full = t('home.whatToCook');
            const idx = full.lastIndexOf(' ');
            return (
              <Text style={styles.greetingTitle}>
                {full.slice(0, idx + 1)}
                <Text style={styles.greetingTitleHighlight}>{full.slice(idx + 1)}</Text>
              </Text>
            );
          })()}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        </View>

        <View style={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={action.label}
                style={[styles.quickCard, { backgroundColor: action.bg }]}
                onPress={() => goAuth(action.route)}
                activeOpacity={0.8}
              >
                <View style={styles.quickIconWrap}>
                  <Icon size={18} color={colors.textInverse} strokeWidth={2} />
                </View>
                <Text style={styles.quickCardTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{action.label}</Text>
                <Text style={styles.quickCardSub} numberOfLines={2}>{action.sublabel}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Calorie Counter (Premium/Pro) */}
        <TouchableOpacity
          style={styles.calorieBanner}
          onPress={() => goAuth('CalorieCounter')}
          activeOpacity={0.88}
        >
          <View style={styles.calorieBannerIcon}>
            <Flame size={22} color="#F59E0B" strokeWidth={2} />
          </View>
          <View style={styles.calorieBannerText}>
            <View style={styles.calorieBannerTitleRow}>
              <Text style={styles.calorieBannerTitle}>{t('calorieCounter.title')}</Text>
              <View style={styles.proChip}>
                <Text style={styles.proChipText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.calorieBannerSub} numberOfLines={2}>{t('calorieCounter.bannerSub')}</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>

        {/* Today's Recommendations */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
          <View>
            <Text style={styles.sectionTitle}>{t('home.todayRecommendation')}</Text>
            <View style={styles.aiPickRow}>
              <Sparkles size={12} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.aiPickText}>{t('home.aiPickForYou')}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Discover' as any)} activeOpacity={0.7}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {loadingRecs ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : featured ? (
          <TouchableOpacity
            style={styles.featuredCard}
            activeOpacity={0.92}
            onPress={() => navigateToRecipe(featured)}
          >
            <SafeImage uri={featured.image_url || FALLBACK_IMAGE} style={styles.featuredImage} />
            <View style={styles.featuredContent}>
              <View style={styles.featuredTopRow}>
                {featured.tags?.[0] ? (
                  <View style={styles.featuredTag}>
                    <Text style={styles.featuredTagText}>{featured.tags[0]}</Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={toggleFeaturedSave}
                  disabled={savingFeatured}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Bookmark
                    size={16}
                    color={featuredSaved ? colors.primary : colors.textSecondary}
                    fill={featuredSaved ? colors.primary : 'transparent'}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={2}>{featured.title}</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Flame size={12} color={colors.textMuted} strokeWidth={2} />
                  <View>
                    <Text style={styles.statNum}>{featured.calories ?? 0}</Text>
                    <Text style={styles.statLabel}>kcal</Text>
                  </View>
                </View>
                <View style={styles.stat}>
                  <Users size={12} color={colors.textMuted} strokeWidth={2} />
                  <View>
                    <Text style={styles.statNum}>{featured.protein ?? 0}g</Text>
                    <Text style={styles.statLabel}>{t('recipe.protein').toLowerCase()}</Text>
                  </View>
                </View>
                <View style={styles.stat}>
                  <Clock size={12} color={colors.textMuted} strokeWidth={2} />
                  <View>
                    <Text style={styles.statNum}>{featured.cook_time ?? 0}</Text>
                    <Text style={styles.statLabel}>{t('recipe.min')}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.cookBtn}
                activeOpacity={0.85}
                onPress={() => navigateToRecipe(featured)}
              >
                <Text style={styles.cookBtnText}>{t('recipe.startCooking')}</Text>
                <ChevronRight size={15} color={colors.textInverse} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ) : (
          // Fallback to mock featured when API has no recipes
          <TouchableOpacity
            style={styles.featuredCard}
            activeOpacity={0.92}
            onPress={() => navigateToMock(mockFeatured.id)}
          >
            <SafeImage uri={mockFeatured.image} style={styles.featuredImage} />
            <View style={styles.featuredContent}>
              <View style={styles.featuredTopRow}>
                {mockFeatured.tags[0] && (
                  <View style={styles.featuredTag}>
                    <Text style={styles.featuredTagText}>{mockFeatured.tags[0]}</Text>
                  </View>
                )}
                <View style={styles.heartBtn}>
                  <Heart size={16} color={colors.textSecondary} strokeWidth={2} />
                </View>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={2}>{mockName(mockFeatured)}</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Flame size={12} color={colors.textMuted} strokeWidth={2} />
                  <View>
                    <Text style={styles.statNum}>{mockFeatured.calories}</Text>
                    <Text style={styles.statLabel}>kcal</Text>
                  </View>
                </View>
                <View style={styles.stat}>
                  <Users size={12} color={colors.textMuted} strokeWidth={2} />
                  <View>
                    <Text style={styles.statNum}>{mockFeatured.protein}g</Text>
                    <Text style={styles.statLabel}>{t('recipe.protein').toLowerCase()}</Text>
                  </View>
                </View>
                <View style={styles.stat}>
                  <Clock size={12} color={colors.textMuted} strokeWidth={2} />
                  <View>
                    <Text style={styles.statNum}>{mockFeatured.cookTime}</Text>
                    <Text style={styles.statLabel}>{t('recipe.min')}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.cookBtn}
                activeOpacity={0.85}
                onPress={() => navigateToMock(mockFeatured.id)}
              >
                <Text style={styles.cookBtnText}>{t('recipe.startCooking')}</Text>
                <ChevronRight size={15} color={colors.textInverse} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Continue where you left off — never empty: falls back to
            preference-ranked suggestions for guests / first-time users */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('home.continueWhere')}</Text>
            {inProgressCards.length === 0 && (
              <Text style={styles.aiPickText}>{t('home.startCookingHint')}</Text>
            )}
          </View>
          {inProgressCards.length > 0 && (
            <TouchableOpacity onPress={clearAllProgress} activeOpacity={0.7}>
              <Text style={styles.seeAll}>{t('discover.reset')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {inProgressCards.length > 0 ? (
            inProgressCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.continueCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('RecipeDetail', { recipeId: card.id })}
              >
                <SafeImage uri={card.image_url || FALLBACK_IMAGE} style={styles.continueImage} />
                <View style={styles.progressBadge}>
                  <Text style={styles.progressText}>{card.pct}%</Text>
                </View>
                <View style={styles.continueInfo}>
                  <Text style={styles.continueName} numberOfLines={1}>{card.title}</Text>
                  <View style={styles.progressBarRow}>
                    <View style={[styles.progressBarFill, { width: `${card.pct}%` }]} />
                  </View>
                  <Text style={styles.continueTime}>{card.cook_time ?? 0} {t('recipe.min')}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            continueFallback.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.continueCard}
                activeOpacity={0.85}
                onPress={item.open}
              >
                <SafeImage uri={item.image} style={styles.continueImage} />
                <View style={styles.progressBadge}>
                  <Text style={styles.progressText}>{t('home.newBadge')}</Text>
                </View>
                <View style={styles.continueInfo}>
                  <Text style={styles.continueName} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.continueTime}>{item.time} {t('recipe.min')}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_SIZE = Math.floor((width - Spacing.base * 2 - 6 * 3) / 4);

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { paddingBottom: Spacing.sm, flexGrow: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  logoImg: { width: 44, height: 44 },
  logoText: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: c.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  premiumBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: c.warning,
  },
  premiumBadgeText: { fontSize: FontSize.xs, color: c.warning, fontWeight: FontWeight.semibold },
  avatarSmall: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSmallText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.textInverse },

  greetingSection: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  greetingSub: { fontSize: FontSize.base, color: c.primary, marginBottom: 4 },
  greetingTitle: { fontSize: 26, fontWeight: FontWeight.extrabold, color: c.text, lineHeight: 34 },
  greetingTitleHighlight: { fontSize: 26, fontWeight: FontWeight.extrabold, color: c.primary, lineHeight: 34 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
  seeAll: { fontSize: FontSize.sm, color: c.primary, fontWeight: FontWeight.medium },
  aiPickRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  aiPickText: { fontSize: FontSize.xs, color: c.textMuted },

  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: 6,
  },
  quickCard: {
    width: CARD_SIZE,
    height: CARD_SIZE + 22,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 9,
    justifyContent: 'space-between',
  },
  quickIconWrap: {
    width: 33, height: 33,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  quickCardTitle: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: c.textInverse,
    lineHeight: 14,
  },
  quickCardSub: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 11,
    marginTop: 1,
  },

  calorieBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: c.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: c.borderLight,
    ...Shadow.sm,
  },
  calorieBannerIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
  },
  calorieBannerText: { flex: 1 },
  calorieBannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calorieBannerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text },
  proChip: {
    backgroundColor: '#1F2937',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  proChipText: { fontSize: 9, fontWeight: FontWeight.extrabold, color: '#FBBF24', letterSpacing: 0.5 },
  calorieBannerSub: { fontSize: FontSize.xs, color: c.textMuted, marginTop: 1 },

  loadingBox: {
    marginHorizontal: Spacing.base,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },

  featuredCard: {
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.xl,
    backgroundColor: c.card,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.md,
    minHeight: 170,
  },
  featuredImage: { width: '42%', height: '100%' },
  featuredContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  featuredTag: {
    backgroundColor: c.primarySurface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  featuredTagText: { fontSize: FontSize.xs, color: c.primary, fontWeight: FontWeight.semibold },
  heartBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: c.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  featuredTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: c.text,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statNum: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.text },
  statLabel: { fontSize: 9, color: c.textMuted },
  cookBtn: {
    backgroundColor: c.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cookBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.textInverse },

  horizontalScroll: { paddingHorizontal: Spacing.base, gap: Spacing.md },

  recCard: {
    width: 145,
    borderRadius: BorderRadius.lg,
    backgroundColor: c.card,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  recImage: { width: '100%', height: 95 },
  recInfo: { padding: Spacing.sm, gap: 4 },
  recName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.text },
  recMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  recMetaText: { fontSize: 9, color: c.textMuted },

  continueCard: {
    width: 145,
    borderRadius: BorderRadius.lg,
    backgroundColor: c.card,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  continueImage: { width: '100%', height: 105 },
  progressBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  progressText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.textInverse },
  continueInfo: { padding: Spacing.sm },
  continueName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.text, marginBottom: 4 },
  continueTime: { fontSize: FontSize.xs, color: c.textMuted },
  progressBarRow: {
    height: 3, backgroundColor: c.borderLight, borderRadius: 2,
    marginBottom: 4, overflow: 'hidden',
  },
  progressBarFill: { height: 3, backgroundColor: c.primary, borderRadius: 2 },
});
