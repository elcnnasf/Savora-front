import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView,
  Modal, TextInput, Platform, Pressable, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { X, ChevronLeft, ChevronRight, CheckCircle, Play, Pause, Sparkles, Send, Star } from 'lucide-react-native';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { AppColors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import { RECIPES } from '../../data/mockData';
import { RootStackParamList } from '../../navigation/types';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useCookingProgressStore } from '../../store/cookingProgressStore';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { sendChatMessage, ChatMessage } from '../../api/ai';
import { rateRecipe } from '../../api/recipes';

type Route = RouteProp<RootStackParamList, 'CookingMode'>;
const { width } = Dimensions.get('window');

type ChatBubble = { id: string; role: 'user' | 'ai'; text: string };

export default function CookingModeScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const language = useUserStore((s) => s.language);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const styles = makeStyles(colors);

  const fallbackRecipe = RECIPES.find((r) => r.id === route.params.recipeId) ?? RECIPES[0];
  const steps      = route.params.steps ?? fallbackRecipe.steps;
  const recipeName = route.params.recipeName ?? fallbackRecipe.name;
  const recipe     = { name: recipeName, steps };

  const recipeId = route.params.recipeId;
  const setProgress = useCookingProgressStore((s) => s.setProgress);

  const [currentStep, setCurrentStep] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState((recipe.steps[0]?.duration ?? 5) * 60);
  const [completed, setCompleted]     = useState(false);
  const [rating, setRating]           = useState(0);
  const [rated, setRated]             = useState(false);

  const [aiVisible,  setAiVisible]   = useState(false);
  const [aiInput,    setAiInput]     = useState('');
  const [aiSending,  setAiSending]   = useState(false);
  const [messages,   setMessages]    = useState<ChatBubble[]>([]);
  const [kbHeight,   setKbHeight]    = useState(0);

  const historyRef  = useRef<ChatMessage[]>([]);
  const chatScrollRef = useRef<ScrollView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step       = recipe.steps[currentStep];
  const totalSteps = recipe.steps.length;
  const progress   = (currentStep / totalSteps) * 100;

  // Persist progress so "continue where you left off" works after logout/restart
  useEffect(() => {
    if (recipeId && totalSteps > 0) {
      const pct = Math.round((currentStep / totalSteps) * 100);
      if (pct > 0) setProgress(recipeId, pct);
    }
  }, [currentStep]);

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

  // Track keyboard height ourselves so the sheet input never hides behind the
  // keyboard — reliable on both iOS and Android inside a Modal.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const sub1 = Keyboard.addListener(showEvt, (e) => setKbHeight(e.endCoordinates?.height ?? 0));
    const sub2 = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => { sub1.remove(); sub2.remove(); };
  }, []);

  function goNext() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Mark 100% (don't clear) so it drops out of "Continue" and the daily
      // recommendation rotates away from a finished recipe.
      if (recipeId) setProgress(recipeId, 100);
      setCompleted(true);
    }
  }

  function goPrev() { if (currentStep > 0) setCurrentStep((s) => s - 1); }

  // #12 — rate the recipe right after finishing. Best-effort: silently ignores
  // failures (bundled mock recipes / offline) so the flow is never blocked.
  async function handleRate(star: number) {
    setRating(star);
    if (!recipeId) return;
    try {
      await rateRecipe(recipeId, star);
      setRated(true);
    } catch {
      setRated(true); // still acknowledge the tap
    }
  }

  function openAI() {
    setAiInput('');
    setMessages([]);
    historyRef.current = [];
    setAiVisible(true);
  }

  function closeAI() {
    Keyboard.dismiss();
    setAiVisible(false);
  }

  // Compact, focused context so the assistant answers for THIS step.
  function buildContext(): string {
    const prev = currentStep > 0 ? recipe.steps[currentStep - 1]?.instruction : undefined;
    const next = currentStep < totalSteps - 1 ? recipe.steps[currentStep + 1]?.instruction : undefined;
    return [
      `Recipe: ${recipe.name}`,
      `Step ${currentStep + 1} of ${totalSteps} (current): ${step?.instruction ?? ''}`,
      prev ? `Previous step: ${prev}` : null,
      next ? `Next step: ${next}` : null,
    ].filter(Boolean).join('\n');
  }

  async function sendQuestion(preset?: string) {
    const text = (preset ?? aiInput).trim();
    if (!text || aiSending) return;

    Keyboard.dismiss();
    const userMsg: ChatBubble = { id: `u${Date.now()}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setAiInput('');
    setAiSending(true);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const res = await sendChatMessage(text, historyRef.current, language, buildContext());
      const reply = res.data.reply;
      historyRef.current = [
        ...historyRef.current,
        { role: 'user' as const,      content: text },
        { role: 'assistant' as const, content: reply },
      ].slice(-20);
      setMessages((prev) => [...prev, { id: `a${Date.now()}`, role: 'ai', text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: `e${Date.now()}`, role: 'ai', text: t('cooking.aiError') }]);
    } finally {
      setAiSending(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
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

          {isAuthenticated && (
            <View style={styles.ratingCard}>
              <Text style={styles.ratingTitle}>
                {rated ? t('cooking.thanksRating') : t('cooking.rateThisRecipe')}
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => handleRate(s)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <Star
                      size={38}
                      color={colors.warning}
                      fill={s <= rating ? colors.warning : 'transparent'}
                      strokeWidth={1.5}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

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
      <Modal visible={aiVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={closeAI}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeAI} />

          <View
            style={[
              styles.modalSheet,
              { paddingBottom: (kbHeight > 0 ? kbHeight : insets.bottom) + Spacing.sm },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetIconWrap}>
                <Sparkles size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>{t('cooking.savoraAI')}</Text>
                <Text style={styles.sheetSubtitle} numberOfLines={1}>
                  {t('cooking.step')} {currentStep + 1} · {recipe.name}
                </Text>
              </View>
              <TouchableOpacity style={styles.sheetCloseBtn} onPress={closeAI} activeOpacity={0.7}>
                <X size={18} color={colors.textSecondary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Conversation */}
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatScrollInner}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 && !aiSending && (
                <View style={styles.introRow}>
                  <View style={styles.aiAvatar}>
                    <Sparkles size={13} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View style={[styles.bubble, styles.bubbleAi, styles.introBubble]}>
                    <Text style={styles.bubbleAiText}>{t('cooking.aiHelpIntro')}</Text>
                  </View>
                </View>
              )}

              {messages.map((m) =>
                m.role === 'user' ? (
                  <View key={m.id} style={styles.userRow}>
                    <View style={[styles.bubble, styles.bubbleUser]}>
                      <Text style={styles.bubbleUserText}>{m.text}</Text>
                    </View>
                  </View>
                ) : (
                  <View key={m.id} style={styles.aiRow}>
                    <View style={styles.aiAvatar}>
                      <Sparkles size={13} color={colors.primary} strokeWidth={2} />
                    </View>
                    <View style={[styles.bubble, styles.bubbleAi]}>
                      <Text style={styles.bubbleAiText}>{m.text}</Text>
                    </View>
                  </View>
                ),
              )}

              {aiSending && (
                <View style={styles.aiRow}>
                  <View style={styles.aiAvatar}>
                    <Sparkles size={13} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View style={[styles.bubble, styles.bubbleAi, styles.loadingBubble]}>
                    <View style={styles.aiDot} />
                    <View style={[styles.aiDot, { opacity: 0.6 }]} />
                    <View style={[styles.aiDot, { opacity: 0.3 }]} />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Suggestion chips — only before the conversation starts */}
            {messages.length === 0 && !aiSending && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.chipsRow}
              >
                {CHIPS.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={styles.chip}
                    onPress={() => sendQuestion(chip)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipText} numberOfLines={1}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Input row */}
            <View style={styles.questionRow}>
              <TextInput
                style={styles.questionInput}
                value={aiInput}
                onChangeText={setAiInput}
                placeholder={t('cooking.askPlaceholder')}
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={200}
                returnKeyType="send"
                onSubmitEditing={() => sendQuestion()}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!aiInput.trim() || aiSending) && styles.sendBtnDisabled]}
                onPress={() => sendQuestion()}
                activeOpacity={0.8}
                disabled={!aiInput.trim() || aiSending}
              >
                <Send size={18} color={colors.textInverse} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

  ratingCard: {
    width: '100%', alignItems: 'center', gap: Spacing.md,
    backgroundColor: c.card, borderRadius: BorderRadius.xxl,
    paddingVertical: Spacing.xl, paddingHorizontal: Spacing.lg,
    borderWidth: 1, borderColor: c.borderLight,
  },
  ratingTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text, textAlign: 'center' },
  starsRow: { flexDirection: 'row', gap: Spacing.sm },

  // ── AI Modal ──────────────────────────────────────────────
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: c.background,
    borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm,
    maxHeight: '82%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: c.border, alignSelf: 'center', marginBottom: Spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingBottom: Spacing.sm, marginBottom: Spacing.xs,
    borderBottomWidth: 1, borderBottomColor: c.borderLight,
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

  // Conversation
  chatScroll: { flexGrow: 0, maxHeight: 320 },
  chatScrollInner: { paddingVertical: Spacing.md, gap: Spacing.md },

  introRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' },
  aiRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end', maxWidth: '92%' },
  userRow: { alignItems: 'flex-end' },

  aiAvatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: c.primarySurface, alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },

  bubble: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg, maxWidth: width * 0.72,
  },
  bubbleAi: {
    backgroundColor: c.surface,
    borderWidth: 1, borderColor: c.border,
    borderBottomLeftRadius: 6,
  },
  introBubble: { backgroundColor: c.primarySurface, borderColor: c.primary + '25' },
  bubbleAiText: { fontSize: FontSize.base, color: c.text, lineHeight: FontSize.base * 1.5 },
  bubbleUser: {
    backgroundColor: c.primary,
    borderBottomRightRadius: 6,
  },
  bubbleUserText: { fontSize: FontSize.base, color: c.textInverse, lineHeight: FontSize.base * 1.45 },

  loadingBubble: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: Spacing.md },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary },

  // Suggestion chips — compact
  chipsRow: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: Spacing.sm, paddingRight: Spacing.base },
  chip: {
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderWidth: 1, borderColor: c.primary + '30',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: FontSize.sm, color: c.primary, fontWeight: FontWeight.semibold,
    includeFontPadding: false,
  },

  // Input
  questionRow: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end',
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: c.borderLight,
  },
  questionInput: {
    flex: 1, backgroundColor: c.surface, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm + 2, paddingBottom: Spacing.sm + 2,
    fontSize: FontSize.base, color: c.text,
    borderWidth: 1.5, borderColor: c.border, maxHeight: 100, minHeight: 44,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: c.textMuted },
});
