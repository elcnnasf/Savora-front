import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Sparkles, Minus, Plus, X, ChevronRight, Clock, ChefHat,
  ArrowLeft, Check,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { generateRecipe, suggestRecipes, RecipeSuggestion, buildAiPreferences } from '../../api/ai';
import { RootStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AIRecipe'>;

type Phase = 'input' | 'suggesting' | 'suggestions' | 'generating';

const DIETARY = ['High Protein', 'Low Carb', 'Vegan', 'Keto', 'Quick', 'Vegetarian'];
const TIMES   = [15, 30, 45, 60];

const LANG_CODE_MAP: Record<string, string> = {
  en: 'English', az: 'Azerbaijani', ru: 'Russian', tr: 'Turkish',
};

function getSuggestionName(s: RecipeSuggestion): string {
  return s.name; // already in user's language
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   '#10B981',
  medium: '#F59E0B',
  hard:   '#EF4444',
};

export default function AIRecipeScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { preferences, language } = useUserStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const passedIngredients   = route.params?.ingredients;
  const initialDescription  = route.params?.initialDescription;

  const [query,               setQuery]               = useState(initialDescription ?? '');
  const [scannedIngredients,  setScannedIngredients]  = useState<string[]>(passedIngredients ?? []);
  const [dietary,             setDietary]             = useState<string[]>(preferences.dietary ?? []);
  const [maxTime,             setMaxTime]             = useState(30);
  const [servings,            setServings]            = useState(preferences.servingSize ?? 2);

  const [phase,               setPhase]               = useState<Phase>('input');
  const [suggestions,         setSuggestions]         = useState<RecipeSuggestion[]>([]);
  const [selected,            setSelected]            = useState<RecipeSuggestion | null>(null);

  const isIngredientsMode = scannedIngredients.length > 0;

  const fadeAnim = useRef(new Animated.Value(1)).current;

  function fadeTransition(cb: () => void) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  useEffect(() => {
    if (isIngredientsMode) {
      suggestFromIngredients();
    }
  }, []);

  // Scanned-ingredients entry: offer 5 dish suggestions built around the
  // ingredients instead of jumping straight to one generated recipe.
  // Falls back to direct generation if the suggestion call fails.
  async function suggestFromIngredients() {
    fadeTransition(() => setPhase('suggesting'));
    try {
      // schema caps query at 200 chars — keep whole ingredient names only
      let q = '';
      for (const ing of scannedIngredients) {
        const next = q ? `${q}, ${ing}` : ing;
        if (next.length > 190) break;
        q = next;
      }
      const res = await suggestRecipes({ query: q || scannedIngredients[0], language });
      const list = res.data.suggestions;
      if (!list || list.length === 0) {
        await directGenerate();
        return;
      }
      setSuggestions(list);
      setSelected(null);
      fadeTransition(() => setPhase('suggestions'));
    } catch {
      await directGenerate();
    }
  }

  function toggleDietary(item: string) {
    setDietary((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item],
    );
  }

  async function getSuggestions() {
    if (!query.trim()) {
      Alert.alert(t('ai.descRequired') || 'Required', t('ai.descRequiredMsg') || 'Please describe what you want to cook.');
      return;
    }
    fadeTransition(() => setPhase('suggesting'));
    try {
      const res = await suggestRecipes({ query: query.trim(), language });
      const list = res.data.suggestions;
      if (!list || list.length === 0) {
        Alert.alert(t('errors.noSuggestionsTitle'), t('errors.noSuggestionsMsg'));
        fadeTransition(() => setPhase('input'));
        return;
      }
      setSuggestions(list);
      setSelected(null);
      fadeTransition(() => setPhase('suggestions'));
    } catch (err: any) {
      Alert.alert(t('errors.title'), err?.message ?? t('errors.couldNotLoadSuggestions'));
      fadeTransition(() => setPhase('input'));
    }
  }

  async function directGenerate() {
    setPhase('generating');
    try {
      const dietary_restrictions = dietary.length > 0 ? dietary : preferences.dietary.length > 0 ? preferences.dietary : undefined;
      const res = await generateRecipe({
        ingredients: scannedIngredients,
        language,
        preferences: { ...buildAiPreferences(preferences), dietary_restrictions, max_cook_time: maxTime, servings },
      });
      navigation.replace('RecipeDetail', { recipe: res.data });
    } catch (err: any) {
      Alert.alert(t('errors.generationFailedTitle'), err?.message ?? t('errors.couldNotGenerateRecipe'));
      setPhase('input');
    }
  }

  async function generateFromSuggestion() {
    if (!selected) return;
    const nameForGen = selected.nameEn || selected.name;
    fadeTransition(() => setPhase('generating'));
    try {
      const dietary_restrictions = dietary.length > 0 ? dietary : preferences.dietary.length > 0 ? preferences.dietary : undefined;
      const res = await generateRecipe({
        description: nameForGen,
        language,
        preferences: {
          ...buildAiPreferences(preferences),
          dietary_restrictions,
          cuisine: (selected.cuisine || preferences.cuisines[0]) ?? undefined,
          max_cook_time: maxTime,
          servings,
        },
      });
      navigation.replace('RecipeDetail', { recipe: res.data });
    } catch (err: any) {
      Alert.alert(t('errors.generationFailedTitle'), err?.message ?? t('errors.couldNotGenerateRecipe'));
      fadeTransition(() => setPhase('suggestions'));
    }
  }

  if (phase === 'suggesting') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header title={t('ai.title') || 'AI Recipe'} onBack={() => {}} />
        <View style={styles.center}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>{t('ai.findingSuggestions') || 'Finding suggestions…'}</Text>
            <Text style={styles.loadingSubtitle}>{t('ai.findingSuggestionsDesc') || 'AI is analyzing your request'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'generating') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header title={t('ai.title') || 'AI Recipe'} onBack={() => {}} />
        <View style={styles.center}>
          <View style={styles.loadingCard}>
            <Sparkles size={36} color={colors.primary} strokeWidth={1.8} />
            <Text style={styles.loadingTitle}>{t('ai.generatingRecipe') || 'Crafting your recipe…'}</Text>
            <Text style={styles.loadingSubtitle}>{t('ai.generatingRecipeDesc') || 'This may take 10–15 seconds'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'suggestions') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.suggestionsHeader}>
          <TouchableOpacity
            style={styles.backChip}
            onPress={() => fadeTransition(() => { setPhase('input'); setSuggestions([]); setSelected(null); })}
            activeOpacity={0.8}
          >
            <ArrowLeft size={16} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.backChipText}>{t('common.back') || 'Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.suggestionsTitle}>{t('ai.chooseSuggestion') || 'Choose a recipe'}</Text>
          <Text style={styles.suggestionsSubtitle}>{t('ai.chooseSuggestionDesc') || 'Select a suggestion to generate the full recipe'}</Text>
        </View>

        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsList}
        >
          {suggestions.map((s, i) => {
            const isSelected = selected?.name === s.name;
            const localName  = getSuggestionName(s);
            const diffColor  = DIFFICULTY_COLOR[s.difficulty] ?? colors.textMuted;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.suggestionCard, isSelected && styles.suggestionCardSelected]}
                onPress={() => setSelected(s)}
                activeOpacity={0.85}
              >
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                    <Check size={12} color="#fff" strokeWidth={3} />
                  </View>
                )}

                <View style={styles.suggestionCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.suggestionName, isSelected && { color: colors.primary }]} numberOfLines={2}>
                      {localName}
                    </Text>
                    <Text style={styles.suggestionDesc} numberOfLines={3}>{s.description}</Text>
                  </View>
                </View>

                <View style={styles.suggestionMeta}>
                  <View style={[styles.metaBadge, { backgroundColor: diffColor + '18' }]}>
                    <ChefHat size={11} color={diffColor} strokeWidth={2} />
                    <Text style={[styles.metaText, { color: diffColor }]}>{s.difficulty}</Text>
                  </View>
                  <View style={[styles.metaBadge, { backgroundColor: colors.primarySurface }]}>
                    <Clock size={11} color={colors.primary} strokeWidth={2} />
                    <Text style={[styles.metaText, { color: colors.primary }]}>{s.cookTime} min</Text>
                  </View>
                  <Text style={styles.cuisineText}>{s.cuisine}</Text>
                </View>

                <View style={styles.ingredientRow}>
                  {s.mainIngredients.slice(0, 5).map((ing, j) => (
                    <View key={j} style={styles.ingChip}>
                      <Text style={styles.ingChipText} numberOfLines={1}>{ing}</Text>
                    </View>
                  ))}
                  {s.mainIngredients.length > 5 && (
                    <Text style={styles.ingMore}>+{s.mainIngredients.length - 5}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 120 }} />
        </Animated.ScrollView>

        <View style={styles.footer}>
          <Button
            label={selected
              ? (t('ai.generateSelected') || `Generate "${getSuggestionName(selected)}"`)
              : (t('ai.selectToGenerate') || 'Select a recipe above')}
            onPress={generateFromSuggestion}
            disabled={!selected}
            icon={<Sparkles size={18} color={colors.textInverse} strokeWidth={2.5} />}
          />
        </View>
      </SafeAreaView>
    );
  }

  // === INPUT PHASE ===
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title={t('ai.title') || 'AI Recipe'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>
            {isIngredientsMode ? (t('ai.fromIngredients') || 'Generate from Ingredients') : (t('ai.whatToCook') || 'What would you like to cook?')}
          </Text>
          <Text style={styles.subheading}>
            {isIngredientsMode
              ? (t('ai.fromIngredientsDesc') || 'AI will create a recipe using your scanned ingredients')
              : (t('ai.whatToCookDesc') || 'Describe the dish — AI will give you 5 suggestions to choose from')}
          </Text>

          {isIngredientsMode ? (
            <View style={styles.ingredientTags}>
              {scannedIngredients.map((name) => (
                <View key={name} style={styles.ingredientTag}>
                  <Text style={styles.ingredientTagText}>{name}</Text>
                  <TouchableOpacity
                    onPress={() => setScannedIngredients((prev) => prev.filter((i) => i !== name))}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <X size={11} color={colors.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder={t('ai.queryPlaceholder') || 'e.g. piti, chicken pasta, vegetarian dinner…'}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
              />
            </View>
          )}

          <Text style={styles.sectionLabel}>{t('ai.dietaryPrefs') || 'Dietary Preferences'}</Text>
          <View style={styles.chipGrid}>
            {DIETARY.map((item) => (
              <Chip key={item} label={item} selected={dietary.includes(item)} onPress={() => toggleDietary(item)} />
            ))}
          </View>

          <Text style={styles.sectionLabel}>{t('ai.maxTime') || 'Max Cooking Time'}</Text>
          <View style={styles.chipGrid}>
            {TIMES.map((tm) => (
              <Chip key={tm} label={tm === 60 ? '60+ min' : `${tm} min`} selected={maxTime === tm} onPress={() => setMaxTime(tm)} />
            ))}
          </View>

          <Text style={styles.sectionLabel}>{t('recipe.servings')}</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => setServings((s) => Math.max(1, s - 1))} activeOpacity={0.7}>
              <Minus size={16} color={colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{servings}</Text>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => setServings((s) => Math.min(10, s + 1))} activeOpacity={0.7}>
              <Plus size={16} color={colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>

        <View style={styles.footer}>
          {isIngredientsMode ? (
            <Button
              label={t('ai.generateRecipe') || 'Generate Recipe'}
              onPress={directGenerate}
              icon={<Sparkles size={18} color={colors.textInverse} strokeWidth={2.5} />}
            />
          ) : (
            <Button
              label={t('ai.getSuggestions') || 'Get 5 Suggestions'}
              onPress={getSuggestions}
              icon={<ChevronRight size={18} color={colors.textInverse} strokeWidth={2.5} />}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container:  { flex: 1, backgroundColor: c.background },
  scroll:     { padding: Spacing.base, paddingTop: Spacing.md },
  heading:    { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: c.text, marginBottom: 4 },
  subheading: { fontSize: FontSize.base, color: c.textSecondary, marginBottom: Spacing.base, lineHeight: 22 },
  footer:     { padding: Spacing.base, borderTopWidth: 1, borderTopColor: c.border },

  inputBox: {
    backgroundColor: c.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: c.border,
    padding: Spacing.base, marginBottom: Spacing.xl, minHeight: 90,
  },
  input: { fontSize: FontSize.base, color: c.text, lineHeight: FontSize.base * 1.5 },

  sectionLabel: {
    fontSize: FontSize.md, fontWeight: FontWeight.bold, color: c.text,
    marginBottom: Spacing.md, marginTop: Spacing.sm,
  },
  chipGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },

  stepperRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xl, alignSelf: 'flex-start',
    backgroundColor: c.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: c.border,
  },
  stepperBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.background, borderWidth: 1.5, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperValue: {
    fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.text,
    minWidth: 24, textAlign: 'center',
  },

  ingredientTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  ingredientTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: c.primary + '40',
  },
  ingredientTagText: { fontSize: FontSize.sm, color: c.primary, fontWeight: FontWeight.medium },

  // Loading states
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  loadingCard: {
    alignItems: 'center', gap: Spacing.md,
    backgroundColor: c.surface, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, width: '100%',
    borderWidth: 1, borderColor: c.border, ...Shadow.md,
  },
  loadingTitle:    { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.text, textAlign: 'center' },
  loadingSubtitle: { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center' },

  // Suggestions phase
  suggestionsHeader: {
    paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  backChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginBottom: Spacing.md,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  backChipText:    { fontSize: FontSize.sm, color: c.primary, fontWeight: FontWeight.semibold },
  suggestionsTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: c.text },
  suggestionsSubtitle: { fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },
  suggestionsList: { padding: Spacing.base, gap: Spacing.md },

  suggestionCard: {
    backgroundColor: c.surface, borderRadius: BorderRadius.xl,
    borderWidth: 1.5, borderColor: c.border,
    padding: Spacing.base, gap: Spacing.sm,
    ...Shadow.sm,
  },
  suggestionCardSelected: {
    borderColor: c.primary,
    backgroundColor: c.primarySurface,
  },
  selectedBadge: {
    position: 'absolute', top: 12, right: 12,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionCardTop: { flexDirection: 'row', gap: Spacing.sm },
  suggestionName:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text, marginBottom: 4, paddingRight: 28 },
  suggestionDesc:    { fontSize: FontSize.sm, color: c.textSecondary, lineHeight: 18 },

  suggestionMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  metaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 4,
  },
  metaText:   { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  cuisineText: { fontSize: FontSize.xs, color: c.textMuted, fontStyle: 'italic' },

  ingredientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingChip: {
    backgroundColor: c.borderLight, borderRadius: BorderRadius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  ingChipText: { fontSize: FontSize.xs, color: c.textSecondary, maxWidth: 100 },
  ingMore: { fontSize: FontSize.xs, color: c.textMuted, alignSelf: 'center' },
});
