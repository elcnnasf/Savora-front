import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, ActivityIndicator, Modal,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeImage } from '../../components/ui/SafeImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDiscoverFilterStore } from '../../store/discoverFilterStore';
import {
  Search, SlidersHorizontal, Camera, Clock, Flame, Star,
  Leaf, Sun, Utensils, Moon, Cake, LayoutGrid, TrendingUp, X,
  CupSoda, Soup, Salad, Gauge, Globe, Check,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { RECIPES, POPULAR_SEARCHES } from '../../data/mockData';
import { RootStackParamList, ApiRecipe } from '../../navigation/types';
import { fetchRecipes } from '../../api/recipes';
import { localizeRecipe } from '../../utils/recipeLocale';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width, height } = Dimensions.get('window');

interface DisplayRecipe {
  id: string;
  title: string;
  image_url: string;
  cook_time: number;
  calories?: number;
  difficulty?: string;
  ratingAvg?: number | null;
  tags: string[];
  isApi: boolean;
  apiRecipe?: ApiRecipe;
}

interface Filters {
  difficulty?: 'easy' | 'medium' | 'hard';
  maxTime?: number;
  cuisine?: string;
  minRating?: number;
  maxCalories?: number;
}

const PAGE_SIZE = 12;

// Categories filter by tags (tags are stored lowercase, matching is case-insensitive)
const CAT_TAGS: Record<string, string> = {
  Breakfast: 'breakfast,brunch',
  Lunch:     'lunch,main course',
  Dinner:    'dinner,main course,casserole,stew',
  Desserts:  'dessert,desserts,sweet,cake,pastry',
  // note: no bare "tea"/"coffee" — those tags also sit on cookies and cakes served with tea
  Drinks:    'drink,drinks,beverage,cold drink,espresso,ayran,yogurt drink,turkish beverage,smoothie,cocktail,juice,lemonade,compote,sherbet',
  Soups:     'soup,cold soup,noodle soup,lentil soup,piti',
  Salads:    'salad,summer salad',
};

const CUISINES = ['Azerbaijani', 'Turkish', 'Russian', 'Georgian', 'Italian', 'International'];
const TIME_OPTIONS = [15, 30, 45, 60];
const RATING_OPTIONS = [3, 4, 4.5];
const CALORIE_OPTIONS = [300, 500, 800];

function mockToDisplay(r: typeof RECIPES[0], lang: string): DisplayRecipe {
  const localizedName = (r.translations?.[lang] as any)?.name ?? r.name;
  return { id: r.id, title: localizedName, image_url: r.image, cook_time: r.cookTime, calories: r.calories, tags: r.tags, isApi: false };
}

function apiToDisplay(r: ApiRecipe, lang: string): DisplayRecipe {
  const localized = localizeRecipe(r, lang);
  return {
    id: r.id, title: localized.title, image_url: r.image_url ?? '',
    cook_time: r.cook_time, calories: r.calories, difficulty: r.difficulty,
    ratingAvg: r.rating_avg ?? null,
    tags: r.tags ?? [], isApi: true, apiRecipe: r,
  };
}

const CARD_W = (width - Spacing.base * 2 - Spacing.sm) / 2;

export default function DiscoverScreen() {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated } = useAuthStore();
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  const styles = makeStyles(colors);

  const [query,          setQuery]          = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [apiRecipes,     setApiRecipes]     = useState<ApiRecipe[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(false);
  const [total,          setTotal]          = useState(0);
  const [filters,        setFilters]        = useState<Filters>({});
  const [filterVisible,  setFilterVisible]  = useState(false);
  const [draft,          setDraft]          = useState<Filters>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Synchronous guard: loadingMore state doesn't update until re-render, so
  // rapid scroll events could otherwise fetch and append the same page twice
  const loadingMoreRef = useRef(false);

  const pendingQuery      = useDiscoverFilterStore((s) => s.pendingQuery);
  const clearPendingQuery = useDiscoverFilterStore((s) => s.clear);

  useFocusEffect(useCallback(() => {
    if (pendingQuery) {
      setQuery(pendingQuery);
      setActiveCategory('All');
      clearPendingQuery();
    }
  }, [pendingQuery]));

  const CATEGORIES = [
    { label: t('discover.allCategories'), key: 'All',       icon: LayoutGrid, bg: colors.primarySurface, iconColor: colors.primary },
    { label: t('discover.breakfast'),     key: 'Breakfast', icon: Sun,        bg: colors.tagQuick,       iconColor: colors.warning },
    { label: t('discover.lunch'),         key: 'Lunch',     icon: Utensils,   bg: colors.tagComfort,     iconColor: colors.tagComfortText },
    { label: t('discover.dinner'),        key: 'Dinner',    icon: Moon,       bg: colors.tagHealthy,     iconColor: colors.tagHealthyText },
    { label: t('discover.soups'),         key: 'Soups',     icon: Soup,       bg: colors.tagComfort,     iconColor: colors.tagComfortText },
    { label: t('discover.salads'),        key: 'Salads',    icon: Salad,      bg: colors.tagVegan,       iconColor: colors.tagVeganText },
    { label: t('discover.drinks'),        key: 'Drinks',    icon: CupSoda,    bg: colors.tagHighProtein, iconColor: colors.tagHighProteinText },
    { label: t('discover.desserts'),      key: 'Desserts',  icon: Cake,       bg: colors.tagVegan,       iconColor: colors.tagVeganText },
    { label: t('discover.quick'),         key: 'Quick',     icon: Leaf,       bg: colors.borderLight,    iconColor: colors.textMuted },
  ];

  const activeFilterCount =
    (filters.difficulty ? 1 : 0) + (filters.maxTime ? 1 : 0) + (filters.cuisine ? 1 : 0) +
    (filters.minRating ? 1 : 0) + (filters.maxCalories ? 1 : 0);

  const loadRecipes = useCallback(async (q: string, cat: string, f: Filters, pageNum: number, append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const params: Parameters<typeof fetchRecipes>[0] = { limit: PAGE_SIZE, page: pageNum };
      if (q) params.q = q;
      if (cat !== 'All' && cat !== 'Quick') params.tags = CAT_TAGS[cat] ?? cat.toLowerCase();
      if (f.difficulty) params.difficulty = f.difficulty;
      if (f.cuisine)    params.cuisine    = f.cuisine;
      if (f.minRating)   params.min_rating   = f.minRating;
      if (f.maxCalories) params.max_calories = f.maxCalories;
      // "Quick" is a time cap, not a tag — combine with the user's own max-time filter
      const timeCap = cat === 'Quick' ? Math.min(20, f.maxTime ?? 20) : f.maxTime;
      if (timeCap) params.max_cook_time = timeCap;

      const res = await fetchRecipes(params);
      setApiRecipes((prev) => {
        if (!append) return res.data.items;
        // Drop items already in the list — a concurrent refetch or repeated
        // append would otherwise produce duplicate React keys
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...res.data.items.filter((r) => !seen.has(r.id))];
      });
      setHasMore(res.data.hasMore);
      setTotal(res.data.total ?? 0);
      setPage(pageNum);
    } catch {
      if (!append) { setApiRecipes([]); setHasMore(false); setTotal(0); }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadRecipes(query, activeCategory, filters, 1, false), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeCategory, filters, loadRecipes]);

  // Refetch when returning to this screen — a recipe just generated or lazily
  // translated while viewing would otherwise keep showing its stale list entry
  const focusedOnce = useRef(false);
  useFocusEffect(useCallback(() => {
    if (!focusedOnce.current) { focusedOnce.current = true; return; }
    loadRecipes(query, activeCategory, filters, 1, false);
  }, [query, activeCategory, filters, loadRecipes]));

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 600;
    if (nearBottom && hasMore && !loading && !loadingMore && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      loadRecipes(query, activeCategory, filters, page + 1, true);
    }
  }

  function handleTagPress(tag: string) {
    const clean = tag.replace('#', '').replace(/-/g, ' ');
    setQuery(clean);
    setActiveCategory('All');
  }

  function handleCategoryPress(key: string) {
    setActiveCategory(key);
    setQuery('');
  }

  function openFilters() {
    setDraft(filters);
    setFilterVisible(true);
  }

  function applyFilters() {
    setFilters(draft);
    setFilterVisible(false);
  }

  function resetFilters() {
    setDraft({});
  }

  // Mock recipes only pad the end of the list: after the last API page, without
  // active filters (mocks have no difficulty/cuisine metadata to filter on)
  const showMocks = !hasMore && !loading && activeFilterCount === 0;
  const mockFiltered: DisplayRecipe[] = !showMocks ? [] : (() => {
    let arr = RECIPES;
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter((r) => {
        const localizedName = ((r.translations?.[lang] as any)?.name ?? '').toLowerCase();
        return r.name.toLowerCase().includes(q) || localizedName.includes(q) || r.tags.some((t) => t.toLowerCase().includes(q)) || r.category?.toLowerCase().includes(q);
      });
    }
    if (activeCategory !== 'All' && activeCategory !== 'Quick') {
      const catTags = (CAT_TAGS[activeCategory] ?? activeCategory).toLowerCase().split(',');
      arr = arr.filter((r) => r.category?.toLowerCase() === activeCategory.toLowerCase() || r.tags.some((t) => catTags.includes(t.toLowerCase())));
    }
    if (activeCategory === 'Quick') {
      arr = arr.filter((r) => r.cookTime <= 20 || r.tags.some((t) => t.toLowerCase().includes('quick')));
    }
    return arr.map((r) => mockToDisplay(r, lang));
  })();

  // Safety net if the backend ignores max_calories: never show recipes over the cap
  const apiDisplayed = apiRecipes
    .filter((r) => !filters.maxCalories || r.calories == null || r.calories <= filters.maxCalories)
    .map((r) => apiToDisplay(r, lang));

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
  const DIFF_LABEL: Record<string, string> = { easy: t('discover.easy'), medium: t('discover.medium'), hard: t('discover.hard') };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      >

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
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8} onPress={openFilters}>
            <SlidersHorizontal size={18} color={colors.textInverse} strokeWidth={2} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
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
              <Text style={styles.aiBannerTitle}>{t('discover.cantFind')}</Text>
              <Text style={styles.aiBannerSub}>{t('discover.aiBannerSub')}</Text>
              <TouchableOpacity style={styles.aiBannerBtn} onPress={() => isAuthenticated ? navigation.navigate('AIRecipe') : navigation.navigate('SignIn')} activeOpacity={0.85}>
                <Text style={styles.aiBannerBtnText}>{t('discover.generateWithAi')}</Text>
              </TouchableOpacity>
            </View>
            <SafeImage uri={RECIPES[0].image} style={styles.aiBannerImage} />
          </TouchableOpacity>
        )}

        {!query && activeCategory === 'All' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('discover.popularSearches')}</Text>
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
              ? `${t('discover.resultsFor')} "${query}"`
              : activeCategory !== 'All'
                ? activeCategoryLabel
                : t('discover.recommendedForYou')}
          </Text>
          {total > 0 && !loading && (
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>{total}</Text>
            </View>
          )}
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
                <Text style={styles.emptyText}>{t('discover.noRecipesFound')}</Text>
                <TouchableOpacity onPress={() => isAuthenticated ? navigation.navigate('AIRecipe') : navigation.navigate('SignIn')} activeOpacity={0.8}>
                  <Text style={styles.emptyLink}>{t('discover.generateAiLink')}</Text>
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
                    {!!recipe.difficulty && (
                      <View style={styles.diffBadge}>
                        <Text style={styles.diffBadgeText}>{DIFF_LABEL[recipe.difficulty] ?? recipe.difficulty}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.gridInfo}>
                    <Text style={styles.gridName} numberOfLines={2}>{recipe.title}</Text>
                    <View style={styles.gridMetaRow}>
                      <Clock size={12} color={colors.textMuted} strokeWidth={2} />
                      <Text style={styles.gridMeta}>{recipe.cook_time} min</Text>
                      {!!recipe.calories && (
                        <>
                          <Flame size={12} color={colors.textMuted} strokeWidth={2} />
                          <Text style={styles.gridMeta}>{recipe.calories} kcal</Text>
                        </>
                      )}
                      {recipe.ratingAvg != null && (
                        <>
                          <Star size={12} color={colors.warning} fill={colors.warning} strokeWidth={0} />
                          <Text style={styles.gridMeta}>{recipe.ratingAvg.toFixed(1)}</Text>
                        </>
                      )}
                    </View>
                    {recipe.tags[0] && (
                      <View style={styles.gridTag}>
                        <Text style={styles.gridTagText} numberOfLines={1}>{recipe.tags[0]}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {loadingMore && (
          <View style={styles.loadMoreBox}>
            <ActivityIndicator size="small" color={colors.primary} />
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
                <Text style={styles.scanBannerSub}>{t('discover.scanForIngredients')}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.scanNowBtn} onPress={() => isAuthenticated ? navigation.navigate('Scan') : navigation.navigate('SignIn')} activeOpacity={0.85}>
              <Camera size={14} color={colors.textInverse} strokeWidth={2} />
              <Text style={styles.scanNowText}>{t('discover.scanNow')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <View style={styles.modalTitleIcon}>
                  <SlidersHorizontal size={15} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={styles.modalTitle}>{t('discover.filters')}</Text>
              </View>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity onPress={resetFilters} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.modalResetText}>{t('discover.reset')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setFilterVisible(false)} activeOpacity={0.7}>
                  <X size={15} color={colors.textSecondary} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={styles.modalScroll}>
              <View style={styles.filterLabelRow}>
                <View style={styles.filterLabelIcon}>
                  <Gauge size={12} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={styles.filterLabel}>{t('discover.difficulty')}</Text>
              </View>
              <View style={styles.chipRow}>
                {([undefined, 'easy', 'medium', 'hard'] as const).map((d) => {
                  const active = draft.difficulty === d;
                  return (
                    <TouchableOpacity
                      key={d ?? 'any'}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setDraft((f) => ({ ...f, difficulty: d }))}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {d ? DIFF_LABEL[d] : t('discover.any')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.filterLabelRow}>
                <View style={styles.filterLabelIcon}>
                  <Clock size={12} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={styles.filterLabel}>{t('discover.maxCookTime')}</Text>
              </View>
              <View style={styles.chipRow}>
                {[undefined, ...TIME_OPTIONS].map((m) => {
                  const active = draft.maxTime === m;
                  return (
                    <TouchableOpacity
                      key={m ?? 'any'}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setDraft((f) => ({ ...f, maxTime: m }))}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {m ? `≤ ${m} min` : t('discover.any')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.filterLabelRow}>
                <View style={styles.filterLabelIcon}>
                  <Flame size={12} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={styles.filterLabel}>{t('discover.maxCalories')}</Text>
              </View>
              <View style={styles.chipRow}>
                {[undefined, ...CALORIE_OPTIONS].map((cal) => {
                  const active = draft.maxCalories === cal;
                  return (
                    <TouchableOpacity
                      key={cal ?? 'any'}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setDraft((f) => ({ ...f, maxCalories: cal }))}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {cal ? `≤ ${cal} kcal` : t('discover.any')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.filterLabelRow}>
                <View style={styles.filterLabelIcon}>
                  <Globe size={12} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={styles.filterLabel}>{t('discover.cuisine')}</Text>
              </View>
              <View style={styles.chipRow}>
                {[undefined, ...CUISINES].map((cu) => {
                  const active = draft.cuisine === cu;
                  return (
                    <TouchableOpacity
                      key={cu ?? 'any'}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setDraft((f) => ({ ...f, cuisine: cu }))}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {cu ?? t('discover.any')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.filterLabelRow}>
                <View style={styles.filterLabelIcon}>
                  <Star size={12} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={styles.filterLabel}>{t('discover.rating')}</Text>
              </View>
              <View style={styles.chipRow}>
                {[undefined, ...RATING_OPTIONS].map((r) => {
                  const active = draft.minRating === r;
                  return (
                    <TouchableOpacity
                      key={r ?? 'any'}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setDraft((f) => ({ ...f, minRating: r }))}
                      activeOpacity={0.75}
                    >
                      {r ? (
                        <View style={styles.chipInner}>
                          <Star size={13} color={active ? colors.textInverse : colors.warning} fill={active ? colors.textInverse : colors.warning} strokeWidth={0} />
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{r}+</Text>
                        </View>
                      ) : (
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{t('discover.any')}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters} activeOpacity={0.85}>
              <Check size={16} color={colors.textInverse} strokeWidth={2.5} />
              <Text style={styles.applyBtnText}>{t('discover.apply')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  filterBadge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: c.text, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 10, fontWeight: FontWeight.bold, color: c.background },

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

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text, flexShrink: 1 },
  countChip: { backgroundColor: c.primarySurface, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  countChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.primary },

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
  loadMoreBox: { alignItems: 'center', paddingVertical: Spacing.md },
  emptyBox:   { paddingHorizontal: Spacing.base, paddingVertical: Spacing.xl, alignItems: 'center', gap: Spacing.sm, width: '100%' },
  emptyText:  { fontSize: FontSize.base, color: c.textMuted },
  emptyLink:  { fontSize: FontSize.base, color: c.primary, fontWeight: FontWeight.semibold },

  recipesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.lg },
  gridCard: { width: CARD_W, backgroundColor: c.card, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  gridImageWrap: { position: 'relative' },
  gridImage: { width: '100%', height: CARD_W * 0.72 },
  aiBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: c.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  aiBadgeText: { fontSize: 9, fontWeight: FontWeight.bold, color: c.textInverse },
  diffBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  diffBadgeText: { fontSize: 9, fontWeight: FontWeight.semibold, color: '#fff', textTransform: 'capitalize' },
  gridInfo: { padding: Spacing.sm, gap: 4 },
  gridName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.text, minHeight: 36 },
  gridMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gridMeta: { fontSize: FontSize.xs, color: c.textMuted, marginRight: Spacing.xs },
  gridTag: { backgroundColor: c.primarySurface, alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  gridTagText: { fontSize: 10, color: c.primary, fontWeight: FontWeight.medium },

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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: c.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, paddingTop: Spacing.sm,
    ...Shadow.lg,
  },
  modalHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: c.border, marginBottom: Spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  modalTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modalTitleIcon: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: c.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
  modalHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  modalResetText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.primary },
  modalCloseBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: c.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  modalScroll: { maxHeight: height * 0.58 },
  filterLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.sm },
  filterLabelIcon: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: c.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  filterLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.sm + 1,
    borderRadius: BorderRadius.full, backgroundColor: c.surface,
    borderWidth: 1, borderColor: c.border,
  },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary, ...Shadow.sm },
  chipInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipText: { fontSize: FontSize.sm, color: c.textSecondary, fontWeight: FontWeight.medium },
  chipTextActive: { color: c.textInverse, fontWeight: FontWeight.semibold },
  applyBtn: {
    flexDirection: 'row', gap: 6, marginTop: Spacing.base,
    paddingVertical: Spacing.md + 2, borderRadius: BorderRadius.full,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },
  applyBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.textInverse },
});
