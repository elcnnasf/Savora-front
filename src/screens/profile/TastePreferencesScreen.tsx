import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  X, Plus, Info, ChevronLeft, ChevronRight, Check,
  Salad, ShieldAlert, Globe2, Flame, ChefHat, Users,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { useTranslation } from '../../hooks/useTranslation';

const DIETARY       = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low Carb', 'High Protein', 'Healthy', 'Paleo', 'Halal', 'Kosher', 'Sugar-Free'];
const HEALTH_GOALS  = ['Lose Weight', 'Maintain Weight', 'Gain Muscle', 'Eat Healthier', 'No Goal'];
const CUISINES      = ['Italian', 'Asian', 'Mexican', 'Mediterranean', 'American', 'Indian', 'Japanese', 'Middle Eastern', 'Thai', 'French', 'Chinese', 'Turkish', 'Azerbaijani', 'Greek'];
const PROTEINS      = ['Chicken', 'Beef', 'Lamb', 'Fish', 'Seafood', 'Eggs', 'Legumes', 'Tofu'];
const SPICE         = ['No Spice', 'Mild', 'Medium', 'Hot', 'Very Hot'];
const MAX_CALORIES  = [0, 400, 600, 800];
const ALLERGIES     = ['Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Eggs', 'Soy', 'Wheat / Gluten', 'Milk / Dairy', 'Sesame', 'Mustard'];
const COOKING_SKILLS = ['Beginner', 'Home Cook', 'Intermediate', 'Advanced', 'Chef Level'];
const PREP_TIMES    = ['Quick (<15 min)', '15-30 min', '30-60 min', 'Long (60+ min)', 'No Preference'];
const BUDGETS       = ['Budget-Friendly', 'Moderate', 'Premium'];
const MEAL_FREQ     = [2, 3, 4, 5, 6];
const SERVING_SIZES = [1, 2, 3, 4, 6, 8];

const TOTAL_STEPS = 6;

export default function TastePreferencesScreen() {
  const navigation = useNavigation();
  const { preferences, setPreferences } = useUserStore();
  const { t, raw } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const dietaryLabels      = raw<Record<string, string>>('taste.options.dietary');
  const goalLabels         = raw<Record<string, string>>('taste.options.healthGoals');
  const cuisineLabels      = raw<Record<string, string>>('taste.options.cuisines');
  const proteinLabels      = raw<Record<string, string>>('taste.options.proteins');
  const spiceLabels        = raw<Record<string, string>>('taste.options.spice');
  const allergyLabels      = raw<Record<string, string>>('taste.options.allergies');
  const cookingSkillLabels = raw<Record<string, string>>('taste.options.cookingSkills');
  const prepTimeLabels     = raw<Record<string, string>>('taste.options.prepTimes');
  const budgetLabels       = raw<Record<string, string>>('taste.options.budgets');

  const [step, setStep] = useState(0);

  const [dietary,   setDietary]   = useState<string[]>(preferences.dietary ?? []);
  const [goal,      setGoal]      = useState(preferences.healthGoal ?? 'No Goal');
  const [cuisines,  setCuisines]  = useState<string[]>(preferences.cuisines ?? []);
  const [proteins,  setProteins]  = useState<string[]>(preferences.favoriteProteins ?? []);
  const [spice,     setSpice]     = useState(preferences.spiceLevel ?? 'Medium');
  const [maxCal,    setMaxCal]    = useState(preferences.maxCaloriesPerMeal ?? 0);
  const [allergies, setAllergies] = useState<string[]>(preferences.allergies ?? []);
  const [skill,     setSkill]     = useState(preferences.cookingSkill ?? 'Home Cook');
  const [prepTime,  setPrepTime]  = useState(preferences.prepTimePreference ?? '15-30 min');
  const [budget,    setBudget]    = useState(preferences.budget ?? 'Moderate');
  const [disliked,  setDisliked]  = useState<string[]>([...new Set(preferences.dislikedIngredients ?? [])]);
  const [mealFreq,  setMealFreq]  = useState(preferences.mealFrequency ?? 3);
  const [serving,   setServing]   = useState(preferences.servingSize ?? 2);
  const [newDisliked, setNewDisliked] = useState('');

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function addDisliked() {
    const trimmed = newDisliked.trim();
    if (!trimmed) return;
    if (disliked.includes(trimmed)) {
      Alert.alert(t('taste.alreadyAdded'), `"${trimmed}" ${t('taste.alreadyInListSuffix')}`);
      return;
    }
    setDisliked([...disliked, trimmed]);
    setNewDisliked('');
  }

  function removeDisliked(item: string) {
    setDisliked(disliked.filter((d) => d !== item));
  }

  function save() {
    setPreferences({
      dietary, cuisines, spiceLevel: spice, allergies,
      cookingSkill: skill, prepTimePreference: prepTime, budget,
      dislikedIngredients: disliked, mealFrequency: mealFreq, servingSize: serving,
      healthGoal: goal, favoriteProteins: proteins, maxCaloriesPerMeal: maxCal,
    });
    navigation.goBack();
  }

  function goNext() {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else save();
  }

  function goBack() {
    if (step > 0) setStep(step - 1);
    else navigation.goBack();
  }

  const maxCalLabel = (n: number) => (n === 0 ? t('taste.noLimit') : `≤ ${n} kcal`);

  const STEPS = [
    { Icon: Salad,       title: t('taste.step1Title'), sub: t('taste.step1Sub') },
    { Icon: ShieldAlert, title: t('taste.step2Title'), sub: t('taste.step2Sub') },
    { Icon: Globe2,      title: t('taste.step3Title'), sub: t('taste.step3Sub') },
    { Icon: Flame,       title: t('taste.step4Title'), sub: t('taste.step4Sub') },
    { Icon: ChefHat,     title: t('taste.step5Title'), sub: t('taste.step5Sub') },
    { Icon: Users,       title: t('taste.step6Title'), sub: t('taste.step6Sub') },
  ];
  const StepIcon = STEPS[step].Icon;

  function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
        <View style={styles.chipGrid}>{children}</View>
      </View>
    );
  }

  function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue} numberOfLines={2}>{value || '—'}</Text>
      </View>
    );
  }

  const label = (map: Record<string, string>, key: string) => map[key] ?? key;
  const labels = (map: Record<string, string>, keys: string[]) => keys.map((k) => label(map, k)).join(', ');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title={t('taste.title')} onBack={goBack} />

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{step + 1}/{TOTAL_STEPS}</Text>
      </View>

      {/* Step heading */}
      <View style={styles.stepHeading}>
        <View style={styles.stepIconWrap}>
          <StepIcon size={20} color={colors.primary} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>{STEPS[step].title}</Text>
          <Text style={styles.stepSub}>{STEPS[step].sub}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {step === 0 && (
          <>
            <Section title={t('taste.goalTitle')} subtitle={t('taste.goalSub')}>
              {HEALTH_GOALS.map((item) => (
                <Chip key={item} label={label(goalLabels, item)} selected={goal === item} onPress={() => setGoal(item)} />
              ))}
            </Section>
            <Section title={t('taste.dietaryTitle')} subtitle={t('taste.dietarySub')}>
              {DIETARY.map((item) => (
                <Chip key={item} label={label(dietaryLabels, item)} selected={dietary.includes(item)} onPress={() => setDietary(toggle(dietary, item))} />
              ))}
            </Section>
          </>
        )}

        {step === 1 && (
          <>
            <Section title={t('taste.allergiesTitle')} subtitle={t('taste.allergiesSub')}>
              {ALLERGIES.map((item) => (
                <Chip key={item} label={label(allergyLabels, item)} selected={allergies.includes(item)} onPress={() => setAllergies(toggle(allergies, item))} />
              ))}
            </Section>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('taste.dislikedTitle')}</Text>
              <Text style={styles.sectionSub}>{t('taste.dislikedSub')}</Text>
              <View style={styles.dislikedInputRow}>
                <TextInput
                  style={styles.dislikedInput}
                  value={newDisliked}
                  onChangeText={setNewDisliked}
                  placeholder={t('taste.dislikedPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={addDisliked}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.addDislikedBtn} onPress={addDisliked} activeOpacity={0.8}>
                  <Plus size={18} color={colors.textInverse} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              {disliked.length > 0 && (
                <View style={styles.dislikedTags}>
                  {disliked.map((item, idx) => (
                    <View key={`${item}-${idx}`} style={styles.dislikedTag}>
                      <Text style={styles.dislikedTagText}>{item}</Text>
                      <TouchableOpacity onPress={() => removeDisliked(item)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <X size={12} color={colors.error} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Section title={t('taste.cuisinesTitle')} subtitle={t('taste.cuisinesSub')}>
              {CUISINES.map((item) => (
                <Chip key={item} label={label(cuisineLabels, item)} selected={cuisines.includes(item)} onPress={() => setCuisines(toggle(cuisines, item))} />
              ))}
            </Section>
            <Section title={t('taste.proteinsTitle')} subtitle={t('taste.proteinsSub')}>
              {PROTEINS.map((item) => (
                <Chip key={item} label={label(proteinLabels, item)} selected={proteins.includes(item)} onPress={() => setProteins(toggle(proteins, item))} />
              ))}
            </Section>
          </>
        )}

        {step === 3 && (
          <>
            <Section title={t('taste.spiceTitle')}>
              {SPICE.map((item) => (
                <Chip key={item} label={label(spiceLabels, item)} selected={spice === item} onPress={() => setSpice(item)} />
              ))}
            </Section>
            <Section title={t('taste.maxCalTitle')} subtitle={t('taste.maxCalSub')}>
              {MAX_CALORIES.map((n) => (
                <Chip key={n} label={maxCalLabel(n)} selected={maxCal === n} onPress={() => setMaxCal(n)} />
              ))}
            </Section>
          </>
        )}

        {step === 4 && (
          <>
            <Section title={t('taste.skillTitle')}>
              {COOKING_SKILLS.map((item) => (
                <Chip key={item} label={label(cookingSkillLabels, item)} selected={skill === item} onPress={() => setSkill(item)} />
              ))}
            </Section>
            <Section title={t('taste.prepTimeTitle')}>
              {PREP_TIMES.map((item) => (
                <Chip key={item} label={label(prepTimeLabels, item)} selected={prepTime === item} onPress={() => setPrepTime(item)} />
              ))}
            </Section>
            <Section title={t('taste.budgetTitle')} subtitle={t('taste.budgetSub')}>
              {BUDGETS.map((item) => (
                <Chip key={item} label={label(budgetLabels, item)} selected={budget === item} onPress={() => setBudget(item)} />
              ))}
            </Section>
          </>
        )}

        {step === 5 && (
          <>
            <Section title={t('taste.mealsPerDayTitle')} subtitle={t('taste.mealsPerDaySub')}>
              {MEAL_FREQ.map((n) => (
                <Chip key={n} label={`${n} ${t('taste.meals')}`} selected={mealFreq === n} onPress={() => setMealFreq(n)} />
              ))}
            </Section>
            <Section title={t('taste.servingTitle')} subtitle={t('taste.servingSub')}>
              {SERVING_SIZES.map((n) => (
                <Chip key={n} label={`${n} ${n === 1 ? t('taste.person') : t('taste.persons')}`} selected={serving === n} onPress={() => setServing(n)} />
              ))}
            </Section>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Check size={16} color={colors.primary} strokeWidth={2.5} />
                <Text style={styles.summaryTitle}>{t('taste.summaryTitle')}</Text>
              </View>
              <SummaryRow label={t('taste.goalTitle')}      value={label(goalLabels, goal)} />
              <SummaryRow label={t('taste.dietaryTitle')}   value={labels(dietaryLabels, dietary)} />
              <SummaryRow label={t('taste.allergiesTitle')} value={labels(allergyLabels, allergies)} />
              <SummaryRow label={t('taste.dislikedTitle')}  value={disliked.join(', ')} />
              <SummaryRow label={t('taste.cuisinesTitle')}  value={labels(cuisineLabels, cuisines)} />
              <SummaryRow label={t('taste.proteinsTitle')}  value={labels(proteinLabels, proteins)} />
              <SummaryRow label={t('taste.spiceTitle')}     value={label(spiceLabels, spice)} />
              <SummaryRow label={t('taste.maxCalTitle')}    value={maxCalLabel(maxCal)} />
              <SummaryRow label={t('taste.skillTitle')}     value={label(cookingSkillLabels, skill)} />
              <SummaryRow label={t('taste.prepTimeTitle')}  value={label(prepTimeLabels, prepTime)} />
              <SummaryRow label={t('taste.budgetTitle')}    value={label(budgetLabels, budget)} />
            </View>

            <View style={styles.infoBanner}>
              <Info size={14} color={colors.primary} strokeWidth={2} />
              <Text style={styles.infoText}>{t('taste.infoText')}</Text>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backStepBtn} onPress={goBack} activeOpacity={0.8}>
            <ChevronLeft size={18} color={colors.text} strokeWidth={2.5} />
            <Text style={styles.backStepText}>{t('taste.back')}</Text>
          </TouchableOpacity>
        ) : <View style={styles.backSpacer} />}
        <View style={{ flex: 1 }}>
          <Button
            label={step === TOTAL_STEPS - 1 ? t('taste.saveBtn') : t('taste.next')}
            onPress={goNext}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },

    progressWrap: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      paddingHorizontal: Spacing.base, paddingTop: Spacing.sm,
    },
    progressTrack: {
      flex: 1, height: 6, borderRadius: 3, backgroundColor: c.borderLight,
      overflow: 'hidden',
    },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: c.primary },
    progressText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.textMuted, width: 30, textAlign: 'right' },

    stepHeading: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    },
    stepIconWrap: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: c.primarySurface,
      alignItems: 'center', justifyContent: 'center',
    },
    stepTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
    stepSub:   { fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 },

    infoBanner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: c.primarySurface, borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    },
    infoText:     { flex: 1, fontSize: FontSize.xs, color: c.primary, lineHeight: FontSize.xs * 1.5 },
    scroll:       { padding: Spacing.base },
    section:      { marginBottom: Spacing.xl },
    sectionTitle: {
      fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.text,
      marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8,
    },
    sectionSub: { fontSize: FontSize.xs, color: c.textMuted, marginBottom: Spacing.sm },
    chipGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },

    dislikedInputRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    dislikedInput: {
      flex: 1, backgroundColor: c.surface, borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
      fontSize: FontSize.base, color: c.text,
      borderWidth: 1.5, borderColor: c.border,
    },
    addDislikedBtn: {
      width: 48, height: 48, borderRadius: BorderRadius.md,
      backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
    },
    dislikedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
    dislikedTag: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: c.error + '22', borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    },
    dislikedTagText: { fontSize: FontSize.sm, color: c.error, fontWeight: FontWeight.medium },

    summaryCard: {
      backgroundColor: c.surface, borderRadius: BorderRadius.lg,
      padding: Spacing.base, marginBottom: Spacing.base,
      borderWidth: 1, borderColor: c.border,
    },
    summaryHeader: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    summaryTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text },
    summaryRow: {
      flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md,
      paddingVertical: 5, borderTopWidth: 1, borderTopColor: c.borderLight,
    },
    summaryLabel: { fontSize: FontSize.xs, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 },
    summaryValue: { fontSize: FontSize.xs, color: c.text, fontWeight: FontWeight.medium, flex: 1, textAlign: 'right' },

    footer: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      padding: Spacing.base, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background,
    },
    backStepBtn: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: Spacing.md, paddingHorizontal: Spacing.base,
      borderRadius: BorderRadius.full, backgroundColor: c.borderLight,
    },
    backStepText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.text },
    backSpacer: { width: 0 },
  });
}
