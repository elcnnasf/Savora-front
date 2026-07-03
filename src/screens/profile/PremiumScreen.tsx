import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Crown, Check, Star, Sparkles, X } from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

export default function PremiumScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);
  const [selected, setSelected] = useState<string>('annual');

  const FEATURES = [
    t('premiumScreen.feature1'),
    t('premiumScreen.feature2'),
    t('premiumScreen.feature3'),
    t('premiumScreen.feature4'),
    t('premiumScreen.feature5'),
    t('premiumScreen.feature6'),
    t('premiumScreen.feature7'),
    t('premiumScreen.feature8'),
  ];

  const PLANS = [
    { id: 'monthly', label: t('premiumScreen.monthly'), price: '$9.99', period: '/mo', badge: null },
    { id: 'annual',  label: t('premiumScreen.annual'),  price: '$59.99', period: '/yr', badge: t('premiumScreen.saveBadge') },
  ];

  const REVIEWS = [
    { name: t('premiumScreen.review1Name'), stars: 5, text: t('premiumScreen.review1Text') },
    { name: t('premiumScreen.review2Name'), stars: 5, text: t('premiumScreen.review2Text') },
    { name: t('premiumScreen.review3Name'), stars: 5, text: t('premiumScreen.review3Text') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <X size={20} color={colors.textMuted} strokeWidth={2.5} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.crownWrap}>
            <Crown size={40} color={colors.premiumGold} strokeWidth={1.5} />
          </View>
          <Text style={styles.heroTitle}>{t('premiumScreen.title')}</Text>
          <Text style={styles.heroSub}>{t('premiumScreen.subtitle')}</Text>
        </View>

        {/* Feature list */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <Check size={12} color={colors.textInverse} strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View style={styles.planRow}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selected === plan.id && styles.planCardSelected]}
              onPress={() => setSelected(plan.id)}
              activeOpacity={0.8}
            >
              {plan.badge && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              )}
              <Text style={[styles.planLabel, selected === plan.id && styles.planLabelSelected]}>
                {plan.label}
              </Text>
              <Text style={[styles.planPrice, selected === plan.id && styles.planPriceSelected]}>
                {plan.price}
              </Text>
              <Text style={[styles.planPeriod, selected === plan.id && styles.planPeriodSelected]}>
                {plan.period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85}>
          <Sparkles size={18} color={colors.textInverse} strokeWidth={2} />
          <Text style={styles.ctaText}>
            {t('premiumScreen.startPremium')} — {selected === 'annual' ? '$59.99/yr' : '$9.99/mo'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.ctaNote}>{t('premiumScreen.trialNote')}</Text>

        {/* Social proof */}
        <View style={styles.socialProof}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={16} color={colors.premiumGold} fill={colors.premiumGold} strokeWidth={0} />
            ))}
          </View>
          <Text style={styles.socialRating}>{t('premiumScreen.ratingNote')}</Text>
        </View>

        {/* Reviews */}
        {REVIEWS.map((r) => (
          <View key={r.name} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewAvatar}>
                <Text style={styles.reviewAvatarText}>{r.name[0]}</Text>
              </View>
              <View>
                <Text style={styles.reviewName}>{r.name}</Text>
                <View style={styles.reviewStars}>
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star key={i} size={12} color={colors.premiumGold} fill={colors.premiumGold} strokeWidth={0} />
                  ))}
                </View>
              </View>
            </View>
            <Text style={styles.reviewText}>{r.text}</Text>
          </View>
        ))}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    closeBtn: {
      position: 'absolute', top: 52, right: Spacing.base, zIndex: 10,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    },
    scroll:   { padding: Spacing.base, gap: Spacing.lg },
    hero:     { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xl },
    crownWrap: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: c.premiumGold + '18',
      alignItems: 'center', justifyContent: 'center',
    },
    heroTitle: { fontSize: FontSize.display, fontWeight: FontWeight.extrabold, color: c.text },
    heroSub:   { fontSize: FontSize.base, color: c.textSecondary, textAlign: 'center' },

    featuresCard: {
      backgroundColor: c.card, borderRadius: BorderRadius.lg,
      padding: Spacing.base, gap: Spacing.md, ...Shadow.sm,
    },
    featureRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    checkCircle: {
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    featureText: { fontSize: FontSize.base, color: c.text, flex: 1 },

    planRow:  { flexDirection: 'row', gap: Spacing.md },
    planCard: {
      flex: 1, backgroundColor: c.card, borderRadius: BorderRadius.lg,
      padding: Spacing.md, alignItems: 'center', gap: 4,
      borderWidth: 2, borderColor: c.border, position: 'relative', ...Shadow.sm,
    },
    planCardSelected: { borderColor: c.primary, backgroundColor: c.primarySurface },
    planBadge: {
      position: 'absolute', top: -12,
      backgroundColor: c.primary, borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm, paddingVertical: 3,
    },
    planBadgeText:     { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.textInverse },
    planLabel:         { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: c.textSecondary },
    planLabelSelected: { color: c.primary },
    planPrice:         { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: c.text },
    planPriceSelected: { color: c.primary },
    planPeriod:        { fontSize: FontSize.xs, color: c.textMuted },
    planPeriodSelected: { color: c.primaryLight },

    ctaBtn: {
      backgroundColor: c.primary, borderRadius: BorderRadius.full,
      paddingVertical: Spacing.base + 2, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      ...Shadow.md,
    },
    ctaText:   { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: c.textInverse },
    ctaNote:   { textAlign: 'center', fontSize: FontSize.xs, color: c.textMuted },

    socialProof: { alignItems: 'center', gap: Spacing.xs },
    starsRow:    { flexDirection: 'row', gap: 2 },
    socialRating: { fontSize: FontSize.sm, color: c.textSecondary },

    reviewCard: {
      backgroundColor: c.card, borderRadius: BorderRadius.lg,
      padding: Spacing.base, gap: Spacing.sm, ...Shadow.sm,
    },
    reviewHeader:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    reviewAvatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    reviewAvatarText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.textInverse },
    reviewName:       { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.text },
    reviewStars:      { flexDirection: 'row', gap: 2 },
    reviewText:       { fontSize: FontSize.sm, color: c.textSecondary, lineHeight: FontSize.sm * 1.6 },
  });
}
