import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MessageCircle, Mail, Instagram, ChevronDown, ChevronUp, Video } from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../hooks/useTheme';

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { t, raw } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);
  const [expanded, setExpanded] = useState<string | null>(null);
  const FAQ_ITEMS = raw<{ q: string; a: string }[]>('help.faq');

  const CONTACTS = [
    {
      label: t('help.emailUs'),
      sub: 'savorachef@gmail.com',
      icon: Mail,
      color: '#2563EB',
      bg: isDark ? '#0D1C3D' : '#DBEAFE',
      onPress: () => Linking.openURL('mailto:savorachef@gmail.com'),
    },
    {
      label: t('help.instagram'),
      sub: '@savora.cook',
      icon: Instagram,
      color: '#E1306C',
      bg: isDark ? '#2D0A17' : '#FCE4EC',
      onPress: () => Linking.openURL('https://instagram.com/savora.cook'),
    },
    {
      label: t('help.tiktok'),
      sub: '@savora.cook',
      icon: Video,
      color: isDark ? '#FFFFFF' : '#010101',
      bg: isDark ? '#2C2C2E' : '#F0F0F0',
      onPress: () => Linking.openURL('https://tiktok.com/@savora.cook'),
    },
  ];

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  function handleContact(item: typeof CONTACTS[0]) {
    item.onPress().catch(() => Alert.alert(t('errors.title'), t('errors.couldNotOpenLink')));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title={t('help.title')} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.contactRow}>
          {CONTACTS.map((c) => {
            const Icon = c.icon;
            return (
              <TouchableOpacity
                key={c.label}
                style={styles.contactCard}
                activeOpacity={0.8}
                onPress={() => handleContact(c)}
              >
                <View style={[styles.contactIcon, { backgroundColor: c.bg }]}>
                  <Icon size={22} color={c.color} strokeWidth={2} />
                </View>
                <Text style={styles.contactLabel}>{c.label}</Text>
                <Text style={styles.contactSub} numberOfLines={1}>{c.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <MessageCircle size={20} color={colors.primary} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{t('help.responseTimeTitle')}</Text>
            <Text style={styles.infoText}>{t('help.responseTimeText')}</Text>
          </View>
        </View>

        <Text style={styles.faqTitle}>{t('help.faqTitle')}</Text>
        <View style={styles.faqList}>
          {FAQ_ITEMS.map((item, i) => {
            const key = `faq-${i}`;
            const open = expanded === key;
            const isLast = i === FAQ_ITEMS.length - 1;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.faqItem, !isLast && styles.faqDivider]}
                onPress={() => toggle(key)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, open && styles.faqQuestionOpen]}>
                    {item.q}
                  </Text>
                  {open
                    ? <ChevronUp size={18} color={colors.primary} strokeWidth={2} />
                    : <ChevronDown size={18} color={colors.textMuted} strokeWidth={2} />
                  }
                </View>
                {open && (
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll:    { padding: Spacing.base, gap: Spacing.lg },

    contactRow: { flexDirection: 'row', gap: Spacing.md },
    contactCard: {
      flex: 1, backgroundColor: c.card, borderRadius: BorderRadius.lg,
      padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, ...Shadow.sm,
    },
    contactIcon:  { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    contactLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.text, textAlign: 'center' },
    contactSub:   { fontSize: FontSize.xs, color: c.textMuted, textAlign: 'center' },

    infoCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
      backgroundColor: c.primarySurface, borderRadius: BorderRadius.lg, padding: Spacing.base,
    },
    infoTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.text, marginBottom: 4 },
    infoText:  { fontSize: FontSize.sm, color: c.textSecondary, lineHeight: FontSize.sm * 1.5 },

    faqTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
    faqList:  { backgroundColor: c.card, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
    faqItem:  { padding: Spacing.base },
    faqDivider: { borderBottomWidth: 1, borderBottomColor: c.borderLight },
    faqHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md },
    faqQuestion:     { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium, color: c.text },
    faqQuestionOpen: { color: c.primary },
    faqAnswer:       { fontSize: FontSize.sm, color: c.textSecondary, marginTop: Spacing.sm, lineHeight: FontSize.sm * 1.6 },
  });
}
