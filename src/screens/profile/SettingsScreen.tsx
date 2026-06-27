import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Bell, Globe, Ruler, Moon, Shield, FileText, Mail, ChevronRight, Check,
} from 'lucide-react-native';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { AppColors } from '../../constants/colors';
import { Header } from '../../components/ui/Header';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

const LANGUAGES = ['English', 'Azerbaijani', 'Russian', 'Turkish'];
const LANG_NATIVE: Record<string, string> = {
  English: 'English',
  Azerbaijani: 'Azərbaycan dili',
  Russian: 'Русский',
  Turkish: 'Türkçe',
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const {
    darkMode, setDarkMode,
    mealReminders, setMealReminders,
    recipeSuggestions, setRecipeSuggestions,
    cookingTips, setCookingTips,
    language, setLanguage,
    units,
  } = useUserStore();

  const [langModalVisible, setLangModalVisible] = useState(false);

  function getToggleValue(key: string): boolean {
    if (key === 'darkMode') return darkMode;
    if (key === 'mealReminders') return mealReminders;
    if (key === 'weeklyReports') return recipeSuggestions;
    if (key === 'push') return cookingTips;
    return false;
  }

  function handleToggle(key: string, val: boolean) {
    if (key === 'darkMode') { setDarkMode(val); return; }
    if (key === 'mealReminders') { setMealReminders(val); return; }
    if (key === 'weeklyReports') { setRecipeSuggestions(val); return; }
    if (key === 'push') { setCookingTips(val); return; }
  }

  const SECTIONS = [
    {
      title: t('settings.notifications'),
      items: [
        { label: t('settings.pushNotifications'), icon: Bell, type: 'toggle', key: 'push', color: colors.primary },
        { label: t('settings.mealReminders'), icon: Bell, type: 'toggle', key: 'mealReminders', color: colors.info },
        { label: t('settings.weeklyReports'), icon: Bell, type: 'toggle', key: 'weeklyReports', color: '#7C3AED' },
      ],
    },
    {
      title: t('settings.preferences'),
      items: [
        { label: t('settings.darkMode'), icon: Moon, type: 'toggle', key: 'darkMode', color: colors.textSecondary },
        { label: t('settings.language'), icon: Globe, type: 'language', value: LANG_NATIVE[language] ?? language, color: colors.info },
        { label: t('settings.units'), icon: Ruler, type: 'value', value: units, color: '#7C3AED' },
      ],
    },
    {
      title: t('settings.legal'),
      items: [
        { label: t('settings.privacyPolicy'), icon: Shield, type: 'nav', color: colors.textMuted },
        { label: t('settings.termsOfService'), icon: FileText, type: 'nav', color: colors.textMuted },
        { label: t('settings.contactUs'), icon: Mail, type: 'nav', color: colors.textMuted },
      ],
    },
  ];

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

                return (
                  <View key={item.label} style={[styles.row, !isLast && styles.rowDivider]}>
                    <View style={[styles.iconWrap, { backgroundColor: (item.color) + '22' }]}>
                      <Icon size={18} color={item.color} strokeWidth={2} />
                    </View>
                    <Text style={styles.rowLabel}>{item.label}</Text>

                    {item.type === 'toggle' && (
                      <Switch
                        value={getToggleValue(item.key!)}
                        onValueChange={(v) => handleToggle(item.key!, v)}
                        trackColor={{ false: colors.borderLight, true: colors.primary + '80' }}
                        thumbColor={getToggleValue(item.key!) ? colors.primary : colors.textMuted}
                      />
                    )}
                    {item.type === 'language' && (
                      <TouchableOpacity
                        style={styles.valueRow}
                        onPress={() => setLangModalVisible(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.valueText}>{item.value}</Text>
                        <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                    {item.type === 'value' && (
                      <TouchableOpacity style={styles.valueRow} activeOpacity={0.7}>
                        <Text style={styles.valueText}>{item.value}</Text>
                        <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                    {item.type === 'nav' && (
                      <TouchableOpacity activeOpacity={0.7}>
                        <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <Text style={styles.version}>{t('settings.version')}</Text>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <Pressable style={styles.langSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('settings.selectLanguage')}</Text>

            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langRow, language === lang && styles.langRowActive]}
                onPress={() => { setLanguage(lang); setLangModalVisible(false); }}
                activeOpacity={0.75}
              >
                <View style={styles.langInfo}>
                  <Text style={styles.langName}>{lang}</Text>
                  <Text style={styles.langNative}>{LANG_NATIVE[lang]}</Text>
                </View>
                {language === lang && (
                  <Check size={18} color={colors.primary} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            ))}

            <View style={{ height: Spacing.xl }} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
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
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium, color: c.text },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valueText: { fontSize: FontSize.sm, color: c.textSecondary },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: c.textMuted, marginTop: Spacing.md },

  // Language modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  langSheet: {
    backgroundColor: c.card, borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: c.border,
    alignSelf: 'center', marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text,
    marginBottom: Spacing.md, textAlign: 'center',
  },
  langRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg, marginBottom: Spacing.sm,
  },
  langRowActive: { backgroundColor: c.primarySurface },
  langInfo: { flex: 1 },
  langName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text },
  langNative: { fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },
});
