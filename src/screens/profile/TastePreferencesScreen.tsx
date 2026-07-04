import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { X, Plus, Info } from 'lucide-react-native';
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
const CUISINES      = ['Italian', 'Asian', 'Mexican', 'Mediterranean', 'American', 'Indian', 'Japanese', 'Middle Eastern', 'Thai', 'French', 'Chinese', 'Turkish', 'Azerbaijani', 'Greek'];
const SPICE         = ['No Spice', 'Mild', 'Medium', 'Hot', 'Very Hot'];
const ALLERGIES     = ['Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Eggs', 'Soy', 'Wheat / Gluten', 'Milk / Dairy', 'Sesame', 'Mustard'];
const COOKING_SKILLS = ['Beginner', 'Home Cook', 'Intermediate', 'Advanced', 'Chef Level'];
const PREP_TIMES    = ['Quick (<15 min)', '15-30 min', '30-60 min', 'Long (60+ min)', 'No Preference'];
const BUDGETS       = ['Budget-Friendly', 'Moderate', 'Premium'];
const MEAL_FREQ     = [2, 3, 4, 5, 6];
const SERVING_SIZES = [1, 2, 3, 4, 6, 8];

export default function TastePreferencesScreen() {
  const navigation = useNavigation();
  const { preferences, setPreferences } = useUserStore();
  const { t, raw } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const dietaryLabels      = raw<Record<string, string>>('taste.options.dietary');
  const cuisineLabels      = raw<Record<string, string>>('taste.options.cuisines');
  const spiceLabels        = raw<Record<string, string>>('taste.options.spice');
  const allergyLabels      = raw<Record<string, string>>('taste.options.allergies');
  const cookingSkillLabels = raw<Record<string, string>>('taste.options.cookingSkills');
  const prepTimeLabels     = raw<Record<string, string>>('taste.options.prepTimes');
  const budgetLabels       = raw<Record<string, string>>('taste.options.budgets');

  const [dietary,   setDietary]   = useState<string[]>(preferences.dietary ?? []);
  const [cuisines,  setCuisines]  = useState<string[]>(preferences.cuisines ?? []);
  const [spice,     setSpice]     = useState(preferences.spiceLevel ?? 'Medium');
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
    });
    navigation.goBack();
  }

  function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
        <View style={styles.chipGrid}>{children}</View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title={t('taste.title')} onBack={() => navigation.goBack()} />

      <View style={styles.infoBanner}>
        <Info size={14} color={colors.primary} strokeWidth={2} />
        <Text style={styles.infoText}>{t('taste.infoText')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Section title={t('taste.dietaryTitle')} subtitle={t('taste.dietarySub')}>
          {DIETARY.map((item) => (
            <Chip key={item} label={dietaryLabels[item] ?? item} selected={dietary.includes(item)} onPress={() => setDietary(toggle(dietary, item))} />
          ))}
        </Section>

        <Section title={t('taste.cuisinesTitle')} subtitle={t('taste.cuisinesSub')}>
          {CUISINES.map((item) => (
            <Chip key={item} label={cuisineLabels[item] ?? item} selected={cuisines.includes(item)} onPress={() => setCuisines(toggle(cuisines, item))} />
          ))}
        </Section>

        <Section title={t('taste.spiceTitle')}>
          {SPICE.map((item) => (
            <Chip key={item} label={spiceLabels[item] ?? item} selected={spice === item} onPress={() => setSpice(item)} />
          ))}
        </Section>

        <Section title={t('taste.allergiesTitle')} subtitle={t('taste.allergiesSub')}>
          {ALLERGIES.map((item) => (
            <Chip key={item} label={allergyLabels[item] ?? item} selected={allergies.includes(item)} onPress={() => setAllergies(toggle(allergies, item))} />
          ))}
        </Section>

        <Section title={t('taste.skillTitle')}>
          {COOKING_SKILLS.map((item) => (
            <Chip key={item} label={cookingSkillLabels[item] ?? item} selected={skill === item} onPress={() => setSkill(item)} />
          ))}
        </Section>

        <Section title={t('taste.prepTimeTitle')}>
          {PREP_TIMES.map((item) => (
            <Chip key={item} label={prepTimeLabels[item] ?? item} selected={prepTime === item} onPress={() => setPrepTime(item)} />
          ))}
        </Section>

        <Section title={t('taste.budgetTitle')} subtitle={t('taste.budgetSub')}>
          {BUDGETS.map((item) => (
            <Chip key={item} label={budgetLabels[item] ?? item} selected={budget === item} onPress={() => setBudget(item)} />
          ))}
        </Section>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('taste.mealsPerDayTitle')}</Text>
          <Text style={styles.sectionSub}>{t('taste.mealsPerDaySub')}</Text>
          <View style={styles.chipGrid}>
            {MEAL_FREQ.map((n) => (
              <Chip key={n} label={`${n} ${t('taste.meals')}`} selected={mealFreq === n} onPress={() => setMealFreq(n)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('taste.servingTitle')}</Text>
          <Text style={styles.sectionSub}>{t('taste.servingSub')}</Text>
          <View style={styles.chipGrid}>
            {SERVING_SIZES.map((n) => (
              <Chip key={n} label={`${n} ${n === 1 ? t('taste.person') : t('taste.persons')}`} selected={serving === n} onPress={() => setServing(n)} />
            ))}
          </View>
        </View>

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

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t('taste.saveBtn')} onPress={save} />
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    infoBanner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: c.primarySurface, paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
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
    footer: { padding: Spacing.base, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background },
  });
}
