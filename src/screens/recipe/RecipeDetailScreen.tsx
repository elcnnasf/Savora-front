import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated, ActivityIndicator, Share,
} from 'react-native';
import { SafeImage } from '../../components/ui/SafeImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft, Bookmark, Share2, Star, Clock,
  Flame, Users, Minus, Plus, ShoppingCart, Check, Sparkles, FolderPlus, Info,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { RECIPES } from '../../data/mockData';
import { RootStackParamList, ApiRecipe, RecipeTranslation } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { saveRecipe, unsaveRecipe, getRecipeSavedStatus, fetchRecipeById, rateRecipe, getMyRating } from '../../api/recipes';
import { add as addShoppingItem, addBulk as addBulkItems } from '../../services/shoppingListOffline';
import { useRecentlyViewedStore } from '../../store/recentlyViewedStore';
import { useCookingProgressStore } from '../../store/cookingProgressStore';
import { scaleIngredientAmount } from '../../utils/scaleAmount';
import { AddToCollectionSheet } from '../../components/AddToCollectionSheet';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'RecipeDetail'>;

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 280;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';

interface DisplayRecipe {
  id: string;
  name: string;
  image: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  estimated_cost?: number;
  cookTime: number;
  prepTime: number;
  servings: number;
  ratingAvg: number | null;
  ratingCount: number;
  tags: string[];
  allergens?: string[];
  ingredients: { name: string; amount: string }[];
  steps: { step: number; instruction: string; duration?: number }[];
  tips?: string[];
  substitutions?: { ingredient: string; substitute: string; note?: string }[];
  storage?: string;
  isAI: boolean;
  isApi: boolean; // real DB recipe (ratable) vs bundled mock
  difficulty?: string;
  cuisine?: string;
}

function langKeyFromName(language: string): string {
  const map: Record<string, string> = {
    'English': 'en',
    'Azerbaijani': 'az',
    'Russian': 'ru',
    'Turkish': 'tr',
  };
  return map[language] ?? 'en';
}

function fromMock(r: typeof RECIPES[0], langKey: string): DisplayRecipe {
  const trans = r.translations?.[langKey];
  return {
    id: r.id,
    name: trans?.name ?? r.name,
    image: r.image,
    calories: r.calories, protein: r.protein, carbs: 0, fat: 0,
    cookTime: r.cookTime, prepTime: 0, servings: r.servings,
    ratingAvg: r.rating, ratingCount: 0, tags: r.tags,
    ingredients: trans?.ingredients ?? r.ingredients,
    steps: trans?.steps ?? r.steps,
    isAI: false,
    isApi: false,
  };
}

function fromApi(r: ApiRecipe, langKey: string): DisplayRecipe {
  const trans: RecipeTranslation | undefined = r.translations?.[langKey];
  return {
    id:             r.id,
    name:           trans?.title        ?? r.title,
    image:          r.image_url         || FALLBACK_IMAGE,
    description:    trans?.description  ?? r.description,
    calories:       r.calories          ?? 0,
    protein:        r.protein           ?? 0,
    carbs:          r.carbs             ?? 0,
    fat:            r.fat               ?? 0,
    fiber:          r.fiber             ?? undefined,
    sodium:         r.sodium            ?? undefined,
    estimated_cost: r.estimated_cost    ?? undefined,
    cookTime:       r.cook_time         ?? 0,
    prepTime:       r.prep_time         ?? 0,
    servings:       r.servings          ?? 2,
    ratingAvg:      r.rating_avg        ?? null,
    ratingCount:    r.rating_count      ?? 0,
    tags:           r.tags              ?? [],
    allergens:      r.allergens         ?? [],
    ingredients:    trans?.ingredients  ?? r.ingredients,
    steps: (trans?.steps ?? r.steps).map((s) => {
      // AI returns duration as string e.g. "10 min" — parse to number for timer compatibility
      const rawDur = s.duration;
      const durNum = typeof rawDur === 'string'
        ? parseInt(rawDur.replace(/[^0-9]/g, ''), 10) || undefined
        : rawDur ?? undefined;
      return { step: s.step, instruction: s.instruction, duration: durNum };
    }),
    tips:           trans?.tips          ?? [],
    substitutions:  trans?.substitutions ?? [],
    storage:        trans?.storage       ?? undefined,
    isAI:       r.is_ai_generated ?? false,
    isApi:      true,
    difficulty: r.difficulty,
    cuisine:    r.cuisine,
  };
}

function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase();
  const produce = ['spinach', 'tomato', 'avocado', 'lemon', 'lime', 'onion', 'garlic', 'cilantro', 'parsley', 'basil', 'broccoli', 'carrot', 'cucumber', 'pepper', 'lettuce', 'mushroom', 'zucchini', 'kale', 'potato', 'ginger', 'corn', 'peas', 'asparagus', 'eggplant', 'cabbage', 'banana', 'apple', 'orange'];
  const dairy   = ['cheese', 'cream', 'butter', 'yogurt', 'milk', 'egg', 'parmesan', 'feta', 'mozzarella', 'cheddar'];
  const meat    = ['chicken', 'beef', 'salmon', 'tuna', 'pork', 'turkey', 'shrimp', 'bacon', 'cod', 'fish', 'tofu', 'meat', 'lamb'];
  if (produce.some((k) => lower.includes(k))) return 'Produce';
  if (dairy.some((k) => lower.includes(k))) return 'Dairy & Eggs';
  if (meat.some((k) => lower.includes(k))) return 'Meat & Fish';
  return 'Pantry';
}

export default function RecipeDetailScreen() {
  const navigation  = useNavigation<Nav>();
  const route       = useRoute<Route>();
  const { isAuthenticated } = useAuthStore();
  const { language } = useUserStore();
  const addToRecentlyViewed = useRecentlyViewedStore((s) => s.addRecipe);
  const registerInProgress  = useCookingProgressStore((s) => s.registerInProgress);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const TABS = [t('recipe.ingredients'), t('recipe.steps'), t('recipe.nutritionFacts'), t('recipe.tips')] as const;
  type Tab = number;

  const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    'High Protein': { bg: colors.tagHighProtein,  text: colors.tagHighProteinText },
    Comfort:        { bg: colors.tagComfort,       text: colors.tagComfortText },
    Healthy:        { bg: colors.tagHealthy,       text: colors.tagHealthyText },
    Vegan:          { bg: colors.tagVegan,         text: colors.tagVeganText },
    Quick:          { bg: colors.tagQuick,         text: colors.tagQuickText },
  };

  const [activeTab, setActiveTab] = useState<Tab>(0);
  const [servings,  setServings]  = useState(2);
  const [saved,     setSaved]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [collectionSheet, setCollectionSheet] = useState(false);
  const [myRating,  setMyRating]  = useState<number | null>(null);
  const [ratingAgg, setRatingAgg] = useState<{ avg: number | null; count: number }>({ avg: null, count: 0 });

  const [toastMsg, setToastMsg] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const langKey = useMemo(() => langKeyFromName(language), [language]);

  // When only a DB recipeId is passed (e.g. from MatchedRecipes), fetch the recipe from the API
  const [fetchedRecipe, setFetchedRecipe] = useState<ApiRecipe | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  useEffect(() => {
    const id = route.params.recipeId;
    if (route.params.recipe || !id || RECIPES.some((r) => r.id === id)) return;
    setFetchFailed(false);
    fetchRecipeById(id, langKey)
      .then((res) => setFetchedRecipe(res.data))
      .catch(() => setFetchFailed(true));
  }, [route.params.recipe, route.params.recipeId, langKey]);

  // Recipes are generated with only en + the creator's language; when this recipe
  // lacks the app language, the backend translates it once on this fetch and the
  // content swaps in when ready (English shows meanwhile via the existing fallback)
  useEffect(() => {
    const base = route.params.recipe;
    // A title-only stub still needs the body translated — check steps, not presence
    if (!base || langKey === 'en' || base.translations?.[langKey]?.steps?.length) return;
    fetchRecipeById(base.id, langKey)
      .then((res) => setFetchedRecipe(res.data))
      .catch(() => {});
  }, [route.params.recipe?.id, langKey]);

  // A DB recipeId with nothing fetched yet — show a loader instead of flashing the wrong (mock) recipe
  const isFetchingById =
    !route.params.recipe &&
    !!route.params.recipeId &&
    !RECIPES.some((r) => r.id === route.params.recipeId) &&
    !fetchedRecipe;

  const recipe: DisplayRecipe = useMemo(() => {
    // Prefer the fetched copy when it's the same recipe — it may carry a
    // translation the route param doesn't have yet
    const currentId = route.params.recipe?.id ?? route.params.recipeId;
    if (fetchedRecipe && fetchedRecipe.id === currentId) return fromApi(fetchedRecipe, langKey);
    if (route.params.recipe) return fromApi(route.params.recipe, langKey);
    const mock = RECIPES.find((r) => r.id === route.params.recipeId) ?? RECIPES[0];
    return fromMock(mock, langKey);
  }, [route.params.recipe, route.params.recipeId, fetchedRecipe, langKey]);

  // #10 — when opened from an ingredient scan, flag recipe ingredients the user
  // doesn't have. Compare against the ENGLISH originals (index-parallel to the
  // localized display list) using the same substring logic the matcher uses.
  const missingFlags: boolean[] = useMemo(() => {
    const have = route.params.haveIngredients;
    if (!have || have.length === 0) return [];
    const currentId = route.params.recipe?.id ?? route.params.recipeId;
    const src: ApiRecipe | undefined =
      (fetchedRecipe && fetchedRecipe.id === currentId) ? fetchedRecipe
      : route.params.recipe ?? undefined;
    const englishNames: string[] = src
      ? (src.ingredients ?? []).map((x: any) => (x.name ?? '').toLowerCase().trim())
      : (RECIPES.find((r) => r.id === route.params.recipeId)?.ingredients ?? [])
          .map((x: any) => (x.name ?? '').toLowerCase().trim());
    const haveNorm = have.map((h) => h.toLowerCase().trim());
    return englishNames.map((ri) =>
      ri ? !haveNorm.some((ui) => ri.includes(ui) || ui.includes(ri)) : false,
    );
  }, [route.params.haveIngredients, route.params.recipe, route.params.recipeId, fetchedRecipe]);

  useEffect(() => {
    setServings(recipe.servings);
    setActiveTab(0);
  }, [recipe.id]);

  // Track recently viewed
  useEffect(() => {
    if (route.params.recipe) addToRecentlyViewed(route.params.recipe);
  }, [route.params.recipe?.id]);

  // The store persists the recipe snapshot — refresh it once the translated
  // copy arrives so Home's "recently viewed" isn't stuck in English
  useEffect(() => {
    if (fetchedRecipe && route.params.recipe && fetchedRecipe.id === route.params.recipe.id) {
      addToRecentlyViewed(fetchedRecipe);
    }
  }, [fetchedRecipe]);

  // Fetch saved status from backend for authenticated users
  useEffect(() => {
    if (!isAuthenticated || !recipe.isAI) return;
    getRecipeSavedStatus(recipe.id)
      .then((res) => setSaved(res.data.saved))
      .catch(() => {});
  }, [recipe.id, isAuthenticated]);

  // Rating: aggregates come with the recipe; the user's own stars need a fetch
  useEffect(() => {
    setRatingAgg({ avg: recipe.ratingAvg, count: recipe.ratingCount });
    setMyRating(null);
    if (!isAuthenticated || !recipe.isApi) return;
    getMyRating(recipe.id)
      .then((res) => setMyRating(res.data.rating))
      .catch(() => {});
  }, [recipe.id, isAuthenticated]);

  async function handleRate(star: number) {
    if (!isAuthenticated) { navigation.navigate('SignIn'); return; }
    const prev = myRating;
    setMyRating(star); // optimistic
    try {
      const res = await rateRecipe(recipe.id, star);
      setRatingAgg({ avg: res.data.rating_avg, count: res.data.rating_count });
    } catch {
      setMyRating(prev);
      showToast(t('recipe.couldNotRate'));
    }
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    toastOpacity.setValue(1);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }, 1800);
  }

  async function handleShare() {
    if (!recipe) return;
    const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
    const lines = [
      `🍽️ ${recipe.name}`,
      ...(recipe.description ? ['', recipe.description] : []),
      '',
      `⏱️ ${totalTime} ${t('recipe.min')}  ·  👥 ${recipe.servings} ${t('recipe.servings')}${recipe.calories ? `  ·  🔥 ${recipe.calories} kcal` : ''}`,
      '',
      `${t('recipe.ingredients')}:`,
      ...recipe.ingredients.map((i) => `• ${i.name}${i.amount ? ` — ${i.amount}` : ''}`),
      '',
      `${t('recipe.steps')}:`,
      ...recipe.steps.map((s) => `${s.step}. ${s.instruction}`),
      '',
      '🧡 Savora',
    ];
    try {
      await Share.share(
        { message: lines.join('\n'), title: recipe.name },
        { dialogTitle: t('recipe.shareRecipe') },
      );
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  }

  async function handleSaveToggle() {
    if (!isAuthenticated) { navigation.navigate('SignIn'); return; }
    if (saving) return;
    setSaving(true);
    try {
      if (saved) {
        await unsaveRecipe(recipe.id);
        setSaved(false);
        showToast(t('recipe.removedFromSaved'));
      } else {
        await saveRecipe(recipe.id);
        setSaved(true);
        showToast(t('recipe.savedToCollection'));
      }
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.includes('already')) {
        setSaved(true);
        showToast(t('recipe.alreadySaved'));
      } else {
        showToast(msg || t('recipe.couldNotSave'));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAddIngredient(name: string, amount?: string) {
    if (!isAuthenticated) {
      showToast(t('recipe.signInShoppingList'));
      return;
    }
    try {
      await addShoppingItem(name, amount, categorizeIngredient(name));
      showToast(`"${name}" ${t('recipe.addedToShoppingList')}`);
    } catch {
      showToast(t('recipe.couldNotAddIngredients'));
    }
  }

  async function handleAddAll() {
    if (!isAuthenticated) {
      showToast(t('recipe.signInShoppingList'));
      return;
    }
    try {
      const factor = recipe.servings > 0 ? servings / recipe.servings : 1;
      const items = recipe.ingredients.map((ing) => ({
        name:     ing.name,
        quantity: scaleIngredientAmount(ing.amount, factor),
        category: categorizeIngredient(ing.name),
      }));
      await addBulkItems(items);
      showToast(t('recipe.allIngredientsAdded'));
    } catch {
      showToast(t('recipe.couldNotAddIngredients'));
    }
  }

  const nutritionItems = [
    { label: t('recipe.calories'), value: String(recipe.calories), unit: 'kcal' },
    { label: t('recipe.protein'),  value: String(recipe.protein),  unit: 'g' },
    { label: t('recipe.carbs'),    value: String(recipe.carbs),    unit: 'g' },
    { label: t('recipe.fat'),      value: String(recipe.fat),      unit: 'g' },
    ...(recipe.fiber  != null ? [{ label: 'Fiber',  value: String(recipe.fiber),  unit: 'g' }]  : []),
    ...(recipe.sodium != null ? [{ label: 'Sodium', value: String(recipe.sodium), unit: 'mg' }] : []),
    { label: t('recipe.prepTime'), value: String(recipe.prepTime), unit: t('recipe.min') },
    { label: t('recipe.cookTime'), value: String(recipe.cookTime), unit: t('recipe.min') },
  ];

  // Ingredient amounts are stored for the recipe's base serving count; scale
  // them so the servings stepper actually changes the quantities.
  const baseServings = recipe.servings > 0 ? recipe.servings : 1;
  const scaleFactor  = servings / baseServings;

  const isIngredientsTab = activeTab === 0;
  const isStepsTab       = activeTab === 1;
  const isNutritionTab   = activeTab === 2;
  const isTipsTab        = activeTab === 3;

  if (isFetchingById) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', gap: Spacing.md }]}>
        {fetchFailed ? (
          <>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.base, textAlign: 'center', paddingHorizontal: Spacing.xl }}>
              {t('matchedRecipes.loadFailed')}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              style={{ backgroundColor: colors.primary, borderRadius: BorderRadius.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl }}
            >
              <Text style={{ color: colors.textInverse, fontWeight: FontWeight.semibold }}>{t('common.back')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ height: IMG_HEIGHT }}>
          <SafeImage
            uri={recipe.image || FALLBACK_IMAGE}
            style={styles.heroImage}
          />
          <View style={styles.imageOverlay} />

          <SafeAreaView style={styles.imageHeader} edges={['top']}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <ChevronLeft size={20} color="#111" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.circleBtn} onPress={handleShare} activeOpacity={0.8}>
                <Share2 size={18} color="#111" strokeWidth={2} />
              </TouchableOpacity>
              {recipe.isApi && (
                <TouchableOpacity
                  style={styles.circleBtn}
                  onPress={() => isAuthenticated ? setCollectionSheet(true) : navigation.navigate('SignIn')}
                  activeOpacity={0.8}
                >
                  <FolderPlus size={18} color="#111" strokeWidth={2} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.circleBtn} onPress={handleSaveToggle} activeOpacity={0.8} disabled={saving}>
                <Bookmark
                  size={18}
                  color={saved ? colors.primary : '#111'}
                  fill={saved ? colors.primary : 'none'}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={styles.imageTags}>
            {recipe.isAI && (
              <View style={[styles.imageTag, { backgroundColor: colors.primary }]}>
                <Sparkles size={10} color="#fff" strokeWidth={2.5} />
                <Text style={[styles.imageTagText, { color: '#fff' }]}>{t('recipe.aiGenerated')}</Text>
              </View>
            )}
            {recipe.tags.slice(0, 2).map((tag) => {
              const c = TAG_COLORS[tag] ?? { bg: colors.primarySurface, text: colors.primary };
              return (
                <View key={tag} style={[styles.imageTag, { backgroundColor: c.bg }]}>
                  <Text style={[styles.imageTagText, { color: c.text }]}>{tag}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.name}</Text>
            {(() => {
              // Derive straight from the current recipe so it survives the AZ
              // re-fetch (translated recipe keeps the same id, so ratingAgg's
              // effect wouldn't re-run and the badge went blank).
              const displayAvg   = ratingAgg.avg ?? recipe.ratingAvg;
              const displayCount = ratingAgg.count || recipe.ratingCount;
              if (displayAvg == null && recipe.isApi) return null;
              return (
                <View style={styles.ratingBadge}>
                  <Star size={13} color={colors.warning} fill={colors.warning} strokeWidth={0} />
                  <Text style={styles.ratingText}>
                    {(displayAvg ?? 0).toFixed(1)}
                    {recipe.isApi && displayCount > 0 ? ` (${displayCount})` : ''}
                  </Text>
                </View>
              );
            })()}
          </View>

          {recipe.description ? (
            <Text style={styles.description}>{recipe.description}</Text>
          ) : null}

          {recipe.isAI && (
            <View style={styles.aiDisclaimer}>
              <Info size={14} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.aiDisclaimerText}>{t('recipe.aiDisclaimer')}</Text>
            </View>
          )}

          {recipe.cuisine || recipe.difficulty ? (
            <View style={styles.metaRow}>
              {recipe.cuisine ? <Text style={styles.metaChip}>{recipe.cuisine}</Text> : null}
              {recipe.difficulty ? <Text style={[styles.metaChip, styles.metaChipDiff]}>{recipe.difficulty}</Text> : null}
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Flame size={16} color={colors.textSecondary} strokeWidth={2} />
              <View>
                <Text style={styles.statValue}>{recipe.calories}</Text>
                <Text style={styles.statLabel}>{t('recipe.calories')}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <View>
                <Text style={styles.statValue}>{recipe.protein}g</Text>
                <Text style={styles.statLabel}>{t('recipe.protein')}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Clock size={16} color={colors.textSecondary} strokeWidth={2} />
              <View>
                <Text style={styles.statValue}>{recipe.cookTime} {t('recipe.min')}</Text>
                <Text style={styles.statLabel}>{t('recipe.cookTime')}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Users size={16} color={colors.textSecondary} strokeWidth={2} />
              <View>
                <Text style={styles.statValue}>{recipe.servings}</Text>
                <Text style={styles.statLabel}>{t('recipe.servings')}</Text>
              </View>
            </View>
          </View>

          {recipe.isApi && (
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>{t('recipe.rateThis')}</Text>
              <View style={styles.rateStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => handleRate(star)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}>
                    <Star
                      size={26}
                      color={colors.warning}
                      fill={myRating != null && star <= myRating ? colors.warning : 'none'}
                      strokeWidth={1.5}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              {TABS.map((tab, tabIdx) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tabIdx)}
                  activeOpacity={0.75}
                  style={[styles.tabPill, activeTab === tabIdx && styles.tabPillActive]}
                >
                  <Text style={[styles.tabText, activeTab === tabIdx && styles.tabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {isIngredientsTab && (
            <View style={styles.section}>
              <View style={styles.servingsRow}>
                <Text style={styles.ingredientCount}>{recipe.ingredients.length} {t('recipe.ingredients').toLowerCase()}</Text>
                <View style={styles.servingsStepper}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => setServings((s) => Math.max(1, s - 1))} activeOpacity={0.7}>
                    <Minus size={14} color={servings <= 1 ? colors.textMuted : colors.text} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <Text style={styles.servingsValue}>{servings}</Text>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => setServings((s) => Math.min(10, s + 1))} activeOpacity={0.7}>
                    <Plus size={14} color={colors.text} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>

              {recipe.ingredients.map((ing, i) => {
                const scaledAmount = scaleIngredientAmount(ing.amount, scaleFactor);
                const missing = missingFlags[i] ?? false;
                return (
                <View key={i} style={styles.ingredientRow}>
                  <View style={[styles.ingredientDot, missing && styles.ingredientDotMissing]} />
                  <Text style={[styles.ingredientName, missing && styles.ingredientNameMissing]} numberOfLines={1}>
                    {ing.name}{missing ? ` · ${t('recipe.missing')}` : ''}
                  </Text>
                  <Text style={styles.ingredientAmount} numberOfLines={1}>{scaledAmount}</Text>
                  <TouchableOpacity
                    style={styles.addIngBtn}
                    onPress={() => handleAddIngredient(ing.name, scaledAmount)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Plus size={13} color={colors.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
                );
              })}

              <TouchableOpacity
                style={styles.addAllBtn}
                onPress={handleAddAll}
                activeOpacity={0.85}
              >
                <ShoppingCart size={15} color={colors.primary} strokeWidth={2} />
                <Text style={styles.addAllBtnText}>{t('recipe.addAllToShoppingList')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {isStepsTab && (
            <View style={styles.section}>
              <Text style={styles.stepsCount}>{recipe.steps.length} {t('recipe.steps').toLowerCase()}</Text>
              {recipe.steps.map((step) => (
                <View key={step.step} style={styles.stepCard}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.step}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepText}>{step.instruction}</Text>
                    {step.duration ? (
                      <View style={styles.stepDuration}>
                        <Clock size={12} color={colors.textMuted} strokeWidth={2} />
                        <Text style={styles.stepDurationText}>{step.duration} {t('recipe.min')}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          {isNutritionTab && (
            <View style={styles.section}>
              <View style={styles.nutritionGrid}>
                {nutritionItems.map((item) => (
                  <View key={item.label} style={styles.nutritionCard}>
                    <Text style={styles.nutritionValue}>{item.value}</Text>
                    <Text style={styles.nutritionUnit}>{item.unit}</Text>
                    <Text style={styles.nutritionLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.nutritionNote}>* {t('recipe.perServing')} · {t('recipe.valuesEstimated')}</Text>
            </View>
          )}

          {isTipsTab && (
            <View style={styles.section}>
              {/* AI-generated tips */}
              {(recipe.tips && recipe.tips.length > 0 ? recipe.tips : [
                recipe.cuisine
                  ? t('recipe.tipCuisine').replace('{cuisine}', recipe.cuisine)
                  : t('recipe.tipTaste'),
                t('recipe.tipPrep'),
                recipe.difficulty === 'easy' ? t('recipe.tipEasy') : t('recipe.tipSlow'),
              ]).map((tip, i) => (
                <View key={`tip-${i}`} style={styles.tipCard}>
                  <View style={styles.tipIcon}>
                    <Text style={styles.tipIconText}>💡</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}

              {/* Substitutions */}
              {recipe.substitutions && recipe.substitutions.length > 0 && (
                <>
                  <Text style={styles.tipsSubHeader}>{t('recipe.substitutions')}</Text>
                  {recipe.substitutions.map((sub, i) => (
                    <View key={`sub-${i}`} style={styles.subCard}>
                      <View style={styles.subRow}>
                        <Text style={styles.subFrom}>{sub.ingredient}</Text>
                        <Text style={styles.subArrow}>→</Text>
                        <Text style={styles.subTo}>{sub.substitute}</Text>
                      </View>
                      {sub.note ? <Text style={styles.subNote}>{sub.note}</Text> : null}
                    </View>
                  ))}
                </>
              )}

              {/* Storage */}
              {recipe.storage ? (
                <>
                  <Text style={styles.tipsSubHeader}>{t('recipe.storage')}</Text>
                  <View style={styles.storageCard}>
                    <Text style={styles.tipIconText}>🧊</Text>
                    <Text style={styles.tipText}>{recipe.storage}</Text>
                  </View>
                </>
              ) : null}

              {/* Allergens */}
              {recipe.allergens && recipe.allergens.length > 0 && (
                <>
                  <Text style={styles.tipsSubHeader}>{t('recipe.allergens')}</Text>
                  <View style={styles.allergensRow}>
                    {recipe.allergens.map((a) => (
                      <View key={a} style={styles.allergenChip}>
                        <Text style={styles.allergenText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cookBtn}
          activeOpacity={0.85}
          onPress={() => {
            // snapshot the recipe so "Continue where you left off" can show it
            // even after it drops off the recently-viewed list
            registerInProgress({
              id: recipe.id,
              title: recipe.name,
              image_url: recipe.image,
              cook_time: recipe.cookTime,
            });
            navigation.navigate('CookingMode', {
              recipeId:   recipe.id,
              recipeName: recipe.name,
              steps:      recipe.steps,
            });
          }}
        >
          <Text style={styles.cookBtnText}>{t('recipe.startCooking')}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Check size={14} color="#fff" strokeWidth={2.5} />
        <Text style={styles.toastText} numberOfLines={1}>{toastMsg}</Text>
      </Animated.View>

      <AddToCollectionSheet
        visible={collectionSheet}
        recipeId={recipe.id}
        onClose={() => setCollectionSheet(false)}
        onChanged={() => { setSaved(true); showToast(t('saved.addedToCollection')); }}
      />
    </View>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: c.background },
  heroImage:    { width, height: IMG_HEIGHT },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  imageHeader:  {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
  },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
  },
  imageActions: { flexDirection: 'row', gap: Spacing.sm },
  imageTags:    {
    position: 'absolute', bottom: Spacing.md, left: Spacing.base,
    flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap',
  },
  imageTag:     { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full, flexDirection: 'row', alignItems: 'center', gap: 4 },
  imageTagText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  content:      { padding: Spacing.base },
  titleRow:     {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  title:        {
    flex: 1, fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold,
    color: c.text, lineHeight: FontSize.xxl * 1.2,
  },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0,
    backgroundColor: c.tagQuick, paddingHorizontal: Spacing.sm,
    paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  ratingText:   { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.tagQuickText },
  description:  { fontSize: FontSize.base, color: c.textSecondary, lineHeight: FontSize.base * 1.5, marginBottom: Spacing.sm },
  aiDisclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: c.surface, borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: c.borderLight,
  },
  aiDisclaimerText: { flex: 1, fontSize: FontSize.xs, color: c.textMuted, lineHeight: FontSize.xs * 1.5 },
  metaRow:      { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  metaChip:     {
    fontSize: FontSize.xs, fontWeight: FontWeight.semibold,
    color: c.primary, backgroundColor: c.primarySurface,
    paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full,
    textTransform: 'capitalize',
  },
  metaChipDiff: { color: c.textSecondary, backgroundColor: c.surface },
  statsRow:     {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.base,
  },
  stat:         { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, justifyContent: 'center' },
  statDivider:  { width: 1, height: 30, backgroundColor: c.border },
  statValue:    { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.text, textAlign: 'center' },
  statLabel:    { fontSize: FontSize.xs, color: c.textMuted, textAlign: 'center' },
  rateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: c.surface, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderWidth: 1, borderColor: c.border, marginBottom: Spacing.base,
  },
  rateLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.textSecondary, flexShrink: 1, marginRight: Spacing.sm },
  rateStars: { flexDirection: 'row', gap: 4 },
  tabsContainer: { marginBottom: Spacing.base },
  tabs:          { gap: Spacing.sm },
  tabPill:       {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: c.surface,
    borderWidth: 1.5, borderColor: c.border,
  },
  tabPillActive: { backgroundColor: c.primary, borderColor: c.primary },
  tabText:       { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: c.textSecondary },
  tabTextActive: { color: c.textInverse },
  section:       { gap: Spacing.sm },
  stepsCount:    { fontSize: FontSize.sm, color: c.textSecondary, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  servingsRow:   {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ingredientCount: { fontSize: FontSize.sm, color: c.textSecondary, fontWeight: FontWeight.medium },
  servingsStepper: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: c.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  stepperBtn:    {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: c.background, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center',
  },
  servingsValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text, minWidth: 20, textAlign: 'center' },
  ingredientRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm + 1, borderBottomWidth: 1, borderBottomColor: c.borderLight,
  },
  ingredientDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary, flexShrink: 0 },
  ingredientDotMissing:  { backgroundColor: c.error },
  ingredientName:   { flex: 1, fontSize: FontSize.base, color: c.text },
  ingredientNameMissing: { color: c.error },
  ingredientAmount: { fontSize: FontSize.sm, color: c.textSecondary, fontWeight: FontWeight.medium, flexShrink: 0 },
  addIngBtn: {
    width: 28, height: 28, borderRadius: 14, flexShrink: 0,
    backgroundColor: c.primarySurface, borderWidth: 1, borderColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  addAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm, paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: c.primary,
    backgroundColor: c.primarySurface,
  },
  addAllBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.primary },
  stepCard:      {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: c.surface, borderRadius: BorderRadius.lg, padding: Spacing.md,
  },
  stepNumber:    {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumberText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.textInverse },
  stepContent:   { flex: 1, gap: Spacing.xs },
  stepText:      { fontSize: FontSize.base, color: c.text, lineHeight: FontSize.base * 1.6 },
  stepDuration:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepDurationText: { fontSize: FontSize.xs, color: c.textMuted },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  nutritionCard: {
    flex: 1, minWidth: '30%', backgroundColor: c.surface,
    borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: 2,
  },
  nutritionValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: c.text },
  nutritionUnit:  { fontSize: FontSize.xs, color: c.textMuted },
  nutritionLabel: { fontSize: FontSize.xs, color: c.textSecondary, fontWeight: FontWeight.medium },
  nutritionNote:  { fontSize: FontSize.xs, color: c.textMuted, marginTop: Spacing.sm },
  tipCard:       {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.lg, padding: Spacing.md,
    alignItems: 'flex-start',
  },
  tipIcon:       { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipIconText:   { fontSize: 18 },
  tipText:       { flex: 1, fontSize: FontSize.base, color: c.text, lineHeight: FontSize.base * 1.5 },
  tipsSubHeader: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.sm,
  },
  subCard: {
    backgroundColor: c.surface, borderRadius: BorderRadius.lg, padding: Spacing.md,
    gap: 4, borderLeftWidth: 3, borderLeftColor: c.primary,
  },
  subRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  subFrom: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text },
  subArrow: { fontSize: FontSize.base, color: c.textMuted },
  subTo:   { fontSize: FontSize.base, color: c.primary, fontWeight: FontWeight.semibold, flex: 1 },
  subNote: { fontSize: FontSize.sm, color: c.textSecondary, fontStyle: 'italic' },
  storageCard: {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: c.surface, borderRadius: BorderRadius.lg, padding: Spacing.md,
    alignItems: 'flex-start',
  },
  allergensRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  allergenChip:  {
    backgroundColor: '#FEF3C7', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1, borderColor: '#F59E0B',
  },
  allergenText:  { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: '#92400E' },
  bottomBar:     {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.md,
  },
  cookBtn:       {
    backgroundColor: c.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base + 2, alignItems: 'center',
  },
  cookBtnText:   { color: c.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  toast:         {
    position: 'absolute', bottom: 100, left: Spacing.xl, right: Spacing.xl,
    backgroundColor: c.text, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm + 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    ...Shadow.md,
  },
  toastText:     {
    fontSize: FontSize.sm, color: c.textInverse, fontWeight: FontWeight.medium,
    flex: 1, textAlign: 'center',
  },
});
