import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import {
  ChevronLeft, Camera, Image as ImageIcon, PenLine, Flame, Crown,
  Sparkles, RefreshCw, Beef, Wheat, Droplets, Leaf, Candy, Waves,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { analyzeCalories, CalorieAnalysis } from '../../api/ai';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = 'photo' | 'text';

export default function CalorieCounterScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  const styles = makeStyles(colors);

  const isAdmin = user?.email === 'savorachef@gmail.com';
  const canUse = isAdmin || user?.isPremium || user?.isPro;

  const [mode, setMode] = useState<Mode>('photo');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageRatio, setImageRatio] = useState(4 / 3);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [portion, setPortion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalorieAnalysis | null>(null);

  // Clamp so extreme panoramas / portraits don't blow up the layout
  const clampRatio = (r: number) => Math.min(Math.max(r, 0.75), 1.9);

  async function handleImage(asset: ImagePicker.ImagePickerAsset) {
    // Show the picked photo immediately — the downscale below can take a few
    // seconds on large photos and must not leave the screen looking dead
    setResult(null);
    setImageBase64(null);
    setImageRatio(clampRatio(asset.width && asset.height ? asset.width / asset.height : 4 / 3));
    setImageUri(asset.uri);
    setPreparing(true);
    try {
      // Same downscale as ScanScreen: 1280px / 70% JPEG keeps uploads small
      // while leaving plenty of detail for the vision model
      const out = await manipulateAsync(
        asset.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true },
      );
      if (!out.base64) throw new Error('no base64');
      // Preview the converted JPEG — renders reliably even when the original
      // is a format RN Image struggles with (e.g. HEIC)
      setImageUri(out.uri);
      if (out.width && out.height) setImageRatio(clampRatio(out.width / out.height));
      setImageBase64(out.base64);
    } catch {
      setImageUri(null);
      Alert.alert(t('errors.title'), t('calorieCounter.imageFailed'));
    } finally {
      setPreparing(false);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('errors.permissionRequired'), t('errors.permissionRequiredMsg'));
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false });
    if (!res.canceled && res.assets[0]) await handleImage(res.assets[0]);
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('errors.permissionRequired'), t('errors.permissionRequiredMsg'));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled && res.assets[0]) await handleImage(res.assets[0]);
  }

  async function analyze() {
    const params =
      mode === 'photo'
        ? imageBase64
          ? { image_base64: imageBase64, language: lang }
          : null
        : foodName.trim()
          ? { food_name: foodName.trim(), portion: portion.trim() || undefined, language: lang }
          : null;
    if (!params) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeCalories(params);
      setResult(res.data);
    } catch (err: any) {
      Alert.alert(t('errors.title'), err?.message ?? t('calorieCounter.analyzeFailed'));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setImageUri(null);
    setImageBase64(null);
    setFoodName('');
    setPortion('');
  }

  const canAnalyze = mode === 'photo' ? !!imageBase64 : foodName.trim().length > 0;

  // ── Paywall for free users ────────────────────────────────
  if (!canUse) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('calorieCounter.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.paywall}>
          <View style={styles.paywallIcon}>
            <Crown size={40} color={colors.premiumGold} strokeWidth={1.5} />
          </View>
          <Text style={styles.paywallTitle}>{t('calorieCounter.premiumTitle')}</Text>
          <Text style={styles.paywallDesc}>{t('calorieCounter.premiumDesc')}</Text>

          <View style={styles.paywallFeatures}>
            {[t('calorieCounter.feature1'), t('calorieCounter.feature2'), t('calorieCounter.feature3')].map((f) => (
              <View key={f} style={styles.paywallFeatureRow}>
                <Sparkles size={15} color={colors.primary} strokeWidth={2} />
                <Text style={styles.paywallFeatureText}>{f}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => navigation.navigate('ManagePlan')}
            activeOpacity={0.9}
          >
            <Crown size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.upgradeBtnText}>{t('calorieCounter.upgradeBtn')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main (premium/pro) ────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('calorieCounter.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Mode toggle */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'photo' && styles.modeBtnActive]}
              onPress={() => { setMode('photo'); setResult(null); }}
              activeOpacity={0.8}
            >
              <Camera size={16} color={mode === 'photo' ? colors.textInverse : colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.modeBtnText, mode === 'photo' && styles.modeBtnTextActive]}>
                {t('calorieCounter.photoMode')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'text' && styles.modeBtnActive]}
              onPress={() => { setMode('text'); setResult(null); }}
              activeOpacity={0.8}
            >
              <PenLine size={16} color={mode === 'text' ? colors.textInverse : colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.modeBtnText, mode === 'text' && styles.modeBtnTextActive]}>
                {t('calorieCounter.textMode')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input */}
          {mode === 'photo' ? (
            <>
              {imageUri ? (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: imageUri }} style={[styles.preview, { aspectRatio: imageRatio }]} resizeMode="cover" />
                  {preparing && (
                    <View style={styles.previewOverlay}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
                  <TouchableOpacity style={styles.retakeBtn} onPress={reset} activeOpacity={0.85}>
                    <RefreshCw size={14} color={colors.text} strokeWidth={2} />
                    <Text style={styles.retakeBtnText}>{t('calorieCounter.retake')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Flame size={36} color={colors.textMuted} strokeWidth={1.5} />
                  <Text style={styles.photoPlaceholderText}>{t('calorieCounter.photoHint')}</Text>
                </View>
              )}
              <View style={styles.photoBtnRow}>
                <TouchableOpacity style={styles.photoBtn} onPress={takePhoto} activeOpacity={0.85}>
                  <Camera size={18} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.photoBtnText}>{t('calorieCounter.takePhoto')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery} activeOpacity={0.85}>
                  <ImageIcon size={18} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.photoBtnText}>{t('calorieCounter.fromGallery')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>{t('calorieCounter.foodNameLabel')}</Text>
              <TextInput
                style={styles.input}
                value={foodName}
                onChangeText={(v) => { setFoodName(v); setResult(null); }}
                placeholder={t('calorieCounter.foodNamePlaceholder')}
                placeholderTextColor={colors.textMuted}
                maxLength={200}
              />
              <Text style={styles.sectionLabel}>{t('calorieCounter.portionLabel')}</Text>
              <TextInput
                style={styles.input}
                value={portion}
                onChangeText={(v) => { setPortion(v); setResult(null); }}
                placeholder={t('calorieCounter.portionPlaceholder')}
                placeholderTextColor={colors.textMuted}
                maxLength={100}
              />
            </>
          )}

          {/* Analyze */}
          <TouchableOpacity
            style={[styles.analyzeBtn, (!canAnalyze || loading) && styles.btnDisabled]}
            onPress={analyze}
            disabled={!canAnalyze || loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color={colors.textInverse} />
                <Text style={styles.analyzeBtnText}>{t('calorieCounter.analyzing')}</Text>
              </>
            ) : (
              <>
                <Sparkles size={18} color={colors.textInverse} strokeWidth={2} />
                <Text style={styles.analyzeBtnText}>{t('calorieCounter.analyze')}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Result */}
          {result && !result.food_detected && (
            <View style={styles.noFoodCard}>
              <Text style={styles.noFoodText}>{t('calorieCounter.noFood')}</Text>
            </View>
          )}

          {result?.food_detected && result.total && (
            <View style={styles.resultCard}>
              <Text style={styles.resultDish}>{result.dish_name}</Text>
              {!!result.portion && <Text style={styles.resultPortion}>{result.portion}</Text>}

              <View style={styles.calorieRow}>
                <Flame size={28} color={colors.warning} strokeWidth={2} />
                <Text style={styles.calorieValue}>{result.total.calories}</Text>
                <Text style={styles.calorieUnit}>kcal</Text>
              </View>

              <View style={styles.macroGrid}>
                {[
                  { icon: Beef,     label: t('calorieCounter.protein'), value: `${result.total.protein} g`,  color: '#EF4444' },
                  { icon: Wheat,    label: t('calorieCounter.carbs'),   value: `${result.total.carbs} g`,    color: '#F59E0B' },
                  { icon: Droplets, label: t('calorieCounter.fat'),     value: `${result.total.fat} g`,      color: '#3B82F6' },
                  { icon: Leaf,     label: t('calorieCounter.fiber'),   value: `${result.total.fiber} g`,    color: '#16A34A' },
                  { icon: Candy,    label: t('calorieCounter.sugar'),   value: `${result.total.sugar} g`,    color: '#EC4899' },
                  { icon: Waves,    label: t('calorieCounter.sodium'),  value: `${result.total.sodium} mg`,  color: '#8B5CF6' },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <View key={m.label} style={styles.macroItem}>
                      <View style={[styles.macroIcon, { backgroundColor: m.color + '18' }]}>
                        <Icon size={16} color={m.color} strokeWidth={2} />
                      </View>
                      <Text style={styles.macroValue}>{m.value}</Text>
                      <Text style={styles.macroLabel}>{m.label}</Text>
                    </View>
                  );
                })}
              </View>

              {(result.items?.length ?? 0) > 0 && (
                <>
                  <Text style={styles.breakdownTitle}>{t('calorieCounter.breakdown')}</Text>
                  {result.items!.map((item, i) => (
                    <View key={`${item.name}-${i}`} style={styles.breakdownRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.breakdownName} numberOfLines={1}>{item.name}</Text>
                        {!!item.amount && <Text style={styles.breakdownAmount}>{item.amount}</Text>}
                      </View>
                      <Text style={styles.breakdownKcal}>{item.calories} kcal</Text>
                    </View>
                  ))}
                </>
              )}

              {!!result.note && <Text style={styles.resultNote}>{result.note}</Text>}

              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceLabel}>{t('calorieCounter.confidence')}:</Text>
                <Text style={styles.confidenceValue}>
                  {t(`calorieCounter.confidence_${result.confidence ?? 'medium'}`)}
                </Text>
              </View>

              <TouchableOpacity style={styles.newBtn} onPress={reset} activeOpacity={0.85}>
                <RefreshCw size={16} color={colors.primary} strokeWidth={2} />
                <Text style={styles.newBtnText}>{t('calorieCounter.newAnalysis')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },

  // Paywall
  paywall: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  paywallIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  paywallTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: c.text, textAlign: 'center' },
  paywallDesc: { fontSize: FontSize.sm, color: c.textSecondary, textAlign: 'center', lineHeight: FontSize.sm * 1.6 },
  paywallFeatures: { alignSelf: 'stretch', gap: Spacing.sm, marginVertical: Spacing.md },
  paywallFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  paywallFeatureText: { fontSize: FontSize.sm, color: c.text, flex: 1 },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1F2937', borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base, paddingHorizontal: Spacing.xl, alignSelf: 'stretch',
  },
  upgradeBtnText: { color: '#FFFFFF', fontSize: FontSize.md, fontWeight: FontWeight.bold },

  // Mode toggle
  modeRow: {
    flexDirection: 'row', backgroundColor: c.borderLight, borderRadius: BorderRadius.full,
    padding: 4, marginBottom: Spacing.base,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.full,
  },
  modeBtnActive: { backgroundColor: c.primary },
  modeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.textSecondary },
  modeBtnTextActive: { color: c.textInverse },

  // Photo input
  previewWrap: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.md },
  preview: { width: '100%', backgroundColor: c.borderLight },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  retakeBtn: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.background, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 6, ...Shadow.sm,
  },
  retakeBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: c.text },
  photoPlaceholder: {
    height: 180, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: c.border, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginBottom: Spacing.md, backgroundColor: c.surface,
  },
  photoPlaceholderText: { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xl },
  photoBtnRow: { flexDirection: 'row', gap: Spacing.md },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: c.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
  },
  photoBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.primary },

  // Text input
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  input: {
    borderWidth: 1.5, borderColor: c.border, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.base, color: c.text, backgroundColor: c.surface, minHeight: 48,
  },

  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingVertical: Spacing.base,
    marginTop: Spacing.lg,
  },
  analyzeBtnText: { color: c.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  btnDisabled: { opacity: 0.5 },

  // Result
  noFoodCard: {
    backgroundColor: c.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg,
    marginTop: Spacing.lg, borderWidth: 1, borderColor: c.border,
  },
  noFoodText: { fontSize: FontSize.sm, color: c.textSecondary, textAlign: 'center', lineHeight: FontSize.sm * 1.5 },
  resultCard: {
    backgroundColor: c.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg,
    marginTop: Spacing.lg, borderWidth: 1, borderColor: c.borderLight, ...Shadow.sm,
  },
  resultDish: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
  resultPortion: { fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },
  calorieRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginVertical: Spacing.md },
  calorieValue: { fontSize: 40, fontWeight: FontWeight.extrabold, color: c.text, lineHeight: 44 },
  calorieUnit: { fontSize: FontSize.md, color: c.textSecondary, marginBottom: 6 },

  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  macroItem: {
    width: '31%', flexGrow: 1, alignItems: 'center', gap: 3,
    backgroundColor: c.background, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
  },
  macroIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  macroValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.text },
  macroLabel: { fontSize: FontSize.xs, color: c.textMuted },

  breakdownTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: c.borderLight,
  },
  breakdownName: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: c.text },
  breakdownAmount: { fontSize: FontSize.xs, color: c.textMuted },
  breakdownKcal: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.warning },

  resultNote: { fontSize: FontSize.xs, color: c.textSecondary, marginTop: Spacing.md, lineHeight: FontSize.xs * 1.6, fontStyle: 'italic' },
  confidenceRow: { flexDirection: 'row', gap: 4, marginTop: Spacing.sm },
  confidenceLabel: { fontSize: FontSize.xs, color: c.textMuted },
  confidenceValue: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: c.textSecondary },

  newBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: c.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md, marginTop: Spacing.lg,
  },
  newBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.primary },
});
