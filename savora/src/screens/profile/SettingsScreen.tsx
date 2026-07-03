import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Modal, Pressable, Alert, Linking, Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Bell, Globe, Ruler, Moon, Shield, FileText, Mail,
  ChevronRight, Check, Clock, ChevronLeft, X,
  Utensils, Send, Eye, Database, Cpu, UserCheck, Ban, CreditCard, AlertCircle, RefreshCw,
} from 'lucide-react-native';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { AppColors } from '../../constants/colors';
import { Header } from '../../components/ui/Header';
import { useUserStore, MealReminderTimes } from '../../store/userStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import {
  requestNotificationPermission,
  scheduleMealReminders,
  cancelMealReminders,
  scheduleRecipeSuggestionNotification,
  cancelRecipeSuggestionNotification,
  isNotificationsAvailable,
} from '../../services/notificationService';


function getUnitsOptions(t: (key: string) => string): { value: 'Metric' | 'Imperial'; label: string; desc: string }[] {
  return [
    { value: 'Metric',   label: t('settings.metric'),   desc: 'kg, g, ml, °C, cm' },
    { value: 'Imperial', label: t('settings.imperial'), desc: 'lb, oz, fl oz, °F, in' },
  ];
}

const CONTACT_EMAIL = 'savorachef@gmail.com';
const APP_VERSION = '2.1.0';

// ── Legal structured content ─────────────────────────────────────────────────

interface LegalItem {
  icon: any;
  iconColor: string;
  title: string;
  body?: string;
  bullets?: string[];
}

const PRIVACY_ICONS: { icon: any; iconColor: string }[] = [
  { icon: Eye,       iconColor: '#2563EB' },
  { icon: Cpu,       iconColor: '#7C3AED' },
  { icon: Database,  iconColor: '#16A34A' },
  { icon: Bell,      iconColor: '#D97706' },
  { icon: UserCheck, iconColor: '#0891B2' },
  { icon: Mail,      iconColor: '#EC4899' },
];

const TERMS_ICONS: { icon: any; iconColor: string }[] = [
  { icon: FileText,    iconColor: '#2563EB' },
  { icon: Ban,         iconColor: '#EF4444' },
  { icon: Cpu,         iconColor: '#7C3AED' },
  { icon: CreditCard,  iconColor: '#16A34A' },
  { icon: AlertCircle, iconColor: '#D97706' },
  { icon: RefreshCw,   iconColor: '#0891B2' },
  { icon: Mail,        iconColor: '#EC4899' },
];

// ── Component ────────────────────────────────────────────────────────────────

type ModalType = 'units' | 'privacy' | 'terms' | 'contact' | 'reminders' | null;

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { t, raw } = useTranslation();
  const styles = makeStyles(colors, isDark);
  const UNITS_OPTIONS = getUnitsOptions(t);
  const PRIVACY_SECTIONS: LegalItem[] = raw<{ title: string; body?: string; bullets?: string[] }[]>('settings.privacySections')
    .map((s, i) => ({ ...s, ...PRIVACY_ICONS[i] }));
  const TERMS_SECTIONS: LegalItem[] = raw<{ title: string; body?: string; bullets?: string[] }[]>('settings.termsSections')
    .map((s, i) => ({ ...s, ...TERMS_ICONS[i] }));

  const {
    darkMode, setDarkMode,
    mealReminders, setMealReminders,
    mealReminderTimes, setMealReminderTimes,
    recipeSuggestions, setRecipeSuggestions,
    cookingTips, setCookingTips,
    units, setUnits,
  } = useUserStore();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [tempTimes, setTempTimes] = useState<MealReminderTimes>(mealReminderTimes);
  const [notifLoading, setNotifLoading] = useState(false);

  const closeModal = () => setActiveModal(null);

  // ── Notification toggles ──────────────────────────────────────────────────

  const notifAvailable = isNotificationsAvailable();

  function showExpoGoNotice() {
    Alert.alert(
      t('settings.notificationsUnavailableTitle'),
      t('settings.notificationsUnavailableMsg'),
      [{ text: t('errors.ok') }],
    );
  }

  const handleMealRemindersToggle = useCallback(async (val: boolean) => {
    if (!notifAvailable) { showExpoGoNotice(); return; }
    if (val) {
      setNotifLoading(true);
      const granted = await requestNotificationPermission();
      setNotifLoading(false);
      if (!granted) {
        Alert.alert(
          t('settings.notifDisabledTitle'),
          t('settings.notifDisabledMsg'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('settings.openSettings'), onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      setMealReminders(true);
      await scheduleMealReminders(mealReminderTimes);
    } else {
      setMealReminders(false);
      await cancelMealReminders();
    }
  }, [mealReminderTimes, notifAvailable]);

  const handleRecipeSuggestionsToggle = useCallback(async (val: boolean) => {
    if (!notifAvailable) { showExpoGoNotice(); return; }
    if (val) {
      setNotifLoading(true);
      const granted = await requestNotificationPermission();
      setNotifLoading(false);
      if (!granted) {
        Alert.alert(
          t('settings.notifDisabledTitle'),
          t('settings.notifDisabledMsg'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('settings.openSettings'), onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      setRecipeSuggestions(true);
      await scheduleRecipeSuggestionNotification();
    } else {
      setRecipeSuggestions(false);
      await cancelRecipeSuggestionNotification();
    }
  }, [notifAvailable]);

  const handleCookingTipsToggle = useCallback(async (val: boolean) => {
    if (!notifAvailable) { showExpoGoNotice(); return; }
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(t('errors.notificationsDisabledTitle'), t('errors.enableNotificationsMsg'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('errors.openSettings'), onPress: () => Linking.openSettings() },
        ]);
        return;
      }
    }
    setCookingTips(val);
  }, [notifAvailable]);

  // ── Reminder time save ────────────────────────────────────────────────────

  async function saveReminderTimes() {
    setMealReminderTimes(tempTimes);
    if (mealReminders) {
      await scheduleMealReminders(tempTimes);
    }
    closeModal();
  }

  // ── Contact send ──────────────────────────────────────────────────────────

  function handleSendEmail() {
    const subject = encodeURIComponent(contactSubject || t('settings.defaultFeedbackSubject'));
    const body    = encodeURIComponent(contactMessage);
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert(t('errors.title'), `${t('errors.couldNotOpenEmailPrefix')} ${CONTACT_EMAIL}`);
    });
  }

  // ── Sections ──────────────────────────────────────────────────────────────

  const SECTIONS = [
    {
      title: t('settings.notifications'),
      items: [
        {
          label: t('settings.mealReminders'),
          sublabel: mealReminders ? `${mealReminderTimes.breakfast} · ${mealReminderTimes.lunch} · ${mealReminderTimes.dinner}` : t('settings.mealRemindersSubDefault'),
          icon: Utensils, type: 'toggle-action', key: 'mealReminders',
          onAction: () => { setTempTimes(mealReminderTimes); setActiveModal('reminders'); },
          actionLabel: t('settings.setTimes'),
          color: colors.primary,
        },
        {
          label: t('settings.weeklyReports'),
          sublabel: t('settings.weeklyReportsSub'),
          icon: Bell, type: 'toggle', key: 'weeklyReports',
          color: '#7C3AED',
        },
        {
          label: t('settings.pushNotifications'),
          sublabel: t('settings.pushNotificationsSub'),
          icon: Bell, type: 'toggle', key: 'push',
          color: colors.info,
        },
      ],
    },
    {
      title: t('settings.preferences'),
      items: [
        { label: t('settings.darkMode'), sublabel: t('settings.darkModeSub'), icon: Moon, type: 'toggle', key: 'darkMode', color: colors.textSecondary },
        {
          label: t('settings.units'), sublabel: units === 'Metric' ? 'kg · g · ml · °C' : 'lb · oz · fl oz · °F',
          icon: Ruler, type: 'modal', modal: 'units' as ModalType,
          color: '#7C3AED',
        },
      ],
    },
    {
      title: t('settings.legal'),
      items: [
        { label: t('settings.privacyPolicy'), sublabel: t('settings.privacyPolicySub'), icon: Shield, type: 'modal', modal: 'privacy' as ModalType, color: colors.textMuted },
        { label: t('settings.termsOfService'), sublabel: t('settings.termsOfServiceSub'), icon: FileText, type: 'modal', modal: 'terms' as ModalType, color: colors.textMuted },
        { label: t('settings.contactUs'), sublabel: CONTACT_EMAIL, icon: Mail, type: 'modal', modal: 'contact' as ModalType, color: colors.textMuted },
      ],
    },
  ];

  function getToggleValue(key: string): boolean {
    if (key === 'darkMode') return darkMode;
    if (key === 'mealReminders') return mealReminders;
    if (key === 'weeklyReports') return recipeSuggestions;
    if (key === 'push') return cookingTips;
    return false;
  }

  function handleToggle(key: string, val: boolean) {
    if (key === 'darkMode') { setDarkMode(val); return; }
    if (key === 'mealReminders') { handleMealRemindersToggle(val); return; }
    if (key === 'weeklyReports') { handleRecipeSuggestionsToggle(val); return; }
    if (key === 'push') { handleCookingTipsToggle(val); return; }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title={t('settings.title')} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, i) => {
                const Icon = item.icon;
                const isLast = i === section.items.length - 1;
                const isToggle = item.type === 'toggle' || item.type === 'toggle-action';
                const isModal  = item.type === 'modal';

                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.row, !isLast && styles.rowDivider]}
                    activeOpacity={isToggle ? 1 : 0.75}
                    onPress={isModal ? () => setActiveModal((item as any).modal) : undefined}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: (item.color) + '22' }]}>
                      <Icon size={18} color={item.color} strokeWidth={2} />
                    </View>

                    <View style={styles.rowTextCol}>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      {(item as any).sublabel ? (
                        <Text style={styles.rowSublabel}>{(item as any).sublabel}</Text>
                      ) : null}
                    </View>

                    {isToggle && (
                      <View style={styles.toggleRight}>
                        {item.type === 'toggle-action' && getToggleValue('mealReminders') && (
                          <TouchableOpacity
                            style={styles.setTimesBtn}
                            onPress={(item as any).onAction}
                            activeOpacity={0.7}
                          >
                            <Clock size={12} color={colors.primary} strokeWidth={2} />
                            <Text style={styles.setTimesBtnText}>{(item as any).actionLabel}</Text>
                          </TouchableOpacity>
                        )}
                        <Switch
                          value={getToggleValue(item.key!)}
                          onValueChange={(v) => handleToggle(item.key!, v)}
                          trackColor={{ false: colors.borderLight, true: colors.primary + '80' }}
                          thumbColor={getToggleValue(item.key!) ? colors.primary : colors.textMuted}
                          disabled={notifLoading}
                        />
                      </View>
                    )}
                    {isModal && (
                      <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <Text style={styles.version}>Savora v{APP_VERSION}</Text>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* ── Units Modal ──────────────────────────────────────────────────── */}
      <BottomSheet visible={activeModal === 'units'} onClose={closeModal} title={t('settings.measurementUnits')}>
        {UNITS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionRow, units === opt.value && styles.optionRowActive]}
            onPress={() => { setUnits(opt.value); closeModal(); }}
            activeOpacity={0.75}
          >
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </View>
            {units === opt.value && <Check size={18} color={colors.primary} strokeWidth={2.5} />}
          </TouchableOpacity>
        ))}
        <View style={styles.unitsNote}>
          <Text style={styles.unitsNoteText}>
            {t('settings.unitsNote')}
          </Text>
        </View>
      </BottomSheet>

      {/* ── Meal Reminder Times Modal ────────────────────────────────────── */}
      <BottomSheet visible={activeModal === 'reminders'} onClose={closeModal} title={t('settings.mealReminderTimes')}>
        <Text style={styles.reminderSubtitle}>{t('settings.reminderSubtitle')}</Text>

        {([
          { key: 'breakfast', label: `🌅 ${t('planner.breakfast')}` },
          { key: 'lunch',     label: `☀️ ${t('planner.lunch')}`     },
          { key: 'dinner',    label: `🌙 ${t('planner.dinner')}`     },
        ] as const).map((meal) => (
          <View key={meal.key} style={styles.reminderRow}>
            <Text style={styles.reminderMealLabel}>{meal.label}</Text>
            <View style={styles.reminderTimeRow}>
              <TimeSelector
                value={tempTimes[meal.key]}
                onChange={(v) => setTempTimes((prev) => ({ ...prev, [meal.key]: v }))}
                colors={colors}
                styles={styles}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.saveBtn} onPress={saveReminderTimes} activeOpacity={0.85}>
          <Check size={16} color={styles.saveBtnText.color} strokeWidth={2.5} />
          <Text style={styles.saveBtnText}>{t('settings.saveReminderTimes')}</Text>
        </TouchableOpacity>
        <View style={{ height: Spacing.md }} />
      </BottomSheet>

      {/* ── Privacy Policy Modal ─────────────────────────────────────────── */}
      <LegalModal
        visible={activeModal === 'privacy'}
        onClose={closeModal}
        title={t('settings.privacyPolicy')}
        icon={Shield}
        iconColor="#F97316"
        sections={PRIVACY_SECTIONS}
        colors={colors}
        isDark={isDark}
      />

      {/* ── Terms of Service Modal ───────────────────────────────────────── */}
      <LegalModal
        visible={activeModal === 'terms'}
        onClose={closeModal}
        title={t('settings.termsOfService')}
        icon={FileText}
        iconColor="#2563EB"
        sections={TERMS_SECTIONS}
        colors={colors}
        isDark={isDark}
      />

      {/* ── Contact Us Modal ─────────────────────────────────────────────── */}
      <BottomSheet visible={activeModal === 'contact'} onClose={closeModal} title={t('settings.contactUs')}>
        <View style={styles.contactEmailBadge}>
          <Mail size={14} color={colors.primary} strokeWidth={2} />
          <Text style={styles.contactEmailText}>{CONTACT_EMAIL}</Text>
        </View>

        <Text style={styles.contactLabel}>{t('settings.subjectLabel')}</Text>
        <TextInput
          style={[styles.contactInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          placeholder={t('settings.subjectPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={contactSubject}
          onChangeText={setContactSubject}
        />

        <Text style={styles.contactLabel}>{t('settings.messageLabel')}</Text>
        <TextInput
          style={[styles.contactInput, styles.contactInputMulti, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          placeholder={t('settings.messagePlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={contactMessage}
          onChangeText={setContactMessage}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSendEmail} activeOpacity={0.85}>
          <Send size={16} color={styles.saveBtnText.color} strokeWidth={2} />
          <Text style={styles.saveBtnText}>{t('settings.openEmailApp')}</Text>
        </TouchableOpacity>
        <View style={{ height: Spacing.md }} />
      </BottomSheet>
    </SafeAreaView>
  );
}

// ── LegalModal component ──────────────────────────────────────────────────────

function LegalModal({ visible, onClose, title, icon: TitleIcon, iconColor, sections, colors, isDark }: {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon: any;
  iconColor: string;
  sections: LegalItem[];
  colors: AppColors;
  isDark: boolean;
}) {
  const styles = makeStyles(colors, isDark);
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.fullModalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.fullModalBack} onPress={onClose} activeOpacity={0.7}>
            <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={[styles.fullModalTitle, { color: colors.text }]}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.legalScroll} showsVerticalScrollIndicator={false}>
          {/* Hero badge */}
          <View style={styles.legalHero}>
            <View style={[styles.legalHeroIcon, { backgroundColor: iconColor + '20' }]}>
              <TitleIcon size={28} color={iconColor} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.legalHeroTitle}>{title}</Text>
              <View style={styles.legalUpdatedBadge}>
                <Text style={styles.legalUpdatedText}>{t('settings.lastUpdated')}</Text>
              </View>
            </View>
          </View>

          {/* Sections */}
          {sections.map((item, idx) => {
            const Icon = item.icon;
            return (
              <View key={idx} style={styles.legalCard}>
                <View style={styles.legalCardHeader}>
                  <View style={[styles.legalCardIcon, { backgroundColor: item.iconColor + '20' }]}>
                    <Icon size={16} color={item.iconColor} strokeWidth={2} />
                  </View>
                  <Text style={styles.legalCardTitle}>{item.title}</Text>
                </View>
                {item.body ? (
                  <Text style={styles.legalCardBody}>{item.body}</Text>
                ) : null}
                {item.bullets ? (
                  <View style={styles.legalBullets}>
                    {item.bullets.map((b, bi) => (
                      <View key={bi} style={styles.legalBulletRow}>
                        <View style={[styles.legalBulletDot, { backgroundColor: item.iconColor }]} />
                        <Text style={styles.legalBulletText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}

          {/* Got it button */}
          <TouchableOpacity style={styles.legalGotItBtn} onPress={onClose} activeOpacity={0.85}>
            <Check size={16} color={isDark ? '#FFFFFF' : '#FFFFFF'} strokeWidth={2.5} />
            <Text style={styles.legalGotItText}>{t('settings.gotIt')}</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── TimeSelector component ────────────────────────────────────────────────────

function TimeSelector({ value, onChange, colors, styles }: {
  value: string;
  onChange: (v: string) => void;
  colors: AppColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [h, m] = value.split(':');

  function changeHour(delta: number) {
    const next = (parseInt(h) + delta + 24) % 24;
    onChange(`${String(next).padStart(2, '0')}:${m}`);
  }
  function changeMinute(delta: number) {
    const next = (parseInt(m) + delta + 60) % 60;
    onChange(`${h}:${String(next).padStart(2, '0')}`);
  }

  return (
    <View style={styles.timeSelectorWrap}>
      <View style={styles.timeSelectorCol}>
        <TouchableOpacity onPress={() => changeHour(1)} style={styles.timeArrow} activeOpacity={0.7}>
          <Text style={[styles.timeArrowText, { color: colors.primary }]}>▲</Text>
        </TouchableOpacity>
        <Text style={[styles.timeDigit, { color: colors.text }]}>{h}</Text>
        <TouchableOpacity onPress={() => changeHour(-1)} style={styles.timeArrow} activeOpacity={0.7}>
          <Text style={[styles.timeArrowText, { color: colors.primary }]}>▼</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.timeColon, { color: colors.text }]}>:</Text>
      <View style={styles.timeSelectorCol}>
        <TouchableOpacity onPress={() => changeMinute(5)} style={styles.timeArrow} activeOpacity={0.7}>
          <Text style={[styles.timeArrowText, { color: colors.primary }]}>▲</Text>
        </TouchableOpacity>
        <Text style={[styles.timeDigit, { color: colors.text }]}>{m}</Text>
        <TouchableOpacity onPress={() => changeMinute(-5)} style={styles.timeArrow} activeOpacity={0.7}>
          <Text style={[styles.timeArrowText, { color: colors.primary }]}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── BottomSheet component ─────────────────────────────────────────────────────

function BottomSheet({ visible, onClose, title, children }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (c: AppColors, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { padding: Spacing.base, gap: Spacing.md },

  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  card: { backgroundColor: c.card, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: c.borderLight },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowTextCol: { flex: 1, gap: 2 },
  rowLabel: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: c.text },
  rowSublabel: { fontSize: FontSize.xs, color: c.textMuted },

  toggleRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  setTimesBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  setTimesBtnText: { fontSize: FontSize.xs, color: c.primary, fontWeight: FontWeight.semibold },

  version: { textAlign: 'center', fontSize: FontSize.xs, color: c.textMuted, marginTop: Spacing.md },

  // ── Bottom Sheet ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.card, borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: c.border,
    alignSelf: 'center', marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },

  // ── Option rows (language / units) ──
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg, marginBottom: Spacing.sm,
  },
  optionRowActive: { backgroundColor: c.primarySurface },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text },
  optionDesc: { fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },

  // ── Units note ──
  unitsNote: {
    backgroundColor: c.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  unitsNoteText: { fontSize: FontSize.sm, color: c.textSecondary, lineHeight: FontSize.sm * 1.5 },

  // ── Reminder times ──
  reminderSubtitle: { fontSize: FontSize.sm, color: c.textSecondary, marginBottom: Spacing.md, lineHeight: FontSize.sm * 1.5 },
  reminderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: c.borderLight,
  },
  reminderMealLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text },
  reminderTimeRow: { flexDirection: 'row', alignItems: 'center' },
  timeSelectorWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  timeSelectorCol: { alignItems: 'center', gap: 4 },
  timeArrow: { padding: 4 },
  timeArrowText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  timeDigit: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold,
    minWidth: 36, textAlign: 'center',
  },
  timeColon: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, marginBottom: 4 },

  // ── Save button (outline in dark, filled in light) ──
  saveBtn: isDark ? {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: 'transparent',
  } : {
    backgroundColor: c.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },

  // ── Full screen modal header ──
  fullModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  fullModalBack: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  fullModalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  // ── Legal Modal content ──
  legalScroll: { padding: Spacing.base, gap: Spacing.md },
  legalHero: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: c.card, borderRadius: BorderRadius.xl,
    padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  legalHeroIcon: {
    width: 56, height: 56, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  legalHeroTitle: {
    fontSize: FontSize.xl, fontWeight: FontWeight.extrabold,
    color: c.text, marginBottom: 4,
  },
  legalUpdatedBadge: {
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2, alignSelf: 'flex-start',
  },
  legalUpdatedText: { fontSize: FontSize.xs, color: c.primary, fontWeight: FontWeight.semibold },

  legalCard: {
    backgroundColor: c.card, borderRadius: BorderRadius.lg,
    padding: Spacing.base, ...Shadow.sm, gap: Spacing.sm,
  },
  legalCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  legalCardIcon: {
    width: 32, height: 32, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  legalCardTitle: {
    fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text, flex: 1,
  },
  legalCardBody: {
    fontSize: FontSize.sm, color: c.textSecondary, lineHeight: FontSize.sm * 1.6,
  },
  legalBullets: { gap: Spacing.xs },
  legalBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  legalBulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  legalBulletText: {
    flex: 1, fontSize: FontSize.sm, color: c.textSecondary, lineHeight: FontSize.sm * 1.6,
  },

  // ── Legal Got it button (outline in dark, filled in light) ──
  legalGotItBtn: isDark ? {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: 'transparent',
  } : {
    backgroundColor: c.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  legalGotItText: {
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },

  // ── Contact ──
  contactEmailBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  contactEmailText: { fontSize: FontSize.sm, color: c.primary, fontWeight: FontWeight.semibold },
  contactLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.textSecondary, marginBottom: Spacing.xs },
  contactInput: {
    borderWidth: 1.5, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.base, marginBottom: Spacing.md,
  },
  contactInputMulti: { height: 120, paddingTop: Spacing.sm },
});
