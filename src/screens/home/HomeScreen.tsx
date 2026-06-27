import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, TextInput,
} from 'react-native';
import { SafeImage } from '../../components/ui/SafeImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera, Sparkles, CalendarDays, Heart, ChevronRight, Flame, Clock,
  ShoppingCart, Leaf, Users,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { RECIPES } from '../../data/mockData';
import { getGreeting } from '../../utils/date';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

const FILTER_CHIPS = ['High protein', 'Quick meals', 'Low carb', 'Desserts'];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAuthenticated } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const featured = RECIPES[0];
  const inProgress = RECIPES.filter((r) => r.progress !== undefined);

  const QUICK_ACTIONS = [
    { label: t('home.scan'),         sublabel: 'Use AI to detect\ningredients', icon: Camera,      bg: colors.primary,       route: 'Scan' as const },
    { label: t('home.aiRecipe'),     sublabel: 'Generate recipes\njust for you', icon: Sparkles,    bg: colors.quickPlanIcon, route: 'AIRecipe' as const },
    { label: t('home.mealPlan'),     sublabel: 'Plan your meals\nfor the week',  icon: CalendarDays, bg: colors.warning,       route: 'MealPlanner' as const },
    { label: t('home.shoppingList'), sublabel: 'Add items and\nshop smart',      icon: ShoppingCart, bg: colors.info,          route: 'ShoppingList' as const },
  ];

  function goAuth(route: keyof RootStackParamList) {
    if (!isAuthenticated) {
      navigation.navigate('SignIn');
    } else {
      navigation.navigate(route as any);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Leaf size={22} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.logoText}>savora</Text>
          </View>
          <View style={styles.headerRight}>
            {user?.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>👑 Premium</Text>
              </View>
            )}
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.greetingSection}>
          <Text style={styles.greetingSub}>{getGreeting()}, {user?.name ?? 'there'} 👋</Text>
          <Text style={styles.greetingTitle}>What would you like{'\n'}to cook today?</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t('common.search') + ' recipes or ask AI...'}
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={styles.aiSearchBtn}
            onPress={() => goAuth('AIRecipe')}
            activeOpacity={0.85}
          >
            <Sparkles size={20} color={colors.textInverse} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsScroll}
        >
          {FILTER_CHIPS.map((chip) => (
            <TouchableOpacity key={chip} style={styles.filterChip} activeOpacity={0.75}>
              <Text style={styles.filterChipHash}>#</Text>
              <Text style={styles.filterChipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </TouchableOpacity>
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

        <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
          <View>
            <Text style={styles.sectionTitle}>Today's Recommendation</Text>
            <View style={styles.aiPickRow}>
              <Sparkles size={12} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.aiPickText}>AI picked just for you</Text>
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.featuredCard}
          activeOpacity={0.92}
          onPress={() => navigation.navigate('RecipeDetail', { recipeId: featured.id })}
        >
          <SafeImage uri={featured.image} style={styles.featuredImage} />
          <View style={styles.featuredContent}>
            <View style={styles.featuredTopRow}>
              {featured.tags[0] && (
                <View style={styles.featuredTag}>
                  <Text style={styles.featuredTagText}>{featured.tags[0]}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.heartBtn} activeOpacity={0.8}>
                <Heart size={16} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Text style={styles.featuredTitle} numberOfLines={2}>{featured.name}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Flame size={12} color={colors.textMuted} strokeWidth={2} />
                <View>
                  <Text style={styles.statNum}>{featured.calories}</Text>
                  <Text style={styles.statLabel}>kcal</Text>
                </View>
              </View>
              <View style={styles.stat}>
                <Users size={12} color={colors.textMuted} strokeWidth={2} />
                <View>
                  <Text style={styles.statNum}>{featured.protein}g</Text>
                  <Text style={styles.statLabel}>protein</Text>
                </View>
              </View>
              <View style={styles.stat}>
                <Clock size={12} color={colors.textMuted} strokeWidth={2} />
                <View>
                  <Text style={styles.statNum}>{featured.cookTime}</Text>
                  <Text style={styles.statLabel}>{t('recipe.min')}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.cookBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: featured.id })}
            >
              <Text style={styles.cookBtnText}>{t('recipe.startCooking')}</Text>
              <ChevronRight size={15} color={colors.textInverse} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.continueWhere')}</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {inProgress.map((recipe) => {
            const minsLeft = recipe.progress !== undefined
              ? Math.max(1, Math.round(recipe.cookTime * (1 - recipe.progress / 100)))
              : recipe.cookTime;
            return (
              <TouchableOpacity
                key={recipe.id}
                style={styles.continueCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
              >
                <SafeImage uri={recipe.image} style={styles.continueImage} />
                {recipe.progress !== undefined && (
                  <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>{recipe.progress}%</Text>
                  </View>
                )}
                <View style={styles.continueInfo}>
                  <Text style={styles.continueName} numberOfLines={2}>{recipe.name}</Text>
                  <Text style={styles.continueTime}>{minsLeft} min left</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_SIZE = Math.floor((width - Spacing.base * 2 - 6 * 3) / 4);

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { paddingBottom: Spacing.md },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: c.text },
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
  greetingSub: { fontSize: FontSize.base, color: c.textSecondary, marginBottom: 4 },
  greetingTitle: { fontSize: 26, fontWeight: FontWeight.extrabold, color: c.text, lineHeight: 34 },

  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: c.border,
    gap: Spacing.xs,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: c.text },
  aiSearchBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },

  filterChipsScroll: { paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.md },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1, borderColor: c.border,
  },
  filterChipHash: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.primary },
  filterChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: c.text },

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

  featuredCard: {
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.xl,
    backgroundColor: c.card,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: Spacing.lg,
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
  continueName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.text, marginBottom: 2 },
  continueTime: { fontSize: FontSize.xs, color: c.textMuted },
});
