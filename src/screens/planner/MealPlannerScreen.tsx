import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  Sparkles, Coffee, Sun, Moon, Apple, Flame, Plus, X, Trash2, ChevronRight, Search,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Chip } from '../../components/ui/Chip';
import { getCurrentWeekDates, getTodayIndex } from '../../utils/date';
import {
  getWeekPlan, addMealItem, deleteMealItem, getWeekStart,
  MealItem, MealType,
} from '../../api/mealPlanner';
import { generateMealPlan } from '../../api/ai';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

const LOCATIONS = ['Azerbaijan', 'Turkey', 'Europe', 'Middle East', 'Asia', 'Americas', 'Mediterranean', 'International'];
const BUDGETS = [
  { key: 'budget',   labelKey: 'planner.budgetLabel',   descKey: 'planner.budgetAffordable' },
  { key: 'moderate', labelKey: 'planner.moderateLabel',  descKey: 'planner.budgetBalanced' },
  { key: 'premium',  labelKey: 'planner.premiumLabel',   descKey: 'planner.budgetPremium' },
] as const;

type AiStep = 'location' | 'budget' | 'calorie' | 'dietary' | 'generating';

export default function MealPlannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const weekDates  = getCurrentWeekDates();
  const todayIdx   = getTodayIndex();
  const weekStart  = getWeekStart();
  const { mealGoals, preferences, language } = useUserStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const MEAL_TYPES: { type: MealType; labelKey: string; Icon: any; bg: string; iconColor: string }[] = [
    { type: 'breakfast', labelKey: 'planner.breakfast', Icon: Coffee, bg: '#FEF3C7', iconColor: '#D97706' },
    { type: 'lunch',     labelKey: 'planner.lunch',     Icon: Sun,    bg: '#DBEAFE', iconColor: '#2563EB' },
    { type: 'dinner',    labelKey: 'planner.dinner',    Icon: Moon,   bg: '#F5F3FF', iconColor: '#7C3AED' },
    { type: 'snack',     labelKey: 'planner.snack',     Icon: Apple,  bg: '#FEE2E2', iconColor: '#DC2626' },
  ];

  const [selectedDay, setSelectedDay]   = useState(todayIdx);
  const [byDay,       setByDay]         = useState<Record<number, MealItem[]>>({});
  const [loading,     setLoading]       = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [addMealType,  setAddMealType]  = useState<MealType>('breakfast');
  const [mealTitle,    setMealTitle]    = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [saving,       setSaving]       = useState(false);

  const [mealDetailVisible, setMealDetailVisible] = useState(false);
  const [selectedMeal,      setSelectedMeal]      = useState<MealItem | null>(null);

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiStep,         setAiStep]         = useState<AiStep>('location');
  const [aiLocation,     setAiLocation]     = useState('');
  const [aiBudget,       setAiBudget]       = useState<'budget' | 'moderate' | 'premium'>('moderate');
  const [aiCalories,     setAiCalories]     = useState(String(mealGoals.calories));
  const [aiDietary,      setAiDietary]      = useState<string[]>(preferences.dietary ?? []);
  const [generating,     setGenerating]     = useState(false);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWeekPlan(weekStart);
      setByDay(res.data.by_day ?? {});
    } catch {
      setByDay({});
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const dayMeals = byDay[selectedDay] ?? [];
  const allItems = Object.values(byDay).flat();
  const totalCalories = allItems.reduce((s, m) => s + (m.calories ?? 0), 0);
  const goalCalories  = mealGoals.calories * 7;
  const pct = Math.min(Math.round((totalCalories / goalCalories) * 100), 100);

  async function handleAdd() {
    if (!mealTitle.trim()) { Alert.alert(t('errors.requiredTitle'), t('errors.enterMealName')); return; }
    setSaving(true);
    try {
      await addMealItem(weekStart, {
        recipe_title: mealTitle.trim(),
        meal_type:    addMealType,
        day_of_week:  selectedDay,
        calories:     mealCalories ? parseInt(mealCalories, 10) : undefined,
      });
      setModalVisible(false);
      setMealTitle('');
      setMealCalories('');
      await loadPlan();
    } catch (err: any) {
      Alert.alert(t('errors.title'), err?.message ?? t('errors.couldNotAddMeal'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(itemId: string) {
    try {
      await deleteMealItem(itemId);
      await loadPlan();
    } catch (err: any) {
      Alert.alert(t('errors.title'), err?.message ?? t('errors.couldNotRemoveMeal'));
    }
  }

  function openAdd(mealType: MealType) {
    setAddMealType(mealType);
    setMealTitle('');
    setMealCalories('');
    setModalVisible(true);
  }

  function openAiModal() {
    setAiStep('location');
    setAiLocation('');
    setAiBudget('moderate');
    setAiCalories(String(mealGoals.calories));
    setAiDietary(preferences.dietary ?? []);
    setAiModalVisible(true);
  }

  function openMealDetail(meal: MealItem) {
    setSelectedMeal(meal);
    setMealDetailVisible(true);
  }

  async function handleGeneratePlan() {
    setAiStep('generating');
    setGenerating(true);
    try {
      const calNum = parseInt(aiCalories, 10);
      await generateMealPlan({
        week_start:           weekStart,
        location:             aiLocation || 'International',
        budget:               aiBudget,
        calorie_goal:         isNaN(calNum) ? mealGoals.calories : calNum,
        dietary_preferences:  aiDietary,
        spice_level:          preferences.spiceLevel,
        cuisine_preference:   preferences.cuisines.join(', '),
        allergies:            preferences.allergies?.length ? preferences.allergies : undefined,
        disliked_ingredients: preferences.dislikedIngredients?.length ? preferences.dislikedIngredients : undefined,
        favorite_proteins:    preferences.favoriteProteins?.length ? preferences.favoriteProteins : undefined,
        meals_per_day:        preferences.mealFrequency ?? undefined,
        health_goal:          preferences.healthGoal && preferences.healthGoal !== 'No Goal' ? preferences.healthGoal : undefined,
        language,
        today_day_index:      todayIdx,
      } as any);
      setAiModalVisible(false);
      await loadPlan();
      Alert.alert(t('errors.doneTitle'), t('errors.mealPlanCreated'));
    } catch (err: any) {
      Alert.alert(t('errors.title'), err?.message ?? t('errors.couldNotGenerateMealPlan'));
      setAiStep('dietary');
    } finally {
      setGenerating(false);
    }
  }

  const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low Carb', 'High Protein', 'Healthy', 'Halal'];

  function toggleDietary(item: string) {
    setAiDietary((prev) => prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]);
  }

  const stepNum = aiStep === 'location' ? 1 : aiStep === 'budget' ? 2 : aiStep === 'calorie' ? 3 : 4;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title={t('planner.title')} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.dayRow}>
          {weekDates.map((d, i) => {
            const isToday    = i === todayIdx;
            const isSelected = i === selectedDay;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedDay(i)}
                activeOpacity={0.75}
                style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
              >
                <Text style={[styles.dayLetter, isSelected && styles.dayLetterActive]}>{d.day}</Text>
                <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>{d.date}</Text>
                {isToday && <View style={[styles.todayDot, isSelected && styles.todayDotActive]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.calorieCard}>
          <View style={styles.calorieHeader}>
            <View style={styles.calorieLeft}>
              <Flame size={18} color={colors.warning} strokeWidth={2} />
              <Text style={styles.calorieValue}>{totalCalories.toLocaleString()}</Text>
              <Text style={styles.calorieOf}>/ {goalCalories.toLocaleString()} kcal</Text>
            </View>
            <Text style={styles.caloriePercent}>{pct}%</Text>
          </View>
          <ProgressBar progress={pct} height={8} style={styles.calorieBar} />
          <Text style={styles.calorieGoalLabel}>{t('planner.weeklyGoal').toLowerCase()}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.mealsSection}>
            {MEAL_TYPES.map(({ type, labelKey, Icon, bg, iconColor }) => {
              const meal = dayMeals.find((m) => m.meal_type === type);
              return (
                <View key={type} style={styles.mealCard}>
                  <View style={[styles.mealIcon, { backgroundColor: bg }]}>
                    <Icon size={18} color={iconColor} strokeWidth={2} />
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealType}>{t(labelKey)}</Text>
                    {meal ? (
                      <TouchableOpacity onPress={() => openMealDetail(meal)} activeOpacity={0.7}>
                        <Text style={styles.mealName} numberOfLines={1}>{meal.recipe_title}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.mealEmpty}>{t('planner.noMeals')}</Text>
                    )}
                  </View>
                  {meal ? (
                    <>
                      {meal.calories ? <Text style={styles.mealCalories}>{meal.calories} kcal</Text> : null}
                      <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.7} onPress={() => handleDelete(meal.id)}>
                        <Trash2 size={14} color={colors.error} strokeWidth={2} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => openAdd(type)}>
                      <Plus size={16} color={colors.textInverse} strokeWidth={2.5} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Manual Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('planner.addMeal')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <X size={22} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>{t('planner.mealName')}</Text>
            <TextInput
              style={styles.modalInput}
              value={mealTitle}
              onChangeText={setMealTitle}
              placeholder="e.g. Grilled chicken salad"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <Text style={styles.inputLabel}>{t('planner.caloriesOptional')}</Text>
            <TextInput
              style={styles.modalInput}
              value={mealCalories}
              onChangeText={setMealCalories}
              placeholder="e.g. 450"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />
            <Text style={styles.inputLabel}>{t('planner.mealType')}</Text>
            <View style={styles.mealTypePicker}>
              {MEAL_TYPES.map(({ type, labelKey }) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.mealTypeChip, addMealType === type && styles.mealTypeChipActive]}
                  onPress={() => setAddMealType(type)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.mealTypeChipText, addMealType === type && styles.mealTypeChipTextActive]}>
                    {t(labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} activeOpacity={0.85} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.saveBtnText}>{t('planner.addMeal')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Meal Plan Modal */}
      <Modal visible={aiModalVisible} transparent animationType="slide" onRequestClose={() => !generating && setAiModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {aiStep === 'generating' ? (
              <View style={styles.generatingBox}>
                <View style={styles.generatingIcon}>
                  <Sparkles size={32} color={colors.textInverse} strokeWidth={2} />
                </View>
                <Text style={styles.generatingTitle}>{t('planner.generatingPlan')}</Text>
                <Text style={styles.generatingSubtitle}>{t('planner.generating')}</Text>
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: Spacing.md }} />
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{t('planner.aiMealPlan')}</Text>
                    <Text style={styles.aiStepLabel}>
                      {t('planner.step')} {stepNum} {t('planner.of')} 4
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setAiModalVisible(false)} activeOpacity={0.7}>
                    <X size={22} color={colors.textMuted} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {aiStep === 'location' && (
                  <View style={styles.aiStepContent}>
                    <Text style={styles.aiStepTitle}>{t('planner.location')}</Text>
                    <Text style={styles.aiStepSub}>{t('planner.locationDesc')}</Text>
                    <View style={styles.chipGrid}>
                      {LOCATIONS.map((loc) => (
                        <Chip key={loc} label={loc} selected={aiLocation === loc} onPress={() => setAiLocation(loc)} />
                      ))}
                    </View>
                    <TouchableOpacity style={styles.nextBtn} onPress={() => setAiStep('budget')} activeOpacity={0.85}>
                      <Text style={styles.nextBtnText}>{t('planner.next')}</Text>
                      <ChevronRight size={18} color={colors.textInverse} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                )}

                {aiStep === 'budget' && (
                  <View style={styles.aiStepContent}>
                    <Text style={styles.aiStepTitle}>{t('planner.budget')}</Text>
                    <Text style={styles.aiStepSub}>{t('planner.budgetDesc')}</Text>
                    <View style={styles.budgetOptions}>
                      {BUDGETS.map((b) => (
                        <TouchableOpacity
                          key={b.key}
                          style={[styles.budgetCard, aiBudget === b.key && styles.budgetCardActive]}
                          onPress={() => setAiBudget(b.key)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.budgetLabel, aiBudget === b.key && styles.budgetLabelActive]}>
                            {t(b.labelKey)}
                          </Text>
                          <Text style={[styles.budgetDesc, aiBudget === b.key && styles.budgetDescActive]}>
                            {t(b.descKey)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.navBtns}>
                      <TouchableOpacity style={styles.backBtn} onPress={() => setAiStep('location')} activeOpacity={0.8}>
                        <Text style={styles.backBtnText}>{t('planner.back')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.nextBtn} onPress={() => setAiStep('calorie')} activeOpacity={0.85}>
                        <Text style={styles.nextBtnText}>{t('planner.next')}</Text>
                        <ChevronRight size={18} color={colors.textInverse} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {aiStep === 'calorie' && (
                  <View style={styles.aiStepContent}>
                    <Text style={styles.aiStepTitle}>{t('planner.calorieGoal')}</Text>
                    <Text style={styles.aiStepSub}>{t('planner.calorieDesc')}</Text>
                    <TextInput
                      style={styles.calorieInput}
                      value={aiCalories}
                      onChangeText={setAiCalories}
                      keyboardType="number-pad"
                      placeholder="e.g. 2000"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.calorieUnit}>{t('planner.kcalPerDay')}</Text>
                    <View style={styles.caloriePresets}>
                      {[1500, 1800, 2000, 2200, 2500].map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.presetChip, aiCalories === String(c) && styles.presetChipActive]}
                          onPress={() => setAiCalories(String(c))}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.presetChipText, aiCalories === String(c) && styles.presetChipTextActive]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.navBtns}>
                      <TouchableOpacity style={styles.backBtn} onPress={() => setAiStep('budget')} activeOpacity={0.8}>
                        <Text style={styles.backBtnText}>{t('planner.back')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.nextBtn} onPress={() => setAiStep('dietary')} activeOpacity={0.85}>
                        <Text style={styles.nextBtnText}>{t('planner.next')}</Text>
                        <ChevronRight size={18} color={colors.textInverse} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {aiStep === 'dietary' && (
                  <View style={styles.aiStepContent}>
                    <Text style={styles.aiStepTitle}>{t('planner.dietary')}</Text>
                    <Text style={styles.aiStepSub}>{t('planner.dietaryDesc')}</Text>
                    <View style={styles.chipGrid}>
                      {DIETARY_OPTIONS.map((item) => (
                        <Chip key={item} label={item} selected={aiDietary.includes(item)} onPress={() => toggleDietary(item)} />
                      ))}
                    </View>
                    <View style={styles.navBtns}>
                      <TouchableOpacity style={styles.backBtn} onPress={() => setAiStep('calorie')} activeOpacity={0.8}>
                        <Text style={styles.backBtnText}>{t('planner.back')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.nextBtn, styles.generateBtn]} onPress={handleGeneratePlan} activeOpacity={0.85}>
                        <Sparkles size={16} color={colors.textInverse} strokeWidth={2.5} />
                        <Text style={styles.nextBtnText}>{t('planner.generate')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Meal Detail Modal */}
      <Modal visible={mealDetailVisible} transparent animationType="slide" onRequestClose={() => setMealDetailVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMealDetailVisible(false)}>
          <Pressable style={[styles.modalSheet, { gap: Spacing.lg }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>{selectedMeal?.recipe_title}</Text>
              <TouchableOpacity onPress={() => setMealDetailVisible(false)} activeOpacity={0.7}>
                <X size={22} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {selectedMeal?.calories ? (
              <Text style={styles.mealDetailCalories}>{selectedMeal.calories} kcal</Text>
            ) : null}
            <Text style={styles.mealDetailNote}>
              {selectedMeal?.recipe_id ? t('planner.hasRecipeNote') : t('planner.noRecipeNote')}
            </Text>
            {selectedMeal?.recipe_id ? (
              // Meal is linked to a ready recipe in the collection — open it
              <TouchableOpacity
                style={styles.saveBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setMealDetailVisible(false);
                  navigation.navigate('RecipeDetail', { recipeId: selectedMeal.recipe_id! });
                }}
              >
                <Search size={16} color={colors.textInverse} strokeWidth={2} />
                <Text style={styles.saveBtnText}>{t('planner.viewRecipe')}</Text>
              </TouchableOpacity>
            ) : (
              // No ready recipe for this meal — offer AI generation only
              <TouchableOpacity
                style={styles.saveBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setMealDetailVisible(false);
                  navigation.navigate('AIRecipe', { initialDescription: selectedMeal?.recipe_title });
                }}
              >
                <Sparkles size={16} color={colors.textInverse} strokeWidth={2} />
                <Text style={styles.saveBtnText}>{t('planner.generateWithAi')}</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addManualBtn} activeOpacity={0.85} onPress={() => openAdd('breakfast')}>
          <Plus size={16} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.addManualBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {t('planner.addMeal')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aiBannerBtn} activeOpacity={0.85} onPress={openAiModal}>
          <Sparkles size={16} color={colors.textInverse} strokeWidth={2.5} />
          <Text style={styles.aiBannerBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {t('planner.aiMealPlan')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll:    { paddingBottom: Spacing.base },

  dayRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.xs, marginBottom: Spacing.lg },
  dayBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, gap: 2 },
  dayBtnActive: { backgroundColor: c.primary },
  dayLetter:       { fontSize: FontSize.xs, color: c.textMuted, fontWeight: FontWeight.medium },
  dayLetterActive: { color: 'rgba(255,255,255,0.8)' },
  dayNum:          { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text },
  dayNumActive:    { color: c.textInverse },
  todayDot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: c.primary },
  todayDotActive:  { backgroundColor: c.textInverse },

  calorieCard: { marginHorizontal: Spacing.base, backgroundColor: c.card, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.lg, ...Shadow.sm },
  calorieHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  calorieLeft:    { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  calorieValue:   { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: c.text },
  calorieOf:      { fontSize: FontSize.sm, color: c.textSecondary },
  caloriePercent: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.primary },
  calorieBar:     { marginBottom: 4 },
  calorieGoalLabel: { fontSize: FontSize.xs, color: c.textMuted },

  loadingBox:   { paddingVertical: Spacing.xl, alignItems: 'center' },
  mealsSection: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  mealCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: c.card, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadow.sm },
  mealIcon:     { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  mealInfo:     { flex: 1 },
  mealType:     { fontSize: FontSize.xs, color: c.textMuted, fontWeight: FontWeight.medium, marginBottom: 2 },
  mealName:     { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text },
  mealEmpty:    { fontSize: FontSize.sm, color: c.textMuted, fontStyle: 'italic' },
  mealCalories: { fontSize: FontSize.sm, color: c.textSecondary, fontWeight: FontWeight.medium },
  addBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.base, gap: Spacing.md, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle:  { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.text },
  inputLabel:  { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.text },
  modalInput: { backgroundColor: c.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: FontSize.base, color: c.text, borderWidth: 1.5, borderColor: c.border },
  mealTypePicker:         { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  mealTypeChip:           { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.border },
  mealTypeChipActive:     { backgroundColor: c.primary, borderColor: c.primary },
  mealTypeChipText:       { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: c.textSecondary },
  mealTypeChipTextActive: { color: c.textInverse },
  saveBtn:           { backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingVertical: Spacing.base + 2, alignItems: 'center', marginTop: Spacing.sm, flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  saveBtnText:       { color: c.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  mealDetailCalories: { fontSize: FontSize.base, color: c.textSecondary, textAlign: 'center' },
  mealDetailNote: { fontSize: FontSize.xs, color: c.textMuted, textAlign: 'center', lineHeight: FontSize.xs * 1.5 },

  aiStepLabel: { fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 },
  aiStepContent: { gap: Spacing.md },
  aiStepTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
  aiStepSub:   { fontSize: FontSize.sm, color: c.textMuted, marginTop: -Spacing.xs },
  chipGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  budgetOptions: { gap: Spacing.sm },
  budgetCard: { padding: Spacing.base, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: c.border, backgroundColor: c.surface },
  budgetCardActive: { borderColor: c.primary, backgroundColor: c.primarySurface },
  budgetLabel:       { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text },
  budgetLabelActive: { color: c.primary },
  budgetDesc:        { fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },
  budgetDescActive:  { color: c.primary + 'BB' },
  calorieInput: { backgroundColor: c.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.text, borderWidth: 1.5, borderColor: c.border, textAlign: 'center' },
  calorieUnit:  { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', marginTop: -Spacing.sm },
  caloriePresets: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', flexWrap: 'wrap' },
  presetChip:         { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.border },
  presetChipActive:   { backgroundColor: c.primary, borderColor: c.primary },
  presetChipText:     { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: c.textSecondary },
  presetChipTextActive: { color: c.textInverse },
  navBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  backBtn: { flex: 1, paddingVertical: Spacing.base, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: c.border, alignItems: 'center' },
  backBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.textSecondary },
  nextBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingVertical: Spacing.base },
  nextBtnText: { color: c.textInverse, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  generateBtn: { backgroundColor: c.primary },

  generatingBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  generatingIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  generatingTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.text, textAlign: 'center' },
  generatingSubtitle: { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', lineHeight: FontSize.sm * 1.6, paddingHorizontal: Spacing.lg },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border, padding: Spacing.base, flexDirection: 'row', gap: Spacing.sm },
  addManualBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: BorderRadius.full, paddingVertical: Spacing.base, paddingHorizontal: Spacing.sm, borderWidth: 1.5, borderColor: c.primary },
  addManualBtnText: { color: c.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, flexShrink: 1 },
  aiBannerBtn: { flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingVertical: Spacing.base, paddingHorizontal: Spacing.sm },
  aiBannerBtnText: { color: c.textInverse, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, flexShrink: 1 },
});
