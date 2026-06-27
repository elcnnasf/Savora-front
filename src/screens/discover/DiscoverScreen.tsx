import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeImage } from '../../components/ui/SafeImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Search, SlidersHorizontal, Camera,
  Leaf, Sun, Utensils, Moon, Cake, LayoutGrid, TrendingUp, X,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { RECIPES, POPULAR_SEARCHES } from '../../data/mockData';
import { RootStackParamList, ApiRecipe } from '../../navigation/types';
import { fetchRecipes } from '../../api/recipes';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

interface DisplayRecipe {
  id: string;
  title: string;
  image_url: string;
  cook_time: number;
  calories?: number;
  tags: string[];
  isApi: boolean;
  apiRecipe?: ApiRecipe;
}

function mockToDisplay(r: typeof RECIPES[0]): DisplayRecipe {
  return { id: r.id, title: r.name, image_url: r.image, cook_time: r.cookTime, calories: r.calories, tags: r.tags, isApi: false };
}

function apiToDisplay(r: ApiRecipe): DisplayRecipe {
  return { id: r.id, title: r.title, image_url: r.image_url ?? '', cook_time: r.cook_time, calories: r.calories, tags: r.tags, isApi: true, apiRecipe: r };
}

const GRID_CARD_SIZE = (width - Spacing.base * 2 - Spacing.sm * 2) / 3;

export default function DiscoverScreen() {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const [query,          setQuery]          = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [apiRecipes,     setApiRecipes]     = useState<ApiRecipe[]>([]);
  const [loading,        setLoading]        = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const CATEGORIES = [
    { label: t('discover.allCategories'), key: 'All',      icon: LayoutGrid, bg: colors.primarySurface, iconColor: colors.primary },
    { label: t('discover.breakfast'),     key: 'Breakfast', icon: Sun,        bg: colors.tagQuick,       iconColor: colors.warning },
    { label: t('discover.lunch'),         key: 'Lunch',     icon: Utensils,   bg: colors.tagComfort,     iconColor: colors.tagComfortText },
    { label: t('discover.dinner'),        key: 'Dinner',    icon: Moon,       bg: colors.tagHealthy,     iconColor: colors.tagHealthyText },
    { label: t('discover.desserts'),      key: 'Desserts',  icon: Cake,       bg: colors.tagVegan,       iconColor: colors.tagVeganText },
    { label: t('discover.quick'),         key: 'Quick',     icon: Leaf,       bg: colors.borderLight,    iconColor: colors.textMuted },
  ];

  const loadRecipes = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (q) params.q = q;
      if (cat === 'Quick') params.tags = 'quick';
      else if (cat !== 'All') params.q = (q ? q + ' ' : '') + cat;
      const res = await fetchRecipes(params);
      setApiRecipes(res.data.items);
    } catch {
      setApiRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadRecipes(query, activeCategory), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeCategory, loadRecipes]);

  function handleTagPress(tag: string) {
    const clean = tag.replace('#', '').replace(/-/g, ' ');
    setQuery(clean);
    setActiveCategory('All');
  }

  function handleCategoryPress(key: string) {
    setActiveCategory(key);
    setQuery('');
  }

  const mockFiltered: DisplayRecipe[] = (() => {
    let arr = RECIPES;
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter((r) => r.name.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q)) || r.category?.toLowerCase().includes(q));
    }
    if (activeCategory !== 'All' && activeCategory !== 'Quick') {
      arr = arr.filter((r) => r.category?.toLowerCase() === activeCategory.toLowerCase() || r.tags.some((t) => t.toLowerCase().includes(activeCategory.toLowerCase())));
    }
    if (activeCategory === 'Quick') {
      arr = arr.filter((r) => r.cookTime <= 20 || r.tags.some((t) => t.toLowerCase().includes('quick')));
    }
    return arr.map(mockToDisplay);
  })();

  const apiDisplayed = apiRecipes.map(apiToDisplay);

  const allRecipes: DisplayRecipe[] = [
    ...apiDisplayed,
    ...mockFiltered.filter((m) => !apiDisplayed.find((a) => a.title.toLowerCase() === m.title.toLowerCase())),
  ];

  function navigateToRecipe(r: DisplayRecipe) {
    if (r.isApi && r.apiRecipe) {
      navigation.navigate('RecipeDetail', { recipe: r.apiRecipe });
    } else {
      navigation.navigate('RecipeDetail', { recipeId: r.id });
    }
  }

  const activeCategoryLabel = CATEGORIES.find((c) => c.key === activeCategory)?.label ?? activeCategory;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.title}>{t('nav.discover')}</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={16} color={colors.textMuted} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={t('discover.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
                <X size={16} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
            <SlidersHorizontal size={18} color={colors.textInverse} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
          style={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => handleCategoryPress(cat.key)}
                activeOpacity={0.75}
                style={styles.categoryItem}
              >
                <View style={[styles.categoryIconWrap, { backgroundColor: isActive ? colors.primary : cat.bg }]}>
                  <Icon size={18} color={isActive ? colors.textInverse : cat.iconColor} strokeWidth={2} />
                </View>
                <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {!query && activeCategory === 'All' && (
          <TouchableOpacity style={styles.aiBanner} activeOpacity={0.85} onPress={() => isAuthenticated ? navigation.navigate('AIRecipe') : navigation.navigate('SignIn')}>
            <View style={styles.aiBannerLeft}>
              <View style={styles.aiChip}><Text style={styles.aiChipText}>AI</Text></View>
              <Text style={styles.aiBannerTitle}>Can't find what you're{'\n'}looking for?</Text>
              <Text style={styles.aiBannerSub}>Generate any recipe instantly with AI.</Text>
              <TouchableOpacity style={styles.aiBannerBtn} onPress={() => isAuthenticated ? navigation.navigate('AIRecipe') : navigation.navigate('SignIn')} activeOpacity={0.85}>
                <Text style={styles.aiBannerBtnText}>Generate with AI ✨</Text>
              </TouchableOpacity>
            </View>
            <SafeImage uri={RECIPES[0].image} style={styles.aiBannerImage} />
          </TouchableOpacity>
        )}

        {!query && activeCategory === 'All' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Searches</Text>
            </View>
            <View style={styles.tagsWrap}>
              {POPULAR_SEARCHES.map((tag) => (
                <TouchableOpacity key={tag} style={styles.searchTag} activeOpacity={0.7} onPress={() => handleTagPress(tag)}>
                  <TrendingUp size={12} color={colors.primary} strokeWidth={2.5} />
                  <Text style={styles.searchTagText}>{tag.replace('#', '')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {query
              ? `Results for "${query}" (${allRecipes.length})`
              : activeCategory !== 'All'
                ? activeCategoryLabel
                : 'Recommended for You'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : (
          <View style={styles.recipesGrid}>
            {allRecipes.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No recipes found.</Text>
                <TouchableOpacity onPress={() => isAuthenticated ? navigation.navigate('AIRecipe') : navigation.navigate('SignIn')} activeOpacity={0.8}>
                  <Text style={styles.emptyLink}>Generate one with AI ✨</Text>
                </TouchableOpacity>
              </View>
            ) : (
              allRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.gridCard}
                  activeOpacity={0.85}
                  onPress={() => navigateToRecipe(recipe)}
                >
                  <View style={styles.gridImageWrap}>
                    <SafeImage uri={recipe.image_url} style={styles.gridImage} />
                    {recipe.isApi && (
                      <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.gridInfo}>
                    <Text style={styles.gridName} numberOfLines={2}>{recipe.title}</Text>
                    <Text style={styles.gridMeta}>{recipe.cook_time} min{recipe.calories ? ` · ${recipe.calories} kcal` : ''}</Text>
                    {recipe.tags[0] && (
                      <View style={styles.gridTag}>
                        <Text style={styles.gridTagText}>{recipe.tags[0]}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {!query && (
          <TouchableOpacity style={styles.scanBanner} onPress={() => isAuthenticated ? navigation.navigate('Scan') : navigation.navigate('SignIn')} activeOpacity={0.85}>
            <View style={styles.scanBannerLeft}>
              <View style={styles.scanIconWrap}>
                <Camera size={22} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.scanBannerText}>
                <Text style={styles.scanBannerTitle}>{t('discover.scanIngredients')}</Text>
                <Text style={styles.scanBannerSub}>Find recipes with what's in your kitchen</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.scanNowBtn} onPress={() => isAuthenticated ? navigation.navigate('Scan') : navigation.navigate('SignIn')} activeOpacity={0.85}>
              <Camera size={14} color={colors.textInverse} strokeWidth={2} />
              <Text style={styles.scanNowText}>Scan Now</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { paddingBottom: Spacing.base },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: c.text },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: c.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderWidth: 1, borderColor: c.border,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: c.text },
  filterBtn: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },

  categoriesContainer: { marginBottom: Spacing.lg },
  categoriesScroll: { paddingHorizontal: Spacing.base, gap: Spacing.lg },
  categoryItem: { alignItems: 'center', gap: 6 },
  categoryIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: FontSize.xs, color: c.textSecondary, fontWeight: FontWeight.medium },
  categoryLabelActive: { color: c.primary, fontWeight: FontWeight.bold },

  aiBanner: {
    marginHorizontal: Spacing.base, backgroundColor: c.premiumBg,
    borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.lg,
    flexDirection: 'row', overflow: 'hidden', minHeight: 150,
  },
  aiBannerLeft: { flex: 1, gap: Spacing.xs },
  aiChip: { backgroundColor: c.primary, alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm, marginBottom: 2 },
  aiChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.textInverse },
  aiBannerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.textInverse, lineHeight: 24 },
  aiBannerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  aiBannerBtn: { backgroundColor: c.background, alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, marginTop: 4 },
  aiBannerBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.text },
  aiBannerImage: { width: 110, height: '100%', borderRadius: BorderRadius.lg, marginLeft: Spacing.sm },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.lg },
  searchTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.surface, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: c.border,
  },
  searchTagText: { fontSize: FontSize.sm, color: c.textSecondary },

  loadingBox: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  loadingText: { fontSize: FontSize.sm, color: c.textMuted },
  emptyBox:   { paddingHorizontal: Spacing.base, paddingVertical: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyText:  { fontSize: FontSize.base, color: c.textMuted },
  emptyLink:  { fontSize: FontSize.base, color: c.primary, fontWeight: FontWeight.semibold },

  recipesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.lg },
  gridCard: { width: GRID_CARD_SIZE, backgroundColor: c.card, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  gridImageWrap: { position: 'relative' },
  gridImage: { width: '100%', height: GRID_CARD_SIZE * 0.85 },
  aiBadge: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: c.primary, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  aiBadgeText: { fontSize: 9, fontWeight: FontWeight.bold, color: c.textInverse },
  gridInfo: { padding: Spacing.xs + 2, gap: 2 },
  gridName: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: c.text },
  gridMeta: { fontSize: 10, color: c.textMuted },
  gridTag: { backgroundColor: c.primarySurface, alignSelf: 'flex-start', paddingHorizontal: Spacing.xs + 2, paddingVertical: 1, borderRadius: BorderRadius.full, marginTop: 2 },
  gridTagText: { fontSize: 9, color: c.primary, fontWeight: FontWeight.medium },

  scanBanner: {
    marginHorizontal: Spacing.base, backgroundColor: c.card,
    borderRadius: BorderRadius.xl, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: c.border, ...Shadow.sm,
  },
  scanBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  scanIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primarySurface, alignItems: 'center', justifyContent: 'center' },
  scanBannerText: { flex: 1 },
  scanBannerTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.text },
  scanBannerSub: { fontSize: FontSize.xs, color: c.textMuted, marginTop: 1 },
  scanNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  scanNowText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.textInverse },
});
