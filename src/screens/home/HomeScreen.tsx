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
  ShoppingCart, Users,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useRecentlyViewedStore } from '../../store/recentlyViewedStore';
import { useCookingProgressStore } from '../../store/cookingProgressStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { RECIPES } from '../../data/mockData';
import { getGreetingKey } from '../../utils/date';
import { RootStackParamList, ApiRecipe } from '../../navigation/types';
import { fetchRecipes } from '../../api/recipes';
import { localizeRecipe, localizeRecipes } from '../../utils/recipeLocale';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAuthenticated } = useAuthStore();
  const recentlyViewed = useRecentlyViewedStore((s) => s.recipes);
  const cookingProgress = useCookingProgressStore((s) => s.progress);
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  const styles = makeStyles(colors);

  const [recommendations, setRecommendations] = useState<ApiRecipe[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // Refetch on every focus (not just mount) so titles pick up translations
  // added while the user was viewing a recipe
  useFocusEffect(useCallback(() => {
    fetchRecipes({ limit: 6 })
      .then((res) => setRecommendations(res.data.items))
      .catch(() => {})
      .finally(() => setLoadingRecs(false));
  }, []));

  const featured: ApiRecipe | null = useMemo(
    () => (recommendations[0] ? localizeRecipe(recommendations[0], lang) : null),
    [recommendations, lang],
  );
  const localizedRecentlyViewed = useMemo(
    () => localizeRecipes(recentlyViewed, lang),
    [recentlyViewed, lang],
  );

  // Only recipes with cooking actually started and left unfinished
  const inProgressRecipes = useMemo(
    () => localizedRecentlyViewed.filter((r) => (cookingProgress[r.id] ?? 0) > 0),
    [localizedRecentlyViewed, cookingProgress],
  );
  const clearAllProgress = useCookingProgressStore((s) => s.clearAll);

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
            {user?.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>👑 Premium</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.avatarSmall}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Profile' as any)}
            >
              <Text style={styles.avatarSmallText}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
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
                <View style={styles.heartBtn}>
                  <Heart size={16} color={colors.textSecondary} strokeWidth={2} />
                </View>
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

        {/* Continue where you left off — only half-cooked recipes */}
        {inProgressRecipes.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.continueWhere')}</Text>
              <TouchableOpacity onPress={clearAllProgress} activeOpacity={0.7}>
                <Text style={styles.seeAll}>{t('discover.reset')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {inProgressRecipes.map((recipe) => {
                const pct = cookingProgress[recipe.id];
                return (
                  <TouchableOpacity
                    key={recipe.id}
                    style={styles.continueCard}
                    activeOpacity={0.85}
                    onPress={() => navigateToRecipe(recipe)}
                  >
                    <SafeImage uri={recipe.image_url || FALLBACK_IMAGE} style={styles.continueImage} />
                    <View style={styles.progressBadge}>
                      <Text style={styles.progressText}>{pct}%</Text>
                    </View>
                    <View style={styles.continueInfo}>
                      <Text style={styles.continueName}>{recipe.title}</Text>
                      <View style={styles.progressBarRow}>
                        <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.continueTime}>{recipe.cook_time ?? 0} {t('recipe.min')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

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
