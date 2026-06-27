import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated,
} from 'react-native';
import { SafeImage } from '../../components/ui/SafeImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft, Bookmark, Share2, Star, Clock,
  Flame, Users, Minus, Plus, ShoppingCart, Check, Sparkles,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { RECIPES } from '../../data/mockData';
import { RootStackParamList, ApiRecipe } from '../../navigation/types';
import { useShoppingListStore } from '../../store/shoppingListStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { saveRecipe, unsaveRecipe } from '../../api/recipes';

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
  cookTime: number;
  prepTime: number;
  servings: number;
  rating: number;
  tags: string[];
  ingredients: { name: string; amount: string }[];
  steps: { step: number; instruction: string; duration?: number }[];
  isAI: boolean;
  difficulty?: string;
  cuisine?: string;
}

function fromMock(r: typeof RECIPES[0]): DisplayRecipe {
  return {
    id: r.id, name: r.name, image: r.image,
    calories: r.calories, protein: r.protein, carbs: 0, fat: 0,
    cookTime: r.cookTime, prepTime: 0, servings: r.servings,
    rating: r.rating, tags: r.tags,
    ingredients: r.ingredients, steps: r.steps, isAI: false,
  };
}

function fromApi(r: ApiRecipe): DisplayRecipe {
  return {
    id: r.id, name: r.title,
    image: r.image_url || FALLBACK_IMAGE,
    description: r.description,
    calories:  r.calories  ?? 0,
    protein:   r.protein   ?? 0,
    carbs:     r.carbs     ?? 0,
    fat:       r.fat       ?? 0,
    cookTime:  r.cook_time ?? 0,
    prepTime:  r.prep_time ?? 0,
    servings:  r.servings  ?? 2,
    rating: 5.0,
    tags: r.tags ?? [],
    ingredients: r.ingredients,
    steps: r.steps,
    isAI: true,
    difficulty: r.difficulty,
    cuisine: r.cuisine,
  };
}

export default function RecipeDetailScreen() {
  const navigation  = useNavigation<Nav>();
  const route       = useRoute<Route>();
  const addIngredient = useShoppingListStore((s) => s.addIngredient);
  const { isAuthenticated } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const TABS = [t('recipe.ingredients'), t('recipe.steps'), t('recipe.nutritionFacts'), 'Tips'] as const;
  type Tab = string;

  const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    'High Protein': { bg: colors.tagHighProtein,  text: colors.tagHighProteinText },
    Comfort:        { bg: colors.tagComfort,       text: colors.tagComfortText },
    Healthy:        { bg: colors.tagHealthy,       text: colors.tagHealthyText },
    Vegan:          { bg: colors.tagVegan,         text: colors.tagVeganText },
    Quick:          { bg: colors.tagQuick,         text: colors.tagQuickText },
  };

  const [activeTab, setActiveTab] = useState<Tab>(TABS[0]);
  const [servings,  setServings]  = useState(2);
  const [saved,     setSaved]     = useState(false);
  const [saving,    setSaving]    = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer   = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const recipe: DisplayRecipe = (() => {
    if (route.params.recipe) return fromApi(route.params.recipe);
    const mock = RECIPES.find((r) => r.id === route.params.recipeId) ?? RECIPES[0];
    return fromMock(mock);
  })();

  useEffect(() => { setServings(recipe.servings); setActiveTab(TABS[0]); }, [recipe.id]);

  function showToast(msg: string) {
    setToastMsg(msg);
    toastOpacity.setValue(1);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }, 1800);
  }

  async function handleSaveToggle() {
    if (!isAuthenticated) { navigation.navigate('SignIn'); return; }
    if (saving) return;
    setSaving(true);
    try {
      if (saved) {
        await unsaveRecipe(recipe.id);
        setSaved(false);
        showToast('Removed from saved');
      } else {
        await saveRecipe(recipe.id);
        setSaved(true);
        showToast('Saved to your collection');
      }
    } catch (err: any) {
      showToast(err?.message ?? 'Could not save recipe');
    } finally {
      setSaving(false);
    }
  }

  function handleAddIngredient(name: string) {
    const added = addIngredient(name);
    showToast(added ? `"${name}" added to shopping list` : `"${name}" already in list`);
  }

  const nutritionItems = [
    { label: t('recipe.calories'), value: String(recipe.calories), unit: 'kcal' },
    { label: t('recipe.protein'),  value: String(recipe.protein),  unit: 'g' },
    { label: t('recipe.carbs'),    value: String(recipe.carbs),    unit: 'g' },
    { label: t('recipe.fat'),      value: String(recipe.fat),      unit: 'g' },
    { label: t('recipe.prepTime'), value: String(recipe.prepTime), unit: t('recipe.min') },
    { label: t('recipe.cookTime'), value: String(recipe.cookTime), unit: t('recipe.min') },
  ];

  const isIngredientsTab = activeTab === TABS[0];
  const isStepsTab       = activeTab === TABS[1];
  const isNutritionTab   = activeTab === TABS[2];
  const isTipsTab        = activeTab === TABS[3];

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
              <TouchableOpacity style={styles.circleBtn} activeOpacity={0.8}>
                <Share2 size={18} color="#111" strokeWidth={2} />
              </TouchableOpacity>
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
            <View style={styles.ratingBadge}>
              <Star size={13} color={colors.warning} fill={colors.warning} strokeWidth={0} />
              <Text style={styles.ratingText}>{recipe.rating.toFixed(1)}</Text>
            </View>
          </View>

          {recipe.description ? (
            <Text style={styles.description}>{recipe.description}</Text>
          ) : null}

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

          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.75}
                  style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
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

              {recipe.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <View style={styles.ingredientDot} />
                  <Text style={styles.ingredientName} numberOfLines={1}>{ing.name}</Text>
                  <Text style={styles.ingredientAmount} numberOfLines={1}>{ing.amount}</Text>
                  <TouchableOpacity
                    style={styles.addIngBtn}
                    onPress={() => handleAddIngredient(ing.name)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Plus size={13} color={colors.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addAllBtn}
                onPress={() => {
                  recipe.ingredients.forEach((ing) => addIngredient(ing.name));
                  showToast('All ingredients added to shopping list');
                }}
                activeOpacity={0.85}
              >
                <ShoppingCart size={15} color={colors.primary} strokeWidth={2} />
                <Text style={styles.addAllBtnText}>Add all to Shopping List</Text>
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
              <Text style={styles.nutritionNote}>* {t('recipe.perServing')} · Values are estimated</Text>
            </View>
          )}

          {isTipsTab && (
            <View style={styles.section}>
              {[
                recipe.cuisine
                  ? `This is a ${recipe.cuisine} dish — try serving it with traditional sides for an authentic experience.`
                  : 'Taste as you cook and adjust seasoning to your preference.',
                `This recipe makes ${recipe.servings} servings. Scale ingredients proportionally for more or fewer portions.`,
                recipe.difficulty === 'easy'
                  ? "This is a beginner-friendly recipe. Follow each step carefully and you'll get great results."
                  : 'Take your time with each step — rushing leads to uneven cooking.',
                'Prep all ingredients before you start cooking (mise en place) for a smoother experience.',
                'Let meat rest for a few minutes after cooking to retain its juices.',
              ].map((tip, i) => (
                <View key={i} style={styles.tipCard}>
                  <View style={styles.tipIcon}>
                    <Text style={styles.tipIconText}>💡</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cookBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CookingMode', {
            recipeId:   recipe.id,
            recipeName: recipe.name,
            steps:      recipe.steps,
          })}
        >
          <Text style={styles.cookBtnText}>{t('recipe.startCooking')}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Check size={14} color="#fff" strokeWidth={2.5} />
        <Text style={styles.toastText} numberOfLines={1}>{toastMsg}</Text>
      </Animated.View>
    </View>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: c.background },
  heroImage:    { width, height: IMG_HEIGHT },
  imageOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.18)' },
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
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.tagQuick, paddingHorizontal: Spacing.sm,
    paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  ratingText:   { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.tagQuickText },
  description:  { fontSize: FontSize.base, color: c.textSecondary, lineHeight: FontSize.base * 1.5, marginBottom: Spacing.sm },
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
  ingredientName:   { flex: 1, fontSize: FontSize.base, color: c.text },
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
