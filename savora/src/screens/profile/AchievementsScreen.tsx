import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Lock } from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ACHIEVEMENTS } from '../../data/mockData';

export default function AchievementsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title={t('achievements.title')} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCount}>
            {unlocked} <Text style={styles.summaryTotal}>/ {ACHIEVEMENTS.length}</Text>
          </Text>
          <Text style={styles.summaryLabel}>{t('achievements.unlocked')}</Text>
          <ProgressBar progress={(unlocked / ACHIEVEMENTS.length) * 100} height={8} />
        </View>

        <View style={styles.grid}>
          {ACHIEVEMENTS.map((ach) => (
            <View key={ach.id} style={[styles.achCard, !ach.unlocked && styles.achCardLocked]}>
              {!ach.unlocked && (
                <View style={styles.lockOverlay}>
                  <Lock size={14} color={colors.textMuted} strokeWidth={2} />
                </View>
              )}
              <Text style={[styles.achIcon, !ach.unlocked && styles.achIconLocked]}>
                {ach.unlocked ? '🏆' : '🔒'}
              </Text>
              <Text style={[styles.achTitle, !ach.unlocked && styles.achTitleLocked]} numberOfLines={2}>
                {t(`achievements.items.${ach.id}.title`)}
              </Text>
              <Text style={[styles.achDesc, !ach.unlocked && styles.achDescLocked]} numberOfLines={2}>
                {t(`achievements.items.${ach.id}.desc`)}
              </Text>
              {ach.unlocked && (
                <View style={styles.unlockedBadge}>
                  <Text style={styles.unlockedText}>{t('achievements.earned')}</Text>
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

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll:    { padding: Spacing.base, gap: Spacing.lg },

    summaryCard: {
      backgroundColor: c.primarySurface, borderRadius: BorderRadius.lg,
      padding: Spacing.base, gap: Spacing.sm, alignItems: 'center',
    },
    summaryCount: { fontSize: 48, fontWeight: FontWeight.extrabold, color: c.primary },
    summaryTotal: { fontSize: FontSize.xxl, fontWeight: FontWeight.medium, color: c.textSecondary },
    summaryLabel: { fontSize: FontSize.sm, color: c.textSecondary, marginBottom: Spacing.xs },

    grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    achCard: {
      width: '47%', backgroundColor: c.card,
      borderRadius: BorderRadius.lg, padding: Spacing.md,
      alignItems: 'center', gap: Spacing.xs, ...Shadow.sm,
      borderWidth: 1.5, borderColor: c.primaryLight + '40',
      position: 'relative',
    },
    achCardLocked: {
      backgroundColor: c.surface,
      borderColor: c.borderLight,
      opacity: 0.75,
    },
    lockOverlay: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
    achIcon:       { fontSize: 32 },
    achIconLocked: { opacity: 0.4 },
    achTitle:       { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.text, textAlign: 'center' },
    achTitleLocked: { color: c.textMuted },
    achDesc:        { fontSize: FontSize.xs, color: c.textSecondary, textAlign: 'center' },
    achDescLocked:  { color: c.textMuted },
    unlockedBadge: {
      backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm, paddingVertical: 3,
      borderWidth: 1, borderColor: c.primaryLight,
    },
    unlockedText: { fontSize: FontSize.xs, color: c.primary, fontWeight: FontWeight.semibold },
  });
}
