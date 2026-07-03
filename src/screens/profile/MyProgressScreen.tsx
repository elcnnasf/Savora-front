import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { UtensilsCrossed, Flame, Activity, CalendarDays } from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { WeeklyBarChart } from '../../components/charts/WeeklyBarChart';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { WEEKLY_PROGRESS } from '../../data/mockData';

export default function MyProgressScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const MONTHLY = [
    { label: t('myProgressScreen.proteinGoalHit'),   value: 82 },
    { label: t('myProgressScreen.calorieGoalHit'),   value: 74 },
    { label: t('myProgressScreen.mealPlanFollowed'), value: 91 },
  ];

  const STATS = [
    { label: t('myProgressScreen.recipesCooked'),   value: '47',     icon: UtensilsCrossed, color: colors.primary,  bg: colors.primarySurface },
    { label: t('myProgressScreen.cookingStreak'),   value: `12 ${t('myProgressScreen.days')}`, icon: Flame,           color: colors.warning,  bg: colors.warning + '22' },
    { label: t('myProgressScreen.caloriesTracked'), value: '18,420',  icon: Activity,        color: '#7C3AED',        bg: '#7C3AED22' },
    { label: t('myProgressScreen.mealsPlanned'),    value: '28',      icon: CalendarDays,    color: '#2563EB',        bg: '#2563EB22' },
  ];

  const totalGoalPct = Math.round(
    WEEKLY_PROGRESS.filter(Boolean).reduce((a, b) => a + b, 0) / WEEKLY_PROGRESS.filter(Boolean).length,
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title={t('myProgressScreen.title')} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.statsGrid}>
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                  <Icon size={20} color={stat.color} strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('myProgressScreen.weeklyActivity')}</Text>
            <Text style={styles.cardSub}>{t('myProgressScreen.thisWeek')} · {totalGoalPct}% {t('myProgressScreen.ofGoal')}</Text>
          </View>
          <WeeklyBarChart data={WEEKLY_PROGRESS} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('myProgressScreen.thisMonth')}</Text>
          <View style={styles.monthlyList}>
            {MONTHLY.map((item) => (
              <View key={item.label} style={styles.monthlyItem}>
                <View style={styles.monthlyLabelRow}>
                  <Text style={styles.monthlyLabel}>{item.label}</Text>
                  <Text style={styles.monthlyValue}>{item.value}%</Text>
                </View>
                <ProgressBar progress={item.value} height={8} />
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll:    { padding: Spacing.base, gap: Spacing.md },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    statCard: {
      flex: 1, minWidth: '45%',
      backgroundColor: c.card, borderRadius: BorderRadius.lg,
      padding: Spacing.md, gap: Spacing.xs, ...Shadow.sm,
    },
    statIcon:  { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: c.text },
    statLabel: { fontSize: FontSize.xs, color: c.textSecondary },

    card: {
      backgroundColor: c.card, borderRadius: BorderRadius.lg,
      padding: Spacing.base, gap: Spacing.md, ...Shadow.sm,
    },
    cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle:    { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text },
    cardSub:      { fontSize: FontSize.xs, color: c.textMuted },
    monthlyList:  { gap: Spacing.md },
    monthlyItem:  { gap: Spacing.xs },
    monthlyLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
    monthlyLabel: { fontSize: FontSize.sm, color: c.text },
    monthlyValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.primary },
  });
}
