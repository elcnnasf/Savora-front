import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Sparkles, Minus, Plus, X } from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { generateRecipe } from '../../api/ai';
import { RootStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<{ AIRecipe: { ingredients?: string[] } | undefined }, 'AIRecipe'>;

const DIETARY = ['High Protein', 'Low Carb', 'Vegan', 'Keto', 'Quick', 'Vegetarian'];
const TIMES   = [15, 30, 45, 60];

export default function AIRecipeScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { preferences, language } = useUserStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const passedIngredients = (route.params as any)?.ingredients as string[] | undefined;

  const [query,            setQuery]            = useState('');
  const [scannedIngredients, setScannedIngredients] = useState<string[]>(passedIngredients ?? []);
  const [dietary,          setDietary]          = useState<string[]>(preferences.dietary ?? []);
  const [maxTime,          setMaxTime]          = useState(30);
  const [servings,         setServings]         = useState(preferences.servingSize ?? 2);
  const [generating,       setGenerating]       = useState(false);

  const isIngredientsMode = scannedIngredients.length > 0;

  useEffect(() => {
    if (isIngredientsMode) {
      generate();
    }
  }, []);

  function toggleDietary(item: string) {
    setDietary((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item],
    );
  }

  async function generate() {
    if (!isIngredientsMode && !query.trim()) {
      Alert.alert('Description required', 'Please describe what you want to cook.');
      return;
    }
    setGenerating(true);
    try {
      const dietary_restrictions = dietary.length > 0 ? dietary : preferences.dietary.length > 0 ? preferences.dietary : undefined;
      const res = await generateRecipe(
        isIngredientsMode
          ? {
              ingredients: scannedIngredients,
              language,
              preferences: {
                dietary_restrictions,
                cuisine: preferences.cuisines[0] ?? undefined,
                max_cook_time: maxTime,
                servings,
              },
            }
          : {
              description: query.trim(),
              language,
              preferences: {
                dietary_restrictions,
                cuisine: preferences.cuisines[0] ?? undefined,
                max_cook_time: maxTime,
                servings,
              },
            },
      );

      navigation.replace('RecipeDetail', { recipe: res.data });
    } catch (err: any) {
      Alert.alert('Generation failed', err?.message ?? 'Could not generate recipe. Please try again.');
      setGenerating(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="AI Recipe" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>
            {isIngredientsMode ? 'Generating from Ingredients' : 'What would you like to cook?'}
          </Text>
          <Text style={styles.subheading}>
            {isIngredientsMode
              ? 'AI is creating a recipe using your scanned ingredients'
              : 'Describe the dish or list your ingredients'}
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
                placeholder="e.g. A creamy chicken pasta, a vegan dinner, high-protein breakfast with eggs..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}

          <Text style={styles.sectionLabel}>{t('recipe.ingredients').includes('Ingred') ? 'Dietary Preferences' : t('recipe.ingredients')}</Text>
          <View style={styles.chipGrid}>
            {DIETARY.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={dietary.includes(item)}
                onPress={() => toggleDietary(item)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Max Cooking Time</Text>
          <View style={styles.chipGrid}>
            {TIMES.map((t) => (
              <Chip
                key={t}
                label={t === 60 ? '60+ min' : `${t} min`}
                selected={maxTime === t}
                onPress={() => setMaxTime(t)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>{t('recipe.servings')}</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setServings((s) => Math.max(1, s - 1))}
              activeOpacity={0.7}
            >
              <Minus size={16} color={colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{servings}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setServings((s) => Math.min(10, s + 1))}
              activeOpacity={0.7}
            >
              <Plus size={16} color={colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {generating && (
            <View style={styles.generatingBox}>
              <Sparkles size={20} color={colors.primary} strokeWidth={2} />
              <Text style={styles.generatingText}>
                AI is crafting your recipe with detailed steps…{'\n'}This may take 10–15 seconds.
              </Text>
            </View>
          )}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={generating ? 'Generating...' : 'Generate Recipe'}
            onPress={generate}
            loading={generating}
            icon={!generating
              ? <Sparkles size={18} color={colors.textInverse} strokeWidth={2.5} />
              : undefined}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container:  { flex: 1, backgroundColor: c.background },
  scroll:     { padding: Spacing.base, paddingTop: Spacing.md },
  heading:    { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: c.text, marginBottom: 4 },
  subheading: { fontSize: FontSize.base, color: c.textSecondary, marginBottom: Spacing.base },
  inputBox: {
    backgroundColor: c.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: c.border,
    padding: Spacing.base, marginBottom: Spacing.xl, minHeight: 110,
  },
  input: { fontSize: FontSize.base, color: c.text, lineHeight: FontSize.base * 1.5 },
  sectionLabel: {
    fontSize: FontSize.md, fontWeight: FontWeight.bold, color: c.text,
    marginBottom: Spacing.md, marginTop: Spacing.sm,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xl,
    alignSelf: 'flex-start',
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
  generatingBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginTop: Spacing.xl,
    borderWidth: 1, borderColor: c.primary + '33',
  },
  generatingText: {
    flex: 1, fontSize: FontSize.sm, color: c.primary,
    fontWeight: FontWeight.medium, lineHeight: FontSize.sm * 1.5,
  },
  footer: { padding: Spacing.base, borderTopWidth: 1, borderTopColor: c.border },

  ingredientTags: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  ingredientTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: c.primary + '40',
  },
  ingredientTagText: { fontSize: FontSize.sm, color: c.primary, fontWeight: FontWeight.medium },
});
