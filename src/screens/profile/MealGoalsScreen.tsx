import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Flame, Activity, Zap, Target, Droplets, Minus, Plus } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useUserStore } from '../../store/userStore';
import { getWeekPlan, getWeekStart, MealItem } from '../../api/mealPlanner';

const GOALS_CONFIG = [
  { key: 'calories' as const, label: 'Daily Calories', unit: 'kcal', icon: Flame, color: Colors.warning, step: 50, min: 1000, max: 5000 },
  { key: 'protein'  as const, label: 'Protein Goal',   unit: 'g',    icon: Activity, color: '#2563EB', step: 5, min: 20, max: 300 },
  { key: 'carbs'    as const, label: 'Carbs Goal',     unit: 'g',    icon: Zap,      color: '#F59E0B', step: 5, min: 20, max: 500 },
  { key: 'fat'      as const, label: 'Fat Goal',       unit: 'g',    icon: Target,   color: '#7C3AED', step: 5, min: 10, max: 200 },
  { key: 'water'    as const, label: 'Water Intake',   unit: 'glasses', icon: Droplets, color: '#0891B2', step: 1, min: 1, max: 20 },
];

function getTodayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

export default function MealGoalsScreen() {
  const navigation = useNavigation();
  const { mealGoals, setMealGoals, todayCaloriesConsumed, setTodayCaloriesConsumed } = useUserStore();
  const [goals, setGoals] = useState({ ...mealGoals });
  const [loadingToday, setLoadingToday] = useState(true);

  useEffect(() => {
    async function fetchToday() {
      try {
        const weekStart = getWeekStart();
        const res = await getWeekPlan(weekStart);
        const todayIdx = getTodayIndex();
        const todayMeals: MealItem[] = res.data.by_day?.[todayIdx] ?? [];
        const consumed = todayMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
        setTodayCaloriesConsumed(consumed);
      } catch { /* silent */ }
      setLoadingToday(false);
    }
    fetchToday();
  }, []);

  function adjust(key: keyof typeof goals, delta: number, min: number, max: number) {
    setGoals((g) => ({ ...g, [key]: Math.max(min, Math.min(max, g[key] + delta)) }));
  }

  const caloriesProgress = goals.calories > 0
    ? Math.min((todayCaloriesConsumed / goals.calories) * 100, 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Meal Goals" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>Set your daily nutrition targets to get personalized AI recommendations.</Text>

        {/* Today's calorie summary card */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Flame size={18} color={Colors.warning} strokeWidth={2} />
            <Text style={styles.todayTitle}>Today's Progress</Text>
            {loadingToday && <ActivityIndicator size="small" color={Colors.primary} />}
          </View>
          <View style={styles.todayCalRow}>
            <Text style={styles.todayConsumed}>{todayCaloriesConsumed.toLocaleString()}</Text>
            <Text style={styles.todayOf}> / {goals.calories.toLocaleString()} kcal</Text>
          </View>
          <ProgressBar progress={caloriesProgress} height={8} />
          <Text style={styles.todayHint}>
            {todayCaloriesConsumed === 0
              ? 'No meals logged today — add meals in your Meal Planner.'
              : `${Math.round(caloriesProgress)}% of daily goal consumed`}
          </Text>
        </View>

        {GOALS_CONFIG.map((config) => {
          const Icon = config.icon;
          const value = goals[config.key];

          return (
            <View key={config.key} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={[styles.goalIcon, { backgroundColor: config.color + '18' }]}>
                  <Icon size={20} color={config.color} strokeWidth={2} />
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalLabel}>{config.label}</Text>
                  <Text style={styles.goalUnit}>{config.unit}</Text>
                </View>

                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjust(config.key, -config.step, config.min, config.max)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Minus size={14} color={value <= config.min ? Colors.textMuted : Colors.text} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <Text style={styles.goalValue}>{value.toLocaleString()}</Text>
                  <TouchableOpacity
                    style={styles.stepBtnGreen}
                    onPress={() => adjust(config.key, config.step, config.min, config.max)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Plus size={14} color={Colors.textInverse} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Save Goals" onPress={() => { setMealGoals(goals); navigation.goBack(); }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, gap: Spacing.md },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: FontSize.sm * 1.6 },

  todayCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.base, gap: Spacing.sm, ...Shadow.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.warning,
  },
  todayHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  todayTitle: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },
  todayCalRow: { flexDirection: 'row', alignItems: 'baseline' },
  todayConsumed: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  todayOf: { fontSize: FontSize.sm, color: Colors.textSecondary },
  todayHint: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: FontSize.xs * 1.5 },

  goalCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.base, ...Shadow.sm },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  goalIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  goalInfo: { flex: 1 },
  goalLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text },
  goalUnit: { fontSize: FontSize.xs, color: Colors.textMuted },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnGreen: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  goalValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.text, minWidth: 48, textAlign: 'center' },
  footer: { padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
});
