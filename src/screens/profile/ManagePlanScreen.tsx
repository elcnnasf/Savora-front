import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Crown, Check, Sparkles, Camera, CalendarDays, MessageCircle, Zap } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FREE_FEATURES = [
  { icon: Sparkles, text: '4 AI recipe requests / day' },
  { icon: CalendarDays, text: '1 meal plan / week' },
  { icon: Camera, text: '4 ingredient scans / day' },
  { icon: MessageCircle, text: '10 AI chat messages / day' },
];

const PREMIUM_FEATURES = [
  { icon: Sparkles, text: '10 AI recipe requests / day' },
  { icon: CalendarDays, text: 'Unlimited meal plans' },
  { icon: Camera, text: '10 ingredient scans / day' },
  { icon: MessageCircle, text: '50 AI chat messages / day' },
  { icon: Zap, text: 'Personalized nutrition insights' },
  { icon: Crown, text: 'Priority AI responses' },
];

export default function ManagePlanScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const isPremium = user?.isPremium ?? false;
  const [selected, setSelected] = useState<'free' | 'premium'>(isPremium ? 'premium' : 'free');

  const handleUpgrade = () => {
    Alert.alert(
      'Upgrade to Premium',
      'You will be charged 3.99 AZN/month. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', style: 'default', onPress: () => Alert.alert('Success', 'Welcome to Savora Premium! 🎉') },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your Premium subscription? You will lose access to premium features at the end of the billing period.',
      [
        { text: 'Keep Premium', style: 'cancel' },
        { text: 'Cancel Subscription', style: 'destructive', onPress: () => Alert.alert('Cancelled', 'Your subscription has been cancelled.') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={Colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Current Plan */}
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanLeft}>
            <Text style={styles.currentPlanLabel}>Current Plan</Text>
            <View style={styles.currentPlanBadge}>
              {isPremium && <Crown size={14} color={Colors.warning} strokeWidth={2} />}
              <Text style={[styles.currentPlanName, isPremium && styles.currentPlanNamePremium]}>
                {isPremium ? 'Premium' : 'Free'}
              </Text>
            </View>
            {isPremium && (
              <Text style={styles.renewText}>Renews on July 24, 2026 · 3.99 AZN</Text>
            )}
          </View>
          {isPremium && (
            <View style={styles.activeChip}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
        </View>

        {/* Plan Cards */}
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>

        {/* Free Plan */}
        <TouchableOpacity
          style={[styles.planCard, selected === 'free' && styles.planCardSelected]}
          onPress={() => setSelected('free')}
          activeOpacity={0.85}
        >
          <View style={styles.planCardHeader}>
            <View style={styles.planTitleRow}>
              <Text style={styles.planName}>Free</Text>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>0</Text>
                <Text style={styles.planPriceCurrency}>AZN/month</Text>
              </View>
            </View>
            <View style={[styles.planRadio, selected === 'free' && styles.planRadioSelected]}>
              {selected === 'free' && <View style={styles.planRadioDot} />}
            </View>
          </View>
          <View style={styles.planFeatures}>
            {FREE_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIconWrap}>
                    <Icon size={14} color={Colors.textSecondary} strokeWidth={2} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              );
            })}
          </View>
        </TouchableOpacity>

        {/* Premium Plan */}
        <TouchableOpacity
          style={[styles.planCard, styles.planCardPremium, selected === 'premium' && styles.planCardSelected]}
          onPress={() => setSelected('premium')}
          activeOpacity={0.85}
        >
          <View style={styles.popularChip}>
            <Text style={styles.popularChipText}>Most Popular</Text>
          </View>
          <View style={styles.planCardHeader}>
            <View style={styles.planTitleRow}>
              <View style={styles.premiumNameRow}>
                <Crown size={16} color={Colors.warning} strokeWidth={2} />
                <Text style={styles.planName}>Premium</Text>
              </View>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPricePremium}>3.99</Text>
                <Text style={styles.planPriceCurrencyPremium}>AZN/month</Text>
              </View>
            </View>
            <View style={[styles.planRadio, selected === 'premium' && styles.planRadioSelectedPremium]}>
              {selected === 'premium' && <Check size={12} color={Colors.textInverse} strokeWidth={3} />}
            </View>
          </View>
          <View style={styles.planFeatures}>
            {PREMIUM_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureIconWrap, styles.featureIconWrapPremium]}>
                    <Icon size={14} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              );
            })}
          </View>
        </TouchableOpacity>

        {/* CTA */}
        {!isPremium && (
          <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.85}>
            <Crown size={18} color={Colors.textInverse} strokeWidth={2} />
            <Text style={styles.upgradeBtnText}>Upgrade to Premium — 3.99 AZN/month</Text>
          </TouchableOpacity>
        )}

        {isPremium && (
          <View style={styles.actionsGroup}>
            <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.85}>
              <Check size={18} color={Colors.textInverse} strokeWidth={2.5} />
              <Text style={styles.upgradeBtnText}>You're on Premium ✓</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
              <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.disclaimer}>
          Subscriptions are billed monthly. Cancel anytime before the renewal date.
        </Text>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.base },

  currentPlanCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.base, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    ...Shadow.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  currentPlanLeft: { gap: 4 },
  currentPlanLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  currentPlanBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  currentPlanName: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  currentPlanNamePremium: { color: Colors.premiumBg },
  renewText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  activeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
  activeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },

  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },

  planCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.base, ...Shadow.sm,
    borderWidth: 2, borderColor: Colors.borderLight,
  },
  planCardPremium: { borderColor: Colors.primaryLight + '44' },
  planCardSelected: { borderColor: Colors.primary },
  popularChip: {
    backgroundColor: Colors.primarySurface,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  popularChipText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold },
  planCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  planTitleRow: { gap: 4 },
  planName: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.text },
  premiumNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  planPrice: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  planPricePremium: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  planPriceCurrency: { fontSize: FontSize.xs, color: Colors.textMuted },
  planPriceCurrencyPremium: { fontSize: FontSize.xs, color: Colors.textMuted },
  planRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  planRadioSelected: { borderColor: Colors.primary, backgroundColor: Colors.primarySurface },
  planRadioSelectedPremium: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  planRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  planFeatures: { gap: Spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featureIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  featureIconWrapPremium: { backgroundColor: Colors.primarySurface },
  featureText: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },

  actionsGroup: { gap: Spacing.sm },
  upgradeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...Shadow.sm,
  },
  upgradeBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textInverse },
  cancelBtn: {
    borderWidth: 1, borderColor: Colors.error,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.error },

  disclaimer: {
    fontSize: FontSize.xs, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 18,
    paddingHorizontal: Spacing.lg,
  },
});
