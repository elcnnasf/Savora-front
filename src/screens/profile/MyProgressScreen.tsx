import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { UtensilsCrossed, Flame, Activity, CalendarDays } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { WeeklyBarChart } from '../../components/charts/WeeklyBarChart';
import { WEEKLY_PROGRESS } from '../../data/mockData';

const STATS = [
  { label: 'Recipes Cooked', value: '47', icon: UtensilsCrossed, color: Colors.primary, bg: Colors.primarySurface },
  { label: 'Cooking Streak', value: '12 days', icon: Flame, color: Colors.warning, bg: '#FEF3C7' },
  { label: 'Calories Tracked', value: '18,420', icon: Activity, color: '#7C3AED', bg: '#F5F3FF' },
  { label: 'Meals Planned', value: '28', icon: CalendarDays, color: '#2563EB', bg: '#DBEAFE' },
];

const MONTHLY = [
  { label: 'Protein goal hit', value: 82 },
  { label: 'Calorie goal hit', value: 74 },
  { label: 'Meal plan followed', value: 91 },
];

export default function MyProgressScreen() {
  const navigation = useNavigation();
  const totalGoalPct = Math.round(WEEKLY_PROGRESS.filter(Boolean).reduce((a, b) => a + b, 0) / WEEKLY_PROGRESS.filter(Boolean).length);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="My Progress" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Stats grid */}
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

        {/* Weekly Activity — real per-day bar chart (audit fix C4) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Weekly Activity</Text>
            <Text style={styles.cardSub}>This week · {totalGoalPct}% of goal</Text>
          </View>
          <WeeklyBarChart data={WEEKLY_PROGRESS} />
        </View>

        {/* This Month */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Month</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, gap: Spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.xs, ...Shadow.sm,
  },
  statIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.base, gap: Spacing.md, ...Shadow.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },
  cardSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  monthlyList: { gap: Spacing.md },
  monthlyItem: { gap: Spacing.xs },
  monthlyLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  monthlyLabel: { fontSize: FontSize.sm, color: Colors.text },
  monthlyValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
});
