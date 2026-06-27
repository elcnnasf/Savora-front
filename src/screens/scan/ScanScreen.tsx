import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Alert, ActivityIndicator, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  X, Camera, Image as ImageIcon, Sparkles, RotateCcw,
  Zap, ZapOff, ChevronRight, RefreshCw,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { scanIngredients } from '../../api/ai';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width, height } = Dimensions.get('window');
const CORNER = 24;
const CORNER_T = 3;

type Phase = 'viewfinder' | 'scanning' | 'result';

export default function ScanScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const [facing, setFacing]           = useState<CameraType>('back');
  const [flash, setFlash]             = useState(false);
  const [phase, setPhase]             = useState<Phase>('viewfinder');
  const [previewUri, setPreviewUri]   = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [scanError, setScanError]     = useState<string | null>(null);

  const doScan = useCallback(async (base64: string) => {
    setPhase('scanning');
    setScanError(null);
    try {
      const res = await scanIngredients(base64);
      const found = res.data.ingredients;
      if (found.length === 0) {
        setScanError(t('scan.noIngredientsDetected'));
        setPhase('result');
        return;
      }
      setIngredients(found);
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
        quality: 0.6,
        base64: true,
        exif: false,
      });
      if (!photo?.base64) { Alert.alert('Error', 'Could not capture photo.'); return; }
      setPreviewUri(photo.uri);
      await doScan(photo.base64);
    } catch {
      Alert.alert('Error', 'Failed to take photo.');
    }
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) { Alert.alert('Error', 'Could not read image data.'); return; }
    setPreviewUri(asset.uri);
    await doScan(asset.base64);
  }

  function reset() {
    setPhase('viewfinder');
    setPreviewUri(null);
    setIngredients([]);
    setScanError(null);
  }

  function removeIngredient(name: string) {
    setIngredients((prev) => prev.filter((i) => i !== name));
  }

  function goToMatches() {
    if (ingredients.length === 0) return;
    navigation.navigate('MatchedRecipes', { ingredients });
  }

  function goToAI() {
    if (ingredients.length === 0) return;
    (navigation as any).navigate('AIRecipe', { ingredients });
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

  if (phase === 'result') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X size={20} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detected Ingredients</Text>
          <TouchableOpacity style={styles.rescanBtn} onPress={reset} activeOpacity={0.8}>
            <RefreshCw size={15} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.rescanText}>{t('scan.rescan')}</Text>
          </TouchableOpacity>
        </View>

        {previewUri && (
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
          <>
            <View style={styles.foundHeader}>
              <View style={styles.foundBadge}>
                <Sparkles size={13} color={colors.primary} strokeWidth={2} />
                <Text style={styles.foundBadgeText}>{ingredients.length} {t('scan.foundIngredients')}</Text>
              </View>
              <Text style={styles.foundHint}>{t('scan.tapToRemove')}</Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.tagContainer}
            >
              {ingredients.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={styles.tag}
                  onPress={() => removeIngredient(name)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.tagText}>{name}</Text>
                  <X size={12} color={colors.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.actionFooter}>
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
          </>
        )}
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

  tagContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingBottom: 140,
  },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: c.primary + '40',
  },
  tagText: { fontSize: FontSize.sm, color: c.primary, fontWeight: FontWeight.medium },

  actionFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
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
