import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Lock } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ACHIEVEMENTS } from '../../data/mockData';

export default function AchievementsScreen() {
  const navigation = useNavigation();
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Achievements" onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Summary banner */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCount}>
            {unlocked} <Text style={styles.summaryTotal}>/ {ACHIEVEMENTS.length}</Text>
          </Text>
          <Text style={styles.summaryLabel}>Achievements Unlocked</Text>
          {/* Green progress bar — audit fix M9 (was orange) */}
          <ProgressBar progress={(unlocked / ACHIEVEMENTS.length) * 100} height={8} color={Colors.primary} />
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {ACHIEVEMENTS.map((ach) => (
            <View
              key={ach.id}
              style={[styles.achCard, !ach.unlocked && styles.achCardLocked]}
            >
              {!ach.unlocked && (
                <View style={styles.lockOverlay}>
                  <Lock size={14} color={Colors.textMuted} strokeWidth={2} />
                </View>
              )}
              <Text style={[styles.achIcon, !ach.unlocked && styles.achIconLocked]}>
                {ach.unlocked ? '🏆' : '🔒'}
              </Text>
              <Text style={[styles.achTitle, !ach.unlocked && styles.achTitleLocked]} numberOfLines={2}>
                {ach.title}
              </Text>
              <Text style={[styles.achDesc, !ach.unlocked && styles.achDescLocked]} numberOfLines={2}>
                {ach.desc}
              </Text>
              {ach.unlocked && (
                <View style={styles.unlockedBadge}>
                  <Text style={styles.unlockedText}>Earned</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, gap: Spacing.lg },
  summaryCard: {
    backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.lg,
    padding: Spacing.base, gap: Spacing.sm, alignItems: 'center',
  },
  summaryCount: { fontSize: 48, fontWeight: FontWeight.extrabold, color: Colors.primary },
  summaryTotal: { fontSize: FontSize.xxl, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  achCard: {
    width: '47%', backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    alignItems: 'center', gap: Spacing.xs, ...Shadow.sm,
    borderWidth: 1.5, borderColor: Colors.primaryLight + '40',
    position: 'relative',
  },
  achCardLocked: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderLight,
    opacity: 0.75,
  },
  lockOverlay: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm,
  },
  achIcon: { fontSize: 32 },
  achIconLocked: { opacity: 0.4 },
  achTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    color: Colors.text, textAlign: 'center',
  },
  achTitleLocked: { color: Colors.textMuted },
  achDesc: {
    fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center',
  },
  achDescLocked: { color: Colors.textMuted },
  unlockedBadge: {
    backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.primaryLight,
  },
  unlockedText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
});
