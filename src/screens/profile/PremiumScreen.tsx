import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Crown, Check, Star, Sparkles, X } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';

const FEATURES = [
  'Unlimited AI recipe generation',
  'Unlimited AI meal planning',
  'Advanced nutrition tracking',
  'Smart ingredient scanning (unlimited)',
  'Personalized weekly reports',
  'Priority customer support',
  'Ad-free experience',
  'Early access to new features',
];

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '$9.99', period: '/mo', badge: null },
  { id: 'annual', label: 'Annual', price: '$59.99', period: '/yr', badge: 'Save 50%' },
];

const REVIEWS = [
  { name: 'Sarah M.', stars: 5, text: 'The AI meal planning alone is worth every penny. My family eats so much better now.' },
  { name: 'James T.', stars: 5, text: 'Best cooking app I\'ve ever used. The recipe suggestions are always spot-on.' },
  { name: 'Priya K.', stars: 5, text: 'Ingredient scanning saved me from so much food waste. Absolutely love it!' },
];

export default function PremiumScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<string>('annual');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Close */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <X size={20} color={Colors.textMuted} strokeWidth={2.5} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.crownWrap}>
            <Crown size={40} color={Colors.premiumGold} strokeWidth={1.5} />
          </View>
          <Text style={styles.heroTitle}>Savora Premium</Text>
          <Text style={styles.heroSub}>Unlock the full power of AI cooking.</Text>
        </View>

        {/* Feature list */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <Check size={12} color={Colors.textInverse} strokeWidth={3} />
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
          <Sparkles size={18} color={Colors.textInverse} strokeWidth={2} />
          <Text style={styles.ctaText}>
            Start Premium — {selected === 'annual' ? '$59.99/yr' : '$9.99/mo'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.ctaNote}>7-day free trial · Cancel anytime</Text>

        {/* Social proof — audit fix M11 */}
        <View style={styles.socialProof}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={16} color={Colors.premiumGold} fill={Colors.premiumGold} strokeWidth={0} />
            ))}
          </View>
          <Text style={styles.socialRating}>4.9 / 5 · Over 12,000 Premium members</Text>
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
                    <Star key={i} size={12} color={Colors.premiumGold} fill={Colors.premiumGold} strokeWidth={0} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  closeBtn: {
    position: 'absolute', top: 52, right: Spacing.base, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: Spacing.base, gap: Spacing.lg },
  hero: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xl },
  crownWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.premiumGold + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: FontSize.display, fontWeight: FontWeight.extrabold, color: Colors.text },
  heroSub: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center' },
  featuresCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.base, gap: Spacing.md, ...Shadow.sm,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  checkCircle: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { fontSize: FontSize.base, color: Colors.text, flex: 1 },
  planRow: { flexDirection: 'row', gap: Spacing.md },
  planCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 4,
    borderWidth: 2, borderColor: Colors.border, position: 'relative', ...Shadow.sm,
  },
  planCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primarySurface },
  planBadge: {
    position: 'absolute', top: -12,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  planBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textInverse },
  planLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  planLabelSelected: { color: Colors.primary },
  planPrice: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  planPriceSelected: { color: Colors.primary },
  planPeriod: { fontSize: FontSize.xs, color: Colors.textMuted },
  planPeriodSelected: { color: Colors.primaryLight },
  ctaBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base + 2, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    ...Shadow.md,
  },
  ctaText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textInverse },
  ctaNote: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted },
  socialProof: { alignItems: 'center', gap: Spacing.xs },
  starsRow: { flexDirection: 'row', gap: 2 },
  socialRating: { fontSize: FontSize.sm, color: Colors.textSecondary },
  reviewCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.base, gap: Spacing.sm, ...Shadow.sm,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  reviewAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textInverse },
  reviewName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: FontSize.sm * 1.6 },
});
