import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Sparkles, Send, UtensilsCrossed, MessageCircle,
  CalendarDays, Apple, ChevronRight, Trash2, LogIn,
} from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { sendChatMessage, ChatMessage } from '../../api/ai';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  actions?: NavAction[];
}

interface NavAction {
  label: string;
  screen: keyof RootStackParamList;
  icon: React.ComponentType<any>;
}

const NAV_INTENTS: { keywords: string[]; label: string; screen: keyof RootStackParamList; icon: React.ComponentType<any> }[] = [
  {
    keywords: [
      'meal plan', 'meal planner', 'weekly plan', 'plan my meals', 'plan your meals', 'meal schedule',
      'yemək planı', 'yemək planlayıcı', 'həftəlik plan',
      'план питания', 'планировщик питания', 'недельный план',
      'öğün planı', 'yemek planı', 'haftalık plan',
    ],
    label: 'chat.openMealPlanner', screen: 'MealPlanner', icon: CalendarDays,
  },
  {
    keywords: [
      'shopping list', 'grocery list', 'buy ingredients', 'shopping',
      'alış-veriş siyahısı', 'alış-veriş',
      'список покупок', 'покупк',
      'alışveriş listesi', 'alışveriş',
    ],
    label: 'chat.openShoppingList', screen: 'ShoppingList', icon: UtensilsCrossed,
  },
  {
    keywords: [
      'generate recipe', 'create recipe', 'ai recipe', 'make a recipe', 'generate a recipe', 'build a recipe',
      'resept yarat', 'resept generasiya', 'ai resept',
      'создать рецепт', 'сгенерировать рецепт',
      'tarif oluştur', 'tarif üret',
    ],
    label: 'chat.generateRecipeAction', screen: 'AIRecipe', icon: Sparkles,
  },
];

function detectNavActions(text: string): NavAction[] {
  const lower = text.toLowerCase();
  return NAV_INTENTS
    .filter((intent) => intent.keywords.some((kw) => lower.includes(kw)))
    .map(({ label, screen, icon }) => ({ label, screen, icon }));
}

export default function AIChatScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAuthenticated } = useAuthStore();
  const language = useUserStore((s) => s.language);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState('');
  const [isTyping,  setIsTyping]  = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const historyRef = useRef<ChatMessage[]>([]);

  // Clear chat whenever the logged-in user changes (account switch)
  useEffect(() => {
    setMessages([]);
    historyRef.current = [];
  }, [user?.id]);

  const QUICK_ACTIONS = [
    { label: t('chat.getRecipeIdeas'),  icon: UtensilsCrossed, prompt: t('chat.getRecipeIdeasPrompt') },
    { label: t('chat.askCooking'),      icon: MessageCircle,   prompt: t('chat.askCookingPrompt') },
    { label: t('chat.planMeals'),       icon: CalendarDays,    prompt: t('chat.planMealsPrompt') },
    { label: t('chat.nutritionAdvice'), icon: Apple,           prompt: t('chat.nutritionAdvicePrompt') },
  ];

  async function sendMessage(text: string) {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await sendChatMessage(text.trim(), historyRef.current, language);
      const reply = res.data.reply;

      historyRef.current = [
        ...historyRef.current,
        { role: 'user' as const,      content: text.trim() },
        { role: 'assistant' as const, content: reply },
      ].slice(-20);

      const actions = detectNavActions(reply);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: reply,
        actions: actions.length > 0 ? actions : undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      Alert.alert(t('errors.title'), err.message ?? t('errors.couldNotReachAI'));
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  function clearChat() {
    Alert.alert(t('chat.clearChat'), t('chat.clearConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.clear'),
        style: 'destructive',
        onPress: () => {
          setMessages([]);
          historyRef.current = [];
        },
      },
    ]);
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('nav.chat')}</Text>
        </View>
        <View style={styles.guestWall}>
          <View style={styles.guestAvatarLg}>
            <Sparkles size={40} color={colors.textInverse} strokeWidth={1.5} />
          </View>
          <Text style={styles.guestTitle}>{t('chat.assistantTitle')}</Text>
          <Text style={styles.guestSubtitle}>{t('chat.signInDesc')}</Text>
          <TouchableOpacity
            style={styles.signInBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SignIn')}
          >
            <LogIn size={18} color={colors.textInverse} strokeWidth={2} />
            <Text style={styles.signInBtnText}>{t('common.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const showQuickActions = messages.length === 0 && !isTyping;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.chat')}</Text>
        {messages.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearChat} activeOpacity={0.7}>
            <Trash2 size={18} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greetingCard}>
            <View style={styles.aiAvatar}>
              <Sparkles size={18} color={colors.textInverse} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingTitle}>{t('chat.hi')} {user?.name ?? t('chat.there')}! 👋</Text>
              <Text style={styles.greetingSubtitle}>{t('chat.greeting')}</Text>
            </View>
          </View>

          {showQuickActions && (
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity
                    key={action.label}
                    style={styles.quickCard}
                    activeOpacity={0.8}
                    onPress={() => sendMessage(action.prompt)}
                  >
                    <View style={styles.quickCardIcon}>
                      <Icon size={18} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={styles.quickCardText}>{action.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {messages.map((msg) => (
            <View key={msg.id} style={[styles.messageRow, msg.role === 'user' && styles.messageRowUser]}>
              {msg.role === 'ai' && (
                <View style={styles.aiAvatarSmall}>
                  <Sparkles size={12} color={colors.textInverse} strokeWidth={2.5} />
                </View>
              )}
              <View style={styles.bubbleWrapper}>
                <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                  <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>
                    {msg.text}
                  </Text>
                </View>

                {msg.actions && msg.actions.length > 0 && (
                  <View style={styles.actionsRow}>
                    {msg.actions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <TouchableOpacity
                          key={action.label}
                          style={styles.actionBtn}
                          activeOpacity={0.8}
                          onPress={() => navigation.navigate(action.screen as any)}
                        >
                          <Icon size={14} color={colors.primary} strokeWidth={2.5} />
                          <Text style={styles.actionBtnText}>{t(action.label)}</Text>
                          <ChevronRight size={14} color={colors.primary} strokeWidth={2.5} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={styles.messageRow}>
              <View style={styles.aiAvatarSmall}>
                <Sparkles size={12} color={colors.textInverse} strokeWidth={2.5} />
              </View>
              <View style={styles.typingBubble}>
                <Text style={styles.typingDots}>• • •</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            activeOpacity={0.8}
          >
            <Send size={18} color={colors.textInverse} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: c.background },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: c.border },
  title:           { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.text },
  clearBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center' },
  messageList:     { flex: 1 },
  messageContent:  { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xl },
  greetingCard:    {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.lg, padding: Spacing.md,
  },
  aiAvatar:        { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  greetingTitle:   { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: c.text },
  greetingSubtitle:{ fontSize: FontSize.sm, color: c.textSecondary },
  quickGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickCard:       {
    flex: 1, minWidth: '47%',
    backgroundColor: c.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: c.border, ...Shadow.sm,
  },
  quickCardIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: c.primarySurface, alignItems: 'center', justifyContent: 'center' },
  quickCardText:   { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: c.text, lineHeight: 18 },
  messageRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  messageRowUser:  { flexDirection: 'row-reverse' },
  aiAvatarSmall:   { width: 28, height: 28, borderRadius: 14, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubbleWrapper:   { maxWidth: '80%', gap: Spacing.xs },
  bubble:          { borderRadius: BorderRadius.lg, padding: Spacing.md },
  bubbleAi:        { backgroundColor: c.surface, borderBottomLeftRadius: BorderRadius.xs },
  bubbleUser:      { backgroundColor: c.primary, borderBottomRightRadius: BorderRadius.xs },
  bubbleText:      { fontSize: FontSize.base, color: c.text, lineHeight: FontSize.base * 1.5 },
  bubbleTextUser:  { color: c.textInverse },
  actionsRow:      { gap: Spacing.xs },
  actionBtn:       {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: c.primary + '44',
  },
  actionBtnText:   { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.primary },
  typingBubble:    { backgroundColor: c.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  typingDots:      { fontSize: FontSize.xl, color: c.textMuted, letterSpacing: 4 },
  inputRow:        {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.sm, borderTopWidth: 1, borderTopColor: c.border,
    backgroundColor: c.background,
  },
  input:           {
    flex: 1, backgroundColor: c.surface, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    fontSize: FontSize.base, color: c.text,
    borderWidth: 1, borderColor: c.border, maxHeight: 120,
  },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: c.border },

  guestWall:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  guestAvatarLg:   { width: 96, height: 96, borderRadius: 48, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  guestTitle:      { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.text, textAlign: 'center' },
  guestSubtitle:   { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', lineHeight: FontSize.sm * 1.6 },
  signInBtn:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  signInBtnText:   { color: c.textInverse, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
});
