import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Modal, Pressable, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft, Crown, Check, Sparkles, Camera,
  CalendarDays, MessageCircle, Zap, Lightbulb, Diamond, Rocket,
  CreditCard, Lock, X, ChevronRight,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { RootStackParamList } from '../../navigation/types';
import { subscribe } from '../../api/auth';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PRO_COLOR   = '#7C3AED';
const PRO_SURFACE = '#7C3AED18';

function getFreeFeatures(t: (key: string) => string) {
  return [
    { icon: Sparkles,       text: t('managePlan.freeFeature1') },
    { icon: Lightbulb,     text: t('managePlan.freeFeature2') },
    { icon: CalendarDays,  text: t('managePlan.freeFeature3') },
    { icon: Camera,        text: t('managePlan.freeFeature4') },
    { icon: MessageCircle, text: t('managePlan.freeFeature5') },
  ];
}

function getPremiumFeatures(t: (key: string) => string) {
  return [
    { icon: Sparkles,       text: t('managePlan.premiumFeature1') },
    { icon: Lightbulb,     text: t('managePlan.premiumFeature2') },
    { icon: CalendarDays,  text: t('managePlan.premiumFeature3') },
    { icon: Camera,        text: t('managePlan.premiumFeature4') },
    { icon: MessageCircle, text: t('managePlan.premiumFeature5') },
    { icon: Zap,           text: t('managePlan.premiumFeature6') },
    { icon: Crown,         text: t('managePlan.premiumFeature7') },
  ];
}

function getProFeatures(t: (key: string) => string) {
  return [
    { icon: Sparkles,       text: t('managePlan.proFeature1') },
    { icon: Lightbulb,     text: t('managePlan.proFeature2') },
    { icon: CalendarDays,  text: t('managePlan.proFeature3') },
    { icon: Camera,        text: t('managePlan.proFeature4') },
    { icon: MessageCircle, text: t('managePlan.proFeature5') },
    { icon: Zap,           text: t('managePlan.proFeature6') },
    { icon: Rocket,        text: t('managePlan.proFeature7') },
    { icon: Diamond,       text: t('managePlan.proFeature8') },
  ];
}

type PlanKey = 'free' | 'premium' | 'pro';

// ── Card number formatter ─────────────────────────────────────────────────────

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

function detectCardType(number: string): 'visa' | 'mastercard' | null {
  if (number.startsWith('4')) return 'visa';
  if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
  return null;
}

// ── PaymentSheet ──────────────────────────────────────────────────────────────

function CardBrand({ type }: { type: 'visa' | 'mastercard' | null }) {
  if (type === 'visa') {
    return (
      <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF', fontStyle: 'italic', letterSpacing: 1 }}>
        VISA
      </Text>
    );
  }
  if (type === 'mastercard') {
    return (
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#EB001B', opacity: 0.95 }} />
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#F79E1B', opacity: 0.95, marginLeft: -10 }} />
      </View>
    );
  }
  return <CreditCard size={26} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />;
}

function PaymentSheet({ visible, plan, price, color, onClose, onSuccess }: {
  visible: boolean;
  plan: string;
  price: string;
  color: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');
  const [name, setName]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [focused, setFocused]       = useState<string | null>(null);

  const expiryRef = useRef<TextInput>(null);
  const cvvRef    = useRef<TextInput>(null);
  const nameRef   = useRef<TextInput>(null);

  const rawCard  = cardNumber.replace(/\s/g, '');
  const cardType = detectCardType(rawCard);

  const sheetBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const inputBg  = isDark ? '#2C2C2E' : '#F8F8FA';
  const labelCol = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';
  const textCol  = isDark ? '#FFFFFF' : '#0D0D0D';
  const divCol   = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  function validate(): string | null {
    if (rawCard.length < 16)  return t('managePlan.invalidCardNumber');
    const parts = expiry.split('/');
    const mm = parseInt(parts[0] ?? '0');
    const yy = parseInt(parts[1] ?? '0');
    if (!parts[1] || mm < 1 || mm > 12 || yy < 25) return t('managePlan.invalidExpiry');
    if (cvv.length < 3)  return t('managePlan.invalidCvv');
    if (!name.trim())     return t('managePlan.enterCardholderName');
    return null;
  }

  async function handlePay() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    onSuccess();
  }

  function handleClose() {
    setCardNumber(''); setExpiry(''); setCvv(''); setName('');
    setError(''); setLoading(false); setFocused(null);
    onClose();
  }

  const segments = rawCard.padEnd(16, '').split('');
  const groups   = [0,4,8,12].map((s) =>
    segments.slice(s, s+4).map((c, i) => c || (rawCard.length > s + i ? '' : '•')).join(''),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={ps.overlay} onPress={handleClose}>
          <Pressable style={[ps.sheet, { backgroundColor: sheetBg }]} onPress={() => {}}>

            {/* Handle */}
            <View style={[ps.handle, { backgroundColor: divCol }]} />

            {/* Header row */}
            <View style={ps.header}>
              <View style={ps.headerLeft}>
                <View style={[ps.secureIcon, { backgroundColor: color + '18' }]}>
                  <Lock size={14} color={color} strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={[ps.title, { color: textCol }]}>{t('managePlan.securePayment')}</Text>
                  <Text style={[ps.subtitle, { color: labelCol }]}>{t('managePlan.sslEncryption')}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[ps.closeBtn, { backgroundColor: inputBg }]}
                onPress={handleClose} activeOpacity={0.7}
              >
                <X size={16} color={labelCol} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">

              {/* ── Card visual ── */}
              <View style={[ps.card, { backgroundColor: color }]}>
                {/* Decorative circles */}
                <View style={[ps.cardCircle1, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
                <View style={[ps.cardCircle2, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />

                {/* Top row */}
                <View style={ps.cardTop}>
                  {/* Chip */}
                  <View style={ps.chipOuter}>
                    <View style={ps.chipRow}>
                      <View style={ps.chipCell} /><View style={ps.chipCell} />
                    </View>
                    <View style={[ps.chipRow, { marginTop: 3 }]}>
                      <View style={ps.chipCell} /><View style={ps.chipCell} />
                    </View>
                  </View>
                  {/* Contactless waves */}
                  <View style={ps.contactless}>
                    {[18, 13, 8].map((s, i) => (
                      <View key={i} style={[ps.wave, { width: s, height: s, borderRadius: s/2, opacity: 0.5 - i*0.1 }]} />
                    ))}
                  </View>
                </View>

                {/* Number */}
                <View style={ps.cardNumRow}>
                  {groups.map((g, i) => (
                    <Text key={i} style={ps.cardNumGroup}>{g || '••••'}</Text>
                  ))}
                </View>

                {/* Bottom */}
                <View style={ps.cardBottomRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={ps.cardFieldLabel}>{t('managePlan.cardholderLabel')}</Text>
                    <Text style={ps.cardFieldValue} numberOfLines={1}>
                      {name || t('managePlan.nameFallback')}
                    </Text>
                  </View>
                  <View style={{ marginRight: Spacing.lg }}>
                    <Text style={ps.cardFieldLabel}>{t('managePlan.expiryLabel')}</Text>
                    <Text style={ps.cardFieldValue}>{expiry || 'MM/YY'}</Text>
                  </View>
                  <CardBrand type={cardType} />
                </View>
              </View>

              {/* ── Plan pill ── */}
              <View style={[ps.planPill, { backgroundColor: color + '14', borderColor: color + '30' }]}>
                <Text style={[ps.planPillText, { color: textCol }]}>
                  <Text style={{ color: labelCol }}>{t('managePlan.planLabel')}  </Text>
                  <Text style={{ fontWeight: FontWeight.bold }}>{plan}</Text>
                  <Text style={{ color: labelCol }}>  ·  </Text>
                  <Text style={{ color: color, fontWeight: FontWeight.extrabold }}>{price} AZN</Text>
                  <Text style={{ color: labelCol }}>{t('managePlan.perMonthShort')}</Text>
                </Text>
              </View>

              {/* ── Inputs ── */}
              <View style={[ps.inputCard, { backgroundColor: inputBg }]}>

                {/* Card number */}
                <View style={ps.inputField}>
                  <Text style={[ps.fieldLabel, { color: focused === 'card' ? color : labelCol }]}>
                    {t('managePlan.cardNumberFieldLabel')}
                  </Text>
                  <View style={ps.fieldRow}>
                    <CreditCard size={16} color={focused === 'card' ? color : labelCol} strokeWidth={2} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[ps.fieldInput, { color: textCol, flex: 1 }]}
                      placeholder="0000  0000  0000  0000"
                      placeholderTextColor={labelCol}
                      keyboardType="numeric"
                      value={cardNumber}
                      onFocus={() => setFocused('card')}
                      onBlur={() => setFocused(null)}
                      onChangeText={(t) => {
                        const formatted = formatCardNumber(t);
                        setCardNumber(formatted);
                        if (formatted.replace(/\s/g, '').length === 16) expiryRef.current?.focus();
                      }}
                      maxLength={19}
                    />
                  </View>
                  <View style={[ps.fieldUnderline, { backgroundColor: focused === 'card' ? color : divCol }]} />
                </View>

                {/* Expiry + CVV */}
                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                  <View style={[ps.inputField, { flex: 1 }]}>
                    <Text style={[ps.fieldLabel, { color: focused === 'exp' ? color : labelCol }]}>{t('managePlan.expiryFieldLabel')}</Text>
                    <TextInput
                      ref={expiryRef}
                      style={[ps.fieldInput, { color: textCol }]}
                      placeholder="MM / YY"
                      placeholderTextColor={labelCol}
                      keyboardType="numeric"
                      value={expiry}
                      onFocus={() => setFocused('exp')}
                      onBlur={() => setFocused(null)}
                      onChangeText={(t) => {
                        setExpiry(formatExpiry(t));
                        if (t.replace(/\D/g, '').length === 4) cvvRef.current?.focus();
                      }}
                      maxLength={5}
                    />
                    <View style={[ps.fieldUnderline, { backgroundColor: focused === 'exp' ? color : divCol }]} />
                  </View>

                  <View style={[ps.inputField, { flex: 1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <Text style={[ps.fieldLabel, { color: focused === 'cvv' ? color : labelCol, marginBottom: 0 }]}>CVV</Text>
                      <Lock size={10} color={focused === 'cvv' ? color : labelCol} strokeWidth={2} />
                    </View>
                    <TextInput
                      ref={cvvRef}
                      style={[ps.fieldInput, { color: textCol }]}
                      placeholder="•••"
                      placeholderTextColor={labelCol}
                      keyboardType="numeric"
                      secureTextEntry
                      value={cvv}
                      onFocus={() => setFocused('cvv')}
                      onBlur={() => setFocused(null)}
                      onChangeText={(t) => {
                        setCvv(t.replace(/\D/g, '').slice(0, 4));
                        if (t.length >= 3) nameRef.current?.focus();
                      }}
                      maxLength={4}
                    />
                    <View style={[ps.fieldUnderline, { backgroundColor: focused === 'cvv' ? color : divCol }]} />
                  </View>
                </View>

                {/* Cardholder name */}
                <View style={[ps.inputField, { marginBottom: 0 }]}>
                  <Text style={[ps.fieldLabel, { color: focused === 'name' ? color : labelCol }]}>{t('managePlan.cardholderNameFieldLabel')}</Text>
                  <TextInput
                    ref={nameRef}
                    style={[ps.fieldInput, { color: textCol }]}
                    placeholder="AD SOYAD"
                    placeholderTextColor={labelCol}
                    autoCapitalize="characters"
                    value={name}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    onChangeText={setName}
                  />
                  <View style={[ps.fieldUnderline, { backgroundColor: focused === 'name' ? color : divCol }]} />
                </View>
              </View>

              {/* Error */}
              {!!error && (
                <View style={ps.errorRow}>
                  <Text style={ps.errorText}>⚠  {error}</Text>
                </View>
              )}

              {/* Accepted cards */}
              <View style={[ps.acceptedRow, { borderColor: divCol }]}>
                <Text style={[ps.acceptedLabel, { color: labelCol }]}>{t('managePlan.acceptedLabel')}</Text>
                <View style={ps.acceptedLogos}>
                  {/* Visa */}
                  <View style={[ps.logoPill, { backgroundColor: '#1A1F71' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFFFFF', fontStyle: 'italic', letterSpacing: 0.5 }}>VISA</Text>
                  </View>
                  {/* Mastercard */}
                  <View style={[ps.logoPill, { backgroundColor: '#252525', flexDirection: 'row', alignItems: 'center', gap: 0 }]}>
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#EB001B' }} />
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#F79E1B', marginLeft: -6 }} />
                  </View>
                </View>
              </View>

              {/* Pay button */}
              <TouchableOpacity
                style={[ps.payBtn, { backgroundColor: color }, loading && { opacity: 0.8 }]}
                onPress={handlePay}
                activeOpacity={0.88}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Lock size={15} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
                    <Text style={ps.payBtnText}>{t('managePlan.payButtonPrefix')}  {price} AZN {t('managePlan.perMonthShort')}</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={[ps.cancelNote, { color: labelCol }]}>
                {t('managePlan.paymentCancelNote')}
              </Text>
              <View style={{ height: Spacing.xxl }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── PaymentSheet styles ───────────────────────────────────────────────────────

const ps = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:   {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm,
    maxHeight: '94%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18, shadowRadius: 20, elevation: 20,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  secureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: FontSize.base, fontWeight: FontWeight.bold, lineHeight: 20 },
  subtitle:   { fontSize: FontSize.xs, marginTop: 1 },
  closeBtn:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // ── Card ──
  card: {
    borderRadius: 20, padding: Spacing.base + 2,
    marginBottom: Spacing.md, minHeight: 190,
    overflow: 'hidden', justifyContent: 'space-between',
  },
  cardCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -80, right: -60 },
  cardCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, bottom: -50, left: -30 },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chipOuter: { width: 40, height: 30, borderRadius: 6, backgroundColor: '#D4AF37', padding: 5, justifyContent: 'space-between' },
  chipRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  chipCell:  { width: 13, height: 8, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.2)' },

  contactless: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: -4 },
  wave:        { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', position: 'absolute' },

  cardNumRow:   { flexDirection: 'row', justifyContent: 'space-between', marginVertical: Spacing.md },
  cardNumGroup: { fontSize: 18, fontWeight: FontWeight.bold, color: '#FFFFFF', letterSpacing: 2 },

  cardBottomRow:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  cardFieldLabel: { fontSize: 8, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, marginBottom: 3, fontWeight: FontWeight.semibold },
  cardFieldValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#FFFFFF', letterSpacing: 0.5 },

  // ── Plan pill ──
  planPill:     { borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, marginBottom: Spacing.base, alignSelf: 'center' },
  planPillText: { fontSize: FontSize.sm, letterSpacing: 0.2 },

  // ── Input card ──
  inputCard:   { borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.md, gap: 0 },
  inputField:  { marginBottom: Spacing.base + 4 },
  fieldLabel:  { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, letterSpacing: 0.5, marginBottom: 6 },
  fieldRow:    { flexDirection: 'row', alignItems: 'center' },
  fieldInput:  { fontSize: FontSize.base, paddingVertical: Spacing.xs, flex: 1 },
  fieldUnderline: { height: 1.5, marginTop: 6, borderRadius: 1 },

  // ── Error ──
  errorRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  errorText: { fontSize: FontSize.sm, color: '#EF4444', fontWeight: FontWeight.medium },

  // ── Accepted cards ──
  acceptedRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingVertical: Spacing.md, marginBottom: Spacing.base },
  acceptedLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  acceptedLogos: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  logoPill:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center', justifyContent: 'center', height: 26 },

  // ── Pay button ──
  payBtn: {
    borderRadius: BorderRadius.full, paddingVertical: Spacing.base + 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  payBtnText: { color: '#FFFFFF', fontSize: FontSize.base, fontWeight: FontWeight.extrabold, letterSpacing: 0.3 },
  cancelNote: { textAlign: 'center', fontSize: FontSize.xs, marginTop: Spacing.md, lineHeight: 18 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ManagePlanScreen() {
  const navigation = useNavigation<Nav>();
  const { user, updateSubscription } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);
  const FREE_FEATURES = getFreeFeatures(t);
  const PREMIUM_FEATURES = getPremiumFeatures(t);
  const PRO_FEATURES = getProFeatures(t);

  const isPro     = user?.isPro     ?? false;
  const isPremium = user?.isPremium ?? false;

  const currentPlan: PlanKey = isPro ? 'pro' : isPremium ? 'premium' : 'free';
  const [selected, setSelected]         = useState<PlanKey>(currentPlan);
  const [paymentPlan, setPaymentPlan]   = useState<{ plan: string; price: string; color: string } | null>(null);

  function openPayment(plan: PlanKey) {
    const isPlanPro = plan === 'pro';
    setPaymentPlan({
      plan:  isPlanPro ? 'Pro' : 'Premium',
      price: isPlanPro ? '12.99' : '3.99',
      color: isPlanPro ? PRO_COLOR : colors.primary,
    });
  }

  async function handlePaymentSuccess() {
    const plan = paymentPlan?.plan ?? '';
    const planKey = plan === 'Pro' ? 'pro' : 'premium';
    setPaymentPlan(null);
    try {
      // The server is the single source of truth for entitlement. Only unlock
      // after it confirms; on failure do NOT flip premium locally (that would be
      // a client-side bypass) — surface the error instead.
      await subscribe(planKey);
      updateSubscription(planKey);
    } catch (e: any) {
      Alert.alert(t('errors.title'), e?.message ?? t('managePlan.paymentFailed'));
      return;
    }
    Alert.alert(
      t('managePlan.paymentSuccessTitle'),
      plan === 'Pro' ? t('managePlan.proWelcome') : t('managePlan.premiumWelcome'),
      [{ text: t('managePlan.start'), onPress: () => navigation.goBack() }],
    );
  }

  function handleCancel() {
    Alert.alert(
      t('managePlan.cancelConfirmTitle'),
      t('managePlan.cancelConfirmMsg'),
      [
        { text: t('managePlan.keep'), style: 'cancel' },
        { text: t('common.cancel'), style: 'destructive', onPress: () => Alert.alert(t('managePlan.cancelledTitle'), t('managePlan.cancelledMsg')) },
      ],
    );
  }

  function PlanRadio({ plan }: { plan: PlanKey }) {
    const isSelected = selected === plan;
    const color = plan === 'pro' ? PRO_COLOR : colors.primary;
    if (!isSelected) return <View style={styles.planRadio} />;
    if (plan === 'free') return (
      <View style={[styles.planRadio, { borderColor: color, backgroundColor: colors.primarySurface }]}>
        <View style={[styles.planRadioDot, { backgroundColor: color }]} />
      </View>
    );
    return (
      <View style={[styles.planRadio, { borderColor: color, backgroundColor: color }]}>
        <Check size={12} color="#fff" strokeWidth={3} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('managePlan.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Current Plan */}
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanLeft}>
            <Text style={styles.currentPlanLabel}>{t('managePlan.currentPlan')}</Text>
            <View style={styles.currentPlanBadge}>
              {isPro && <Diamond size={14} color={PRO_COLOR} strokeWidth={2} />}
              {isPremium && !isPro && <Crown size={14} color={colors.warning} strokeWidth={2} />}
              <Text style={[
                styles.currentPlanName,
                isPro && { color: PRO_COLOR },
                isPremium && !isPro && { color: colors.premiumBg },
              ]}>
                {isPro ? 'Pro' : isPremium ? 'Premium' : t('managePlan.free')}
              </Text>
            </View>
            {(isPremium || isPro) && (
              <Text style={styles.renewText}>{t('managePlan.renewDate')} · {isPro ? '12.99' : '3.99'} AZN</Text>
            )}
          </View>
          {(isPremium || isPro) && (
            <View style={[styles.activeChip, isPro && { backgroundColor: PRO_SURFACE }]}>
              <View style={[styles.activeDot, isPro && { backgroundColor: PRO_COLOR }]} />
              <Text style={[styles.activeText, isPro && { color: PRO_COLOR }]}>{t('managePlan.active')}</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t('managePlan.choosePlan')}</Text>

        {/* FREE */}
        <TouchableOpacity
          style={[styles.planCard, selected === 'free' && styles.planCardSelected]}
          onPress={() => setSelected('free')}
          activeOpacity={0.85}
        >
          <View style={styles.planCardHeader}>
            <View style={styles.planTitleCol}>
              <Text style={styles.planName}>{t('managePlan.free')}</Text>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>0</Text>
                <Text style={styles.planPriceCurrency}>{t('managePlan.perMonthCurrency')}</Text>
              </View>
            </View>
            <PlanRadio plan="free" />
          </View>
          <View style={styles.planFeatures}>
            {FREE_FEATURES.map((f, i) => (
              <FeatureRow key={i} icon={f.icon} text={f.text} colors={colors} />
            ))}
          </View>
        </TouchableOpacity>

        {/* PREMIUM */}
        <TouchableOpacity
          style={[styles.planCard, styles.planCardPremium, selected === 'premium' && styles.planCardSelected]}
          onPress={() => setSelected('premium')}
          activeOpacity={0.85}
        >
          <View style={styles.popularChip}>
            <Text style={styles.popularChipText}>{t('managePlan.mostPopular')}</Text>
          </View>
          <View style={styles.planCardHeader}>
            <View style={styles.planTitleCol}>
              <View style={styles.premiumNameRow}>
                <Crown size={16} color={colors.warning} strokeWidth={2} />
                <Text style={styles.planName}>Premium</Text>
              </View>
              <View style={styles.planPriceRow}>
                <Text style={[styles.planPrice, { color: colors.primary }]}>3.99</Text>
                <Text style={styles.planPriceCurrency}>{t('managePlan.perMonthCurrency')}</Text>
              </View>
            </View>
            <PlanRadio plan="premium" />
          </View>
          <View style={styles.planFeatures}>
            {PREMIUM_FEATURES.map((f, i) => (
              <FeatureRow key={i} icon={f.icon} text={f.text} accent={colors.primary} colors={colors} />
            ))}
          </View>
        </TouchableOpacity>

        {/* PRO */}
        <TouchableOpacity
          style={[styles.planCard, styles.planCardPro, selected === 'pro' && styles.planCardSelectedPro]}
          onPress={() => setSelected('pro')}
          activeOpacity={0.85}
        >
          <View style={styles.bestValueChip}>
            <Diamond size={10} color={PRO_COLOR} strokeWidth={2.5} />
            <Text style={styles.bestValueText}>{t('managePlan.bestValue')}</Text>
          </View>
          <View style={styles.planCardHeader}>
            <View style={styles.planTitleCol}>
              <View style={styles.premiumNameRow}>
                <Diamond size={16} color={PRO_COLOR} strokeWidth={2} />
                <Text style={[styles.planName, { color: PRO_COLOR }]}>Pro</Text>
              </View>
              <View style={styles.planPriceRow}>
                <Text style={[styles.planPrice, { color: PRO_COLOR }]}>12.99</Text>
                <Text style={styles.planPriceCurrency}>{t('managePlan.perMonthCurrency')}</Text>
              </View>
            </View>
            <PlanRadio plan="pro" />
          </View>
          <View style={styles.planFeatures}>
            {PRO_FEATURES.map((f, i) => (
              <FeatureRow key={i} icon={f.icon} text={f.text} accent={PRO_COLOR} colors={colors} />
            ))}
          </View>
        </TouchableOpacity>

        {/* CTA buttons */}
        {currentPlan === 'free' && selected === 'premium' && (
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => openPayment('premium')} activeOpacity={0.85}>
            <Crown size={18} color="#fff" strokeWidth={2} />
            <Text style={styles.upgradeBtnText}>{t('managePlan.switchToPremiumLabel')} — 3.99 AZN{t('managePlan.perMonthShort')}</Text>
            <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {(currentPlan === 'free' || currentPlan === 'premium') && selected === 'pro' && (
          <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: PRO_COLOR }]} onPress={() => openPayment('pro')} activeOpacity={0.85}>
            <Diamond size={18} color="#fff" strokeWidth={2} />
            <Text style={styles.upgradeBtnText}>{t('managePlan.switchToProLabel')} — 12.99 AZN{t('managePlan.perMonthShort')}</Text>
            <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {currentPlan === 'premium' && selected === 'free' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
            <Text style={styles.cancelBtnText}>{t('managePlan.cancelSubscription')}</Text>
          </TouchableOpacity>
        )}

        {(isPremium || isPro) && selected === currentPlan && (
          <View style={styles.actionsGroup}>
            <View style={[styles.upgradeBtn, { backgroundColor: isPro ? PRO_COLOR : colors.primary }]}>
              <Check size={18} color="#fff" strokeWidth={2.5} />
              <Text style={styles.upgradeBtnText}>{isPro ? t('managePlan.onProPlan') : t('managePlan.onPremiumPlan')}</Text>
            </View>
            <TouchableOpacity style={styles.cancelBtnOutline} onPress={handleCancel} activeOpacity={0.85}>
              <Text style={styles.cancelBtnText}>{t('managePlan.cancelSubscription')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.disclaimer}>
          {t('managePlan.disclaimer')}
        </Text>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Payment Sheet */}
      {paymentPlan && (
        <PaymentSheet
          visible={!!paymentPlan}
          plan={paymentPlan.plan}
          price={paymentPlan.price}
          color={paymentPlan.color}
          onClose={() => setPaymentPlan(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </SafeAreaView>
  );
}

// ── FeatureRow ────────────────────────────────────────────────────────────────

function FeatureRow({ icon: Icon, text, accent, colors }: { icon: any; text: string; accent?: string; colors: AppColors }) {
  const color = accent ?? colors.textSecondary;
  return (
    <View style={featureStyles.row}>
      <View style={[featureStyles.iconWrap, { backgroundColor: accent ? accent + '18' : colors.borderLight }]}>
        <Icon size={14} color={color} strokeWidth={2} />
      </View>
      <Text style={[featureStyles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  text:     { fontSize: FontSize.sm, flex: 1 },
});

// ── Screen styles ─────────────────────────────────────────────────────────────

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
    scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.base },

    currentPlanCard: {
      backgroundColor: c.card, borderRadius: BorderRadius.xl,
      padding: Spacing.base, flexDirection: 'row',
      justifyContent: 'space-between', alignItems: 'center',
      ...Shadow.sm, borderWidth: 1, borderColor: c.borderLight,
    },
    currentPlanLeft:  { gap: 4 },
    currentPlanLabel: { fontSize: FontSize.xs, color: c.textMuted },
    currentPlanBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    currentPlanName:  { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: c.text },
    renewText:        { fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 },
    activeChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.primarySurface,
      paddingHorizontal: Spacing.sm, paddingVertical: 5,
      borderRadius: BorderRadius.full,
    },
    activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.primary },
    activeText: { fontSize: FontSize.xs, color: c.primary, fontWeight: FontWeight.semibold },

    sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text },

    planCard: {
      backgroundColor: c.card, borderRadius: BorderRadius.xl,
      padding: Spacing.base, ...Shadow.sm,
      borderWidth: 2, borderColor: c.borderLight,
    },
    planCardPremium:     { borderColor: c.primaryLight + '44' },
    planCardPro:         { borderColor: PRO_COLOR + '44' },
    planCardSelected:    { borderColor: c.primary },
    planCardSelectedPro: { borderColor: PRO_COLOR },

    popularChip: {
      backgroundColor: c.primarySurface, alignSelf: 'flex-start',
      paddingHorizontal: Spacing.sm, paddingVertical: 3,
      borderRadius: BorderRadius.full, marginBottom: Spacing.sm,
    },
    popularChipText: { fontSize: FontSize.xs, color: c.primary, fontWeight: FontWeight.bold },

    bestValueChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: PRO_SURFACE, alignSelf: 'flex-start',
      paddingHorizontal: Spacing.sm, paddingVertical: 3,
      borderRadius: BorderRadius.full, marginBottom: Spacing.sm,
    },
    bestValueText: { fontSize: FontSize.xs, color: PRO_COLOR, fontWeight: FontWeight.bold },

    planCardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
    planTitleCol:      { gap: 4 },
    planName:          { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: c.text },
    premiumNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
    planPriceRow:      { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
    planPrice:         { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.textSecondary },
    planPriceCurrency: { fontSize: FontSize.xs, color: c.textMuted },

    planRadio: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center',
    },
    planRadioDot: { width: 10, height: 10, borderRadius: 5 },
    planFeatures: { gap: Spacing.sm },

    actionsGroup: { gap: Spacing.sm },
    upgradeBtn: {
      backgroundColor: c.primary, borderRadius: BorderRadius.full,
      paddingVertical: Spacing.md,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      ...Shadow.sm,
    },
    upgradeBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#fff' },
    cancelBtn: {
      borderWidth: 1, borderColor: c.error,
      borderRadius: BorderRadius.full, paddingVertical: Spacing.md,
      alignItems: 'center', justifyContent: 'center',
    },
    cancelBtnOutline: {
      borderWidth: 1, borderColor: c.error,
      borderRadius: BorderRadius.full, paddingVertical: Spacing.md,
      alignItems: 'center', justifyContent: 'center',
    },
    cancelBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.error },

    disclaimer: {
      fontSize: FontSize.xs, color: c.textMuted,
      textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.lg,
    },
  });
}
