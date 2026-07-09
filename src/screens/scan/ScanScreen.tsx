import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Alert, ActivityIndicator, Dimensions, ScrollView, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import {
  X, Camera, Image as ImageIcon, Sparkles, RotateCcw,
  Zap, ZapOff, ChevronRight, RefreshCw, Plus, PenLine,
  Search, Carrot, Apple, Leaf, Beef, Fish, Milk, SlidersHorizontal,
  Wheat, Bean, Nut, Droplets, Cake, Package, CupSoda, UtensilsCrossed,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { scanIngredients } from '../../api/ai';
import {
  CATALOG_CATEGORIES, INGREDIENT_CATALOG, CatalogCategoryId,
  localizeIngredient, searchCatalog,
} from '../../data/ingredientCatalog';
import { useScanBasketStore } from '../../store/scanBasketStore';
import { formatItemAmount, amountToEnglish } from '../../utils/ingredientUnits';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width, height } = Dimensions.get('window');
const CORNER = 24;
const CORNER_T = 3;

type Phase = 'choice' | 'viewfinder' | 'scanning' | 'result' | 'manual';

const CATEGORY_ICONS: Record<CatalogCategoryId, any> = {
  veg: Carrot, fruit: Apple, herb: Leaf, meat: Beef, fish: Fish,
  dairy: Milk, grain: Wheat, legume: Bean, nut: Nut, oil: Droplets,
  bake: Cake, can: Package, drink: CupSoda, other: UtensilsCrossed,
};

export default function ScanScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  const styles = makeStyles(colors);

  const [facing, setFacing]           = useState<CameraType>('back');
  const [flash, setFlash]             = useState(false);
  const [phase, setPhase]             = useState<Phase>('choice');
  const [previewUri, setPreviewUri]   = useState<string | null>(null);
  // Ingredient basket (name + amount + unit) lives in a shared store so the
  // dedicated amounts page (#8) and this screen stay in sync.
  const basketItems = useScanBasketStore((s) => s.items);
  const setBasketNames = useScanBasketStore((s) => s.setNames);
  const addToBasket = useScanBasketStore((s) => s.add);
  const removeFromBasket = useScanBasketStore((s) => s.remove);
  const clearBasket = useScanBasketStore((s) => s.clear);
  const ingredients = basketItems.map((i) => i.name);

  const [scanError, setScanError]     = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [activeCat, setActiveCat]     = useState<CatalogCategoryId>('veg');

  // Safety net only — after client-side downscaling payloads are ~200KB
  const MAX_BASE64_LEN = 6_500_000;

  // Phone cameras produce 3-12MB photos; uploading those made scans slow and
  // often trip the size limit. Downscale to 1280px / 70% JPEG (~150-400KB)
  // before upload — plenty of detail for ingredient detection.
  async function toScanBase64(uri: string): Promise<string | null> {
    try {
      const out = await manipulateAsync(
        uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true },
      );
      return out.base64 ?? null;
    } catch {
      return null;
    }
  }

  const doScan = useCallback(async (uri: string) => {
    setPhase('scanning');
    setScanError(null);
    try {
      const base64 = await toScanBase64(uri);
      if (!base64) {
        setScanError(t('errors.couldNotReadImage'));
        setPhase('result');
        return;
      }
      if (base64.length > MAX_BASE64_LEN) {
        setScanError(t('scan.imageTooLarge'));
        setPhase('result');
        return;
      }
      const res = await scanIngredients(base64);
      const found = res.data.ingredients;
      if (found.length === 0) {
        setScanError(t('scan.noIngredientsDetected'));
        setPhase('result');
        return;
      }
      setBasketNames(found);
      setPhase('result');
    } catch (err: any) {
      setScanError(err?.message ?? t('scan.scanFailed'));
      setPhase('result');
    }
  }, []);

  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        exif: false,
      });
      if (!photo?.uri) { Alert.alert(t('errors.title'), t('errors.couldNotCapturePhoto')); return; }
      setPreviewUri(photo.uri);
      await doScan(photo.uri);
    } catch {
      Alert.alert(t('errors.title'), t('errors.failedToTakePhoto'));
    }
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('errors.permissionRequired'), t('errors.permissionRequiredMsg'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    await doScan(asset.uri);
  }

  function reset() {
    setPhase('choice');
    setPreviewUri(null);
    clearBasket();
    setScanError(null);
    setManualInput('');
    setCatalogSearch('');
  }

  function addIngredient(name: string) {
    addToBasket(name);
  }

  function addManualIngredient() {
    addToBasket(manualInput);
    setManualInput('');
  }

  function removeIngredient(name: string) {
    removeFromBasket(name);
  }

  // Recipe matching works on plain names; AI generation gets amounts + units,
  // but only for ingredients the user actually set an amount for.
  function ingredientsWithQty(): string[] {
    return basketItems.map((i) => (i.custom ? amountToEnglish(i.amount, i.unit, i.name) : i.name));
  }

  function openAmounts() {
    if (ingredients.length === 0) return;
    navigation.navigate('IngredientAmounts');
  }

  function goToMatches() {
    if (ingredients.length === 0) return;
    navigation.navigate('MatchedRecipes', { ingredients });
  }

  function goToAI() {
    if (ingredients.length === 0) return;
    navigation.navigate('AIRecipe', { ingredients: ingredientsWithQty() });
  }

  if (phase === 'choice') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X size={20} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('scan.choiceTitle')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.choiceContainer}>
          <Text style={styles.choiceSubtitle}>{t('scan.choiceSubtitle')}</Text>

          <TouchableOpacity
            style={styles.choiceCard}
            onPress={() => setPhase('viewfinder')}
            activeOpacity={0.85}
          >
            <View style={[styles.choiceIconBox, { backgroundColor: colors.primary + '18' }]}>
              <Camera size={36} color={colors.primary} strokeWidth={1.8} />
            </View>
            <View style={styles.choiceTextBox}>
              <Text style={styles.choiceCardTitle}>{t('scan.scanIngredient')}</Text>
              <Text style={styles.choiceCardDesc}>{t('scan.scanIngredientDesc')}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.choiceCard}
            onPress={() => setPhase('manual')}
            activeOpacity={0.85}
          >
            <View style={[styles.choiceIconBox, { backgroundColor: '#10B98118' }]}>
              <PenLine size={36} color="#10B981" strokeWidth={1.8} />
            </View>
            <View style={styles.choiceTextBox}>
              <Text style={styles.choiceCardTitle}>{t('scan.addManualTitle')}</Text>
              <Text style={styles.choiceCardDesc}>{t('scan.addManualDesc')}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'scanning') {
    return (
      <View style={styles.darkFull}>
        {previewUri && (
          <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFillObject} blurRadius={2} />
        )}
        <View style={styles.scanOverlay}>
          <View style={styles.scanSpinner}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.scanningTitle}>{t('scan.analyzing')}</Text>
          <Text style={styles.scanningSubtitle}>{t('scan.analyzingDesc')}</Text>
        </View>
      </View>
    );
  }

  if (phase === 'result' || phase === 'manual') {
    const isManual = phase === 'manual';
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => isManual ? setPhase('choice') : navigation.goBack()}>
            <X size={20} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isManual ? t('scan.manualMode') : t('scan.detectedTitle')}</Text>
          {isManual ? (
            <View style={{ width: 40 }} />
          ) : (
            <TouchableOpacity style={styles.rescanBtn} onPress={reset} activeOpacity={0.8}>
              <RefreshCw size={15} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.rescanText}>{t('scan.rescan')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isManual && previewUri && (
          <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
        )}

        {scanError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{scanError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={reset} activeOpacity={0.8}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.kav}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.foundHeader}>
              <View style={styles.foundBadge}>
                <Sparkles size={13} color={colors.primary} strokeWidth={2} />
                <Text style={styles.foundBadgeText}>{ingredients.length} {isManual ? t('scan.addedIngredients') : t('scan.foundIngredients')}</Text>
              </View>
              <Text style={styles.foundHint}>{t('scan.qtyHint')}</Text>
            </View>

            <ScrollView
              style={styles.scrollFlex}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.catalogScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.tagContainer}>
                {basketItems.map((item) => (
                  <TouchableOpacity
                    key={item.name}
                    style={styles.tag}
                    onPress={openAmounts}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.tagText}>
                      {localizeIngredient(item.name, lang)}
                      {item.custom ? (
                        <Text style={styles.tagAmount}>  {formatItemAmount(item.amount, item.unit, lang)}</Text>
                      ) : null}
                    </Text>
                    <TouchableOpacity onPress={() => removeIngredient(item.name)} hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}>
                      <X size={13} color={colors.error} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>

              {ingredients.length > 0 && (
                <TouchableOpacity style={styles.adjustBtn} onPress={openAmounts} activeOpacity={0.85}>
                  <SlidersHorizontal size={15} color={colors.primary} strokeWidth={2.2} />
                  <Text style={styles.adjustBtnText}>{t('scan.setAmounts')}</Text>
                </TouchableOpacity>
              )}

              {/* Catalog browser (manual mode only — scan results stay clean).
                  Category chips are color-coded with icons so they read
                  clearly as categories, not ingredients. */}
              {isManual && (
                <>
                  <View style={styles.searchRow}>
                    <Search size={16} color={colors.textMuted} strokeWidth={2} />
                    <TextInput
                      style={styles.searchInput}
                      value={catalogSearch}
                      onChangeText={setCatalogSearch}
                      placeholder={t('scan.searchPlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      returnKeyType="search"
                    />
                    {catalogSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setCatalogSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <X size={15} color={colors.textMuted} strokeWidth={2.5} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {catalogSearch.trim().length === 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.catRow}
                    >
                      {CATALOG_CATEGORIES.map((cat) => {
                        const active = activeCat === cat.id;
                        const CatIcon = CATEGORY_ICONS[cat.id];
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            style={[
                              styles.catChip,
                              { borderColor: cat.color, backgroundColor: active ? cat.color : cat.color + '16' },
                            ]}
                            onPress={() => setActiveCat(cat.id)}
                            activeOpacity={0.8}
                          >
                            <CatIcon size={14} color={active ? '#fff' : cat.color} strokeWidth={2.2} />
                            <Text style={[styles.catChipText, { color: active ? '#fff' : cat.color }]}>
                              {cat[(['en', 'az', 'ru', 'tr'].includes(lang) ? lang : 'en') as 'en' | 'az' | 'ru' | 'tr']}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}

                  {(() => {
                    const searching = catalogSearch.trim().length > 0;
                    const results = searching
                      ? searchCatalog(catalogSearch)
                      : INGREDIENT_CATALOG.filter((it) => it.cat === activeCat);

                    // #7 — nothing in the catalog matches the search: offer to add
                    // exactly what the user typed as a custom ingredient.
                    if (searching && results.length === 0) {
                      const term = catalogSearch.trim();
                      return (
                        <View style={styles.notFoundBox}>
                          <Text style={styles.notFoundText}>{t('scan.notFound')}</Text>
                          <TouchableOpacity
                            style={styles.addOwnBtn}
                            onPress={() => { addIngredient(term); setCatalogSearch(''); }}
                            activeOpacity={0.85}
                          >
                            <Plus size={16} color={colors.textInverse} strokeWidth={2.5} />
                            <Text style={styles.addOwnBtnText} numberOfLines={1}>
                              {t('scan.addOwnPrefix')} “{term}”
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    }

                    return (
                      <View style={styles.catalogGrid}>
                        {results.map((item) => {
                          const added = ingredients.includes(item.en);
                          return (
                            <TouchableOpacity
                              key={item.en}
                              style={[styles.catalogChip, added && styles.catalogChipAdded]}
                              onPress={() => added ? removeIngredient(item.en) : addIngredient(item.en)}
                              activeOpacity={0.75}
                            >
                              {added
                                ? <X size={11} color={colors.primary} strokeWidth={2.5} />
                                : <Plus size={11} color={colors.textMuted} strokeWidth={2.5} />}
                              <Text style={[styles.catalogChipText, added && { color: colors.primary }]}>
                                {localizeIngredient(item.en, lang)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })()}
                </>
              )}
            </ScrollView>

            <View style={styles.actionFooter}>
              {/* In manual mode the search box + "add your own" already covers
                  typing a custom ingredient, so this input only shows for scan
                  results (which have no catalog search). */}
              {!isManual && (
                <View style={styles.manualInputRow}>
                  <TextInput
                    style={styles.manualInput}
                    value={manualInput}
                    onChangeText={setManualInput}
                    placeholder={t('scan.addManualPlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    onSubmitEditing={addManualIngredient}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={styles.manualAddBtn} onPress={addManualIngredient} activeOpacity={0.8}>
                    <Plus size={18} color={colors.textInverse} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.matchBtn, ingredients.length === 0 && styles.disabledBtn]}
                onPress={goToMatches}
                activeOpacity={0.85}
                disabled={ingredients.length === 0}
              >
                <Text style={styles.matchBtnText}>{t('scan.findMatching')}</Text>
                <ChevronRight size={18} color={colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.generateBtn, ingredients.length === 0 && styles.disabledBtn]}
                onPress={goToAI}
                activeOpacity={0.85}
                disabled={ingredients.length === 0}
              >
                <Sparkles size={17} color={colors.textInverse} strokeWidth={2.5} />
                <Text style={styles.generateBtnText}>{t('scan.generateWithAI')}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    );
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X size={20} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('scan.title')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Camera size={56} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={styles.permTitle}>{t('scan.cameraNeeded')}</Text>
          <Text style={styles.permSubtitle}>{t('scan.cameraDesc')}</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.85}>
            <Text style={styles.permBtnText}>{t('scan.allowCamera')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryFallback} onPress={pickFromGallery} activeOpacity={0.8}>
            <ImageIcon size={16} color={colors.primary} strokeWidth={2} />
            <Text style={styles.galleryFallbackText}>{t('scan.galleryFallback')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.darkFull}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        enableTorch={flash}
      />

      <SafeAreaView style={styles.camHeader} edges={['top']}>
        <TouchableOpacity style={styles.camBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.camTitle}>{t('scan.title')}</Text>
        <TouchableOpacity style={styles.camBtn} onPress={() => setFlash((f) => !f)} activeOpacity={0.8}>
          {flash
            ? <Zap size={20} color="#FFD600" strokeWidth={2} />
            : <ZapOff size={20} color="#fff" strokeWidth={2} />
          }
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.frameWrapper} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <Text style={styles.frameHint}>{t('scan.pointCamera')}</Text>
      </View>

      <View style={styles.camControls}>
        <TouchableOpacity style={styles.sideBtn} onPress={pickFromGallery} activeOpacity={0.8}>
          <ImageIcon size={26} color="#fff" strokeWidth={1.8} />
          <Text style={styles.sideBtnLabel}>{t('scan.gallery')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureRing} onPress={takePicture} activeOpacity={0.85}>
          <View style={styles.captureInner} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sideBtn}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          activeOpacity={0.8}
        >
          <RotateCcw size={26} color="#fff" strokeWidth={1.8} />
          <Text style={styles.sideBtnLabel}>{t('scan.flip')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  darkFull:  { flex: 1, backgroundColor: '#000' },

  choiceContainer: {
    flex: 1, paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl, gap: Spacing.base,
  },
  choiceSubtitle: {
    fontSize: FontSize.base, color: c.textMuted,
    textAlign: 'center', marginBottom: Spacing.md,
  },
  choiceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surface, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, gap: Spacing.base,
    borderWidth: 1.5, borderColor: c.border,
    ...Shadow.sm,
  },
  choiceIconBox: {
    width: 68, height: 68, borderRadius: BorderRadius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  choiceTextBox: { flex: 1, gap: 4 },
  choiceCardTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text,
  },
  choiceCardDesc: {
    fontSize: FontSize.sm, color: c.textMuted, lineHeight: 18,
  },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, gap: Spacing.md,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
  rescanBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rescanText:  { fontSize: FontSize.sm, color: c.primary, fontWeight: FontWeight.semibold },

  permTitle: {
    fontSize: FontSize.xl, fontWeight: FontWeight.bold,
    color: c.text, textAlign: 'center', marginTop: Spacing.md,
  },
  permSubtitle: {
    fontSize: FontSize.base, color: c.textMuted,
    textAlign: 'center', lineHeight: 22,
  },
  permBtn: {
    backgroundColor: c.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base, paddingHorizontal: Spacing.xl, marginTop: Spacing.md,
  },
  permBtnText: { color: c.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  galleryFallback: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  galleryFallbackText: { fontSize: FontSize.base, color: c.primary, fontWeight: FontWeight.medium },

  camHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm,
  },
  camBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  camTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },

  frameWrapper: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 100,
    alignItems: 'center', justifyContent: 'center',
  },
  frame: { width: width * 0.72, height: width * 0.72, position: 'relative' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff' },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_T, borderLeftWidth: CORNER_T },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_T, borderRightWidth: CORNER_T },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_T, borderLeftWidth: CORNER_T },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_T, borderRightWidth: CORNER_T },
  frameHint: {
    color: 'rgba(255,255,255,0.75)', fontSize: FontSize.sm, marginTop: Spacing.lg,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },

  camControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly',
    paddingBottom: 44, paddingTop: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sideBtn: { alignItems: 'center', gap: 5, minWidth: 60 },
  sideBtnLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  captureRing: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },

  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
  },
  scanSpinner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: c.background, alignItems: 'center', justifyContent: 'center',
  },
  scanningTitle:    { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#fff' },
  scanningSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingHorizontal: Spacing.xl },

  preview: { width: '100%', height: height * 0.28 },

  errorCard: {
    margin: Spacing.base, padding: Spacing.lg,
    backgroundColor: '#FEF2F2', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', gap: Spacing.md,
  },
  errorText: { fontSize: FontSize.base, color: '#DC2626', textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    backgroundColor: '#DC2626', borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
  },
  retryText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  foundHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  foundBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 5,
  },
  foundBadgeText: { fontSize: FontSize.sm, color: c.primary, fontWeight: FontWeight.semibold },
  foundHint:      { fontSize: FontSize.xs, color: c.textMuted },

  kav: { flex: 1 },
  scrollFlex: { flex: 1 },
  catalogScroll: { paddingBottom: Spacing.lg },

  notFoundBox: {
    marginHorizontal: Spacing.base, marginTop: Spacing.lg,
    padding: Spacing.lg, borderRadius: BorderRadius.xl,
    backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.border,
    borderStyle: 'dashed', alignItems: 'center', gap: Spacing.md,
  },
  notFoundText: { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center' },
  addOwnBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: c.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg, maxWidth: '100%',
  },
  addOwnBtnText: { color: c.textInverse, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, flexShrink: 1 },
  tagContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: c.primary + '40',
  },
  tagText: { fontSize: FontSize.sm, color: c.primary, fontWeight: FontWeight.medium },
  tagAmount: { fontSize: FontSize.xs, color: c.primary, fontWeight: FontWeight.bold },
  adjustBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.base, marginTop: Spacing.md,
    paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: c.primary + '55', backgroundColor: c.primarySurface,
  },
  adjustBtnText: { fontSize: FontSize.sm, color: c.primary, fontWeight: FontWeight.semibold },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: c.surface, borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: c.border,
    paddingHorizontal: Spacing.base, marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.sm + 2, fontSize: FontSize.sm, color: c.text },
  catRow: { gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingTop: Spacing.md },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: BorderRadius.md, paddingVertical: 8, paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
  },
  catChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.4 },
  catalogGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.md,
  },
  catalogChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: c.surface, borderRadius: BorderRadius.full,
    paddingVertical: 7, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: c.border,
  },
  catalogChipAdded: { backgroundColor: c.primarySurface, borderColor: c.primary + '60' },
  catalogChipText: { fontSize: FontSize.xs, color: c.textSecondary, fontWeight: FontWeight.medium },

  manualInputRow: {
    flexDirection: 'row', gap: Spacing.sm,
  },
  manualInput: {
    flex: 1, backgroundColor: c.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    fontSize: FontSize.sm, color: c.text,
    borderWidth: 1.5, borderColor: c.border,
  },
  manualAddBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
  },
  actionFooter: {
    backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border,
    padding: Spacing.base, gap: Spacing.sm,
  },
  matchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: c.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base,
  },
  matchBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: c.primary },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: c.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base,
  },
  generateBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: c.textInverse },
  disabledBtn: { opacity: 0.4 },
});
