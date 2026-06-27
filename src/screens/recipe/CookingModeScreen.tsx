import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView,
  Modal, TextInput, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { X, ChevronLeft, ChevronRight, CheckCircle, Play, Pause, Sparkles, Send } from 'lucide-react-native';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { AppColors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import { RECIPES } from '../../data/mockData';
import { RootStackParamList } from '../../navigation/types';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

type Route = RouteProp<RootStackParamList, 'CookingMode'>;
const { width } = Dimensions.get('window');

const AI_ANSWERS: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['yanır', 'burn', 'yandı', 'smoke', 'tüstü', 'горит', 'yanıyor'],
    answer: "If food is burning, immediately reduce heat to low and add 2–3 tablespoons of water or broth. Remove from heat momentarily if needed.",
  },
  {
    keywords: ['səhv', 'wrong', 'mistake', 'redo', 'yenidən', 'hata', 'ошибка'],
    answer: "Don't worry! For most steps, you can simply continue. If you overcooked or undercooked, adjust the next step's timing.",
  },
  {
    keywords: ['temperature', 'heat', 'istilik', 'temp', 'dərəcə', 'sıcaklık', 'температура'],
    answer: "Medium-high heat is usually around 180–200°C on an oven or level 7–8 on a 10-level stovetop.",
  },
  {
    keywords: ['substitute', 'replace', 'əvəz', 'yoxdur', 'değişim', 'замена'],
    answer: "Most ingredients have substitutes! Butter → olive oil, heavy cream → coconut milk, soy sauce → tamari.",
  },
  {
    keywords: ['time', 'vaxt', 'süre', 'время', 'how long'],
    answer: "Timing is a guide. Use visual cues: golden-brown colour, clear juices for meat, and fork-tender for vegetables.",
  },
];

function getAIAnswer(question: string): string {
  const lower = question.toLowerCase();
  const match = AI_ANSWERS.find((a) => a.keywords.some((k) => lower.includes(k)));
  return match?.answer ??
    "Great question! Follow the step carefully and adjust based on what you see. If something looks or smells off, reduce heat and take it slow. You've got this!";
}

export default function CookingModeScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const fallbackRecipe = RECIPES.find((r) => r.id === route.params.recipeId) ?? RECIPES[0];
  const steps      = route.params.steps ?? fallbackRecipe.steps;
  const recipeName = route.params.recipeName ?? fallbackRecipe.name;
  const recipe     = { name: recipeName, steps };

  const [currentStep, setCurrentStep] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState((recipe.steps[0]?.duration ?? 5) * 60);
  const [completed, setCompleted]     = useState(false);

  const [aiVisible,  setAiVisible]  = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer,   setAiAnswer]   = useState<string | null>(null);
  const [aiLoading,  setAiLoading]  = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step       = recipe.steps[currentStep];
  const totalSteps = recipe.steps.length;
  const progress   = (currentStep / totalSteps) * 100;

  useEffect(() => {
    setSecondsLeft((step?.duration ?? 5) * 60);
    setTimerActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [currentStep]);

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) { setTimerActive(false); clearInterval(intervalRef.current!); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerActive]);

  function goNext() {
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
    else setCompleted(true);
  }

  function goPrev() { if (currentStep > 0) setCurrentStep((s) => s - 1); }

  function openAI() { setAiQuestion(''); setAiAnswer(null); setAiVisible(true); }

  function sendQuestion() {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    setTimeout(() => { setAiAnswer(getAIAnswer(aiQuestion)); setAiLoading(false); }, 1100);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const CHIPS = [
    t('cooking.foodBurning'),
    t('cooking.wrongTemperature'),
    t('cooking.madeMistake'),
    t('cooking.substituteIngredient'),
  ];

  if (completed) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.primarySurface }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.completedContent}>
          <View style={styles.completedIcon}>
            <CheckCircle size={64} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.completedTitle}>{t('cooking.recipeComplete')} 🎉</Text>
          <Text style={styles.completedSubtitle}>
            {recipe.name}{'\n'}{t('cooking.enjoyYourMeal')}
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>{t('cooking.backToRecipe')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepLabel}>
            {t('cooking.step')} {currentStep + 1} {t('cooking.of')} {totalSteps}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        <ProgressBar progress={progress} height={4} />
      </View>

      <View style={styles.recipeTitle}>
        <Text style={styles.recipeName} numberOfLines={1}>{recipe.name}</Text>
      </View>

      <ScrollView
        style={styles.stepContent}
        contentContainerStyle={styles.stepContentInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepNumberCircle}>
          <Text style={styles.stepNumberText}>{currentStep + 1}</Text>
        </View>

        <Text style={styles.stepInstruction}>{step.instruction}</Text>

        {step.duration && (
          <View style={styles.timerSection}>
            <View style={styles.timerDisplay}>
              <Text style={styles.timerText}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </Text>
              <Text style={styles.timerLabel}>{t('cooking.minutesRemaining')}</Text>
            </View>
            <TouchableOpacity
              style={[styles.timerBtn, timerActive && styles.timerBtnPause]}
              onPress={() => setTimerActive(!timerActive)}
              activeOpacity={0.8}
            >
              {timerActive
                ? <Pause size={22} color={colors.textInverse} strokeWidth={2} fill={colors.textInverse} />
                : <Play size={22} color={colors.textInverse} strokeWidth={2} fill={colors.textInverse} />}
              <Text style={styles.timerBtnText}>
                {timerActive ? t('cooking.pauseTimer') : t('cooking.startTimer')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Ask AI button */}
      <View style={styles.askAiRow}>
        <TouchableOpacity style={styles.askAiBtn} onPress={openAI} activeOpacity={0.85}>
          <Sparkles size={14} color={colors.primary} strokeWidth={2} />
          <Text style={styles.askAiBtnText}>{t('cooking.askAIBtn')}</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnOutline, currentStep === 0 && styles.navBtnDisabled]}
          onPress={goPrev}
          disabled={currentStep === 0}
          activeOpacity={0.8}
        >
          <ChevronLeft size={20} color={currentStep === 0 ? colors.textMuted : colors.primary} strokeWidth={2.5} />
          <Text style={[styles.navBtnText, currentStep === 0 && styles.navBtnTextDisabled]}>
            {t('cooking.previous')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navBtn, styles.navBtnPrimary]} onPress={goNext} activeOpacity={0.85}>
          <Text style={styles.navBtnTextPrimary}>
            {currentStep === totalSteps - 1 ? t('cooking.finish') : t('cooking.nextStep')}
          </Text>
          <ChevronRight size={20} color={colors.textInverse} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* AI Chat Modal */}
      <Modal visible={aiVisible} transparent animationType="slide" onRequestClose={() => setAiVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAiVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKAV}>
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetIconWrap}>
                  <Sparkles size={18} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.sheetHeaderText}>
                  <Text style={styles.sheetTitle}>{t('cooking.askAI')}</Text>
                  <Text style={styles.sheetSubtitle} numberOfLines={1}>
                    {t('cooking.step')} {currentStep + 1} · {recipe.name}
                  </Text>
                </View>
                <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setAiVisible(false)} activeOpacity={0.7}>
                  <X size={18} color={colors.textSecondary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Input row */}
              <View style={styles.questionRow}>
                <TextInput
                  style={styles.questionInput}
                  value={aiQuestion}
                  onChangeText={setAiQuestion}
                  placeholder={t('cooking.askPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={200}
                  returnKeyType="send"
                  onSubmitEditing={sendQuestion}
                  blurOnSubmit
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!aiQuestion.trim() || aiLoading) && styles.sendBtnDisabled]}
                  onPress={sendQuestion}
                  activeOpacity={0.8}
                  disabled={!aiQuestion.trim() || aiLoading}
                >
                  <Send size={18} color={colors.textInverse} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Quick chips */}
              {!aiAnswer && !aiLoading && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  {CHIPS.map((chip) => (
                    <TouchableOpacity
                      key={chip}
                      style={styles.chip}
                      onPress={() => setAiQuestion(chip)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipText}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Loading dots */}
              {aiLoading && (
                <View style={styles.loadingRow}>
                  <View style={styles.aiDot} />
                  <View style={[styles.aiDot, { opacity: 0.6 }]} />
                  <View style={[styles.aiDot, { opacity: 0.3 }]} />
                </View>
              )}

              {/* Answer */}
              {aiAnswer && (
                <View style={styles.answerBox}>
                  <View style={styles.answerHeader}>
                    <View style={styles.aiAvatarSmall}>
                      <Sparkles size={12} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={styles.answerLabel}>{t('cooking.savoraAI')}</Text>
                  </View>
                  <Text style={styles.answerText}>{aiAnswer}</Text>
                </View>
              )}

              <View style={{ height: Spacing.base }} />
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  stepIndicator: {
    backgroundColor: c.primarySurface, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: BorderRadius.full,
  },
  stepLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.primary },
  progressBar: { paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
  recipeTitle: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  recipeName: { fontSize: FontSize.base, color: c.textSecondary, fontWeight: FontWeight.medium },

  stepContent: { flex: 1 },
  stepContentInner: {
    paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  stepNumberCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  stepNumberText: { fontSize: FontSize.display, fontWeight: FontWeight.extrabold, color: c.textInverse },
  stepInstruction: {
    fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: c.text,
    textAlign: 'center', lineHeight: FontSize.xl * 1.5, marginBottom: Spacing.xl,
  },

  timerSection: { width: '100%', gap: Spacing.base, alignItems: 'center' },
  timerDisplay: {
    backgroundColor: c.surface, borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xl, paddingHorizontal: Spacing.xxl,
    alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: c.border,
  },
  timerText: { fontSize: 52, fontWeight: FontWeight.extrabold, color: c.text, letterSpacing: 2 },
  timerLabel: { fontSize: FontSize.sm, color: c.textMuted, marginTop: 4 },
  timerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: c.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
  },
  timerBtnPause: { backgroundColor: c.textSecondary },
  timerBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.textInverse },

  askAiRow: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, alignItems: 'center' },
  askAiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.base,
    borderWidth: 1, borderColor: c.primary + '60',
  },
  askAiBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.primary },

  navigation: {
    flexDirection: 'row', gap: Spacing.md,
    padding: Spacing.base, borderTopWidth: 1, borderTopColor: c.border,
  },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, borderRadius: BorderRadius.full, paddingVertical: Spacing.base,
  },
  navBtnOutline: { borderWidth: 1.5, borderColor: c.primary },
  navBtnPrimary: { backgroundColor: c.primary },
  navBtnDisabled: { borderColor: c.border },
  navBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.primary },
  navBtnTextDisabled: { color: c.textMuted },
  navBtnTextPrimary: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.textInverse },

  completedContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl, gap: Spacing.lg,
  },
  completedIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: c.background, alignItems: 'center', justifyContent: 'center',
  },
  completedTitle: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: c.text, textAlign: 'center',
  },
  completedSubtitle: {
    fontSize: FontSize.base, color: c.textSecondary, textAlign: 'center', lineHeight: FontSize.base * 1.6,
  },
  doneBtn: {
    backgroundColor: c.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base + 2, paddingHorizontal: Spacing.xxl,
    width: '100%', alignItems: 'center',
  },
  doneBtnText: { color: c.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.semibold },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalKAV: { justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: c.background,
    borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, minHeight: 280,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: c.border, alignSelf: 'center', marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md,
  },
  sheetIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: c.primarySurface, alignItems: 'center', justifyContent: 'center',
  },
  sheetHeaderText: { flex: 1 },
  sheetTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text },
  sheetSubtitle: { fontSize: FontSize.xs, color: c.textMuted, marginTop: 1 },
  sheetCloseBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center',
  },

  questionRow: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end', marginBottom: Spacing.md,
  },
  questionInput: {
    flex: 1, backgroundColor: c.surface, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: FontSize.base, color: c.text,
    borderWidth: 1.5, borderColor: c.border, maxHeight: 100,
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: c.textMuted },

  chipsRow: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: Spacing.md, paddingRight: Spacing.base },
  chip: {
    backgroundColor: c.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 36,
  },
  chipText: {
    fontSize: FontSize.sm, color: c.text, fontWeight: FontWeight.medium,
    includeFontPadding: false,
  },

  loadingRow: { flexDirection: 'row', gap: 6, paddingVertical: Spacing.md, paddingLeft: Spacing.sm },
  aiDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary },

  answerBox: {
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: c.primary + '30',
  },
  answerHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  aiAvatarSmall: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: c.background, alignItems: 'center', justifyContent: 'center',
  },
  answerLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.primary },
  answerText: { fontSize: FontSize.base, color: c.text, lineHeight: FontSize.base * 1.55 },
});
