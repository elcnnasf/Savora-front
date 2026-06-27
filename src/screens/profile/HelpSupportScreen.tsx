import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MessageCircle, Mail, Instagram, ChevronDown, ChevronUp, Video } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { FAQ_ITEMS } from '../../data/mockData';

const CONTACTS = [
  {
    label: 'Email Us',
    sub: 'savorachef@gmail.com',
    icon: Mail,
    color: '#2563EB',
    bg: '#DBEAFE',
    onPress: () => Linking.openURL('mailto:savorachef@gmail.com'),
  },
  {
    label: 'Instagram',
    sub: '@savora.cook',
    icon: Instagram,
    color: '#E1306C',
    bg: '#FCE4EC',
    onPress: () => Linking.openURL('https://instagram.com/savora.cook'),
  },
  {
    label: 'TikTok',
    sub: '@savora.cook',
    icon: Video,
    color: '#010101',
    bg: '#F0F0F0',
    onPress: () => Linking.openURL('https://tiktok.com/@savora.cook'),
  },
];

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  function handleContact(item: typeof CONTACTS[0]) {
    item.onPress().catch(() => Alert.alert('Error', 'Could not open link.'));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Help & Support" onBack={() => navigation.goBack()} />

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
          <MessageCircle size={20} color={Colors.primary} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Response Time</Text>
            <Text style={styles.infoText}>
              We typically respond within 24–48 hours via email. Follow us on social media for updates and tips!
            </Text>
          </View>
        </View>

        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
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
                    ? <ChevronUp size={18} color={Colors.primary} strokeWidth={2} />
                    : <ChevronDown size={18} color={Colors.textMuted} strokeWidth={2} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, gap: Spacing.lg },
  contactRow: { flexDirection: 'row', gap: Spacing.md },
  contactCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, ...Shadow.sm,
  },
  contactIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center' },
  contactSub: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.lg, padding: Spacing.base,
  },
  infoTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 4 },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: FontSize.sm * 1.5 },
  faqTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  faqList: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  faqItem: { padding: Spacing.base },
  faqDivider: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md },
  faqQuestion: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.text },
  faqQuestionOpen: { color: Colors.primary },
  faqAnswer: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: FontSize.sm * 1.6 },
});
