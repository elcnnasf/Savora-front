import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Minus, Plus, Check, Trash2 } from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useScanBasketStore } from '../../store/scanBasketStore';
import { UNIT_ORDER, UnitId, unitLabel, stepFor } from '../../utils/ingredientUnits';
import { localizeIngredient } from '../../data/ingredientCatalog';

export default function IngredientAmountsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  const styles = makeStyles(colors);

  const items  = useScanBasketStore((s) => s.items);
  const update = useScanBasketStore((s) => s.update);
  const remove = useScanBasketStore((s) => s.remove);

  function changeAmount(name: string, unit: UnitId, current: number, dir: 1 | -1) {
    const step = stepFor(unit);
    let next = Math.round((current + dir * step) * 100) / 100;
    if (next < step) next = step; // never drop below one step (remove on the scan screen)
    update(name, { amount: next });
  }

  function setAmountText(name: string, txt: string) {
    if (txt.trim() === '') { update(name, { amount: 0 }); return; }
    const n = parseFloat(txt.replace(',', '.'));
    if (!isNaN(n) && n >= 0) update(name, { amount: n });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('scan.amountsTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>{t('scan.amountsSubtitle')}</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {items.map((item) => (
          <View key={item.name} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name} numberOfLines={1}>{localizeIngredient(item.name, lang)}</Text>
              <TouchableOpacity onPress={() => remove(item.name)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Trash2 size={16} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Amount stepper */}
            <View style={styles.amountRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => changeAmount(item.name, item.unit, item.amount, -1)}
                activeOpacity={0.75}
              >
                <Minus size={18} color={colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={styles.amountValueWrap}>
                <TextInput
                  style={styles.amountInput}
                  value={String(item.amount)}
                  onChangeText={(txt) => setAmountText(item.name, txt)}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text style={styles.amountUnit}>{unitLabel(item.unit, lang)}</Text>
              </View>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => changeAmount(item.name, item.unit, item.amount, 1)}
                activeOpacity={0.75}
              >
                <Plus size={18} color={colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Unit selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.unitRow}
            >
              {UNIT_ORDER.map((u) => {
                const active = item.unit === u;
                return (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, active && styles.unitChipActive]}
                    onPress={() => update(item.name, { unit: u })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.unitChipText, active && styles.unitChipTextActive]}>
                      {unitLabel(u, lang)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ))}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
          <Check size={18} color={colors.textInverse} strokeWidth={2.5} />
          <Text style={styles.doneBtnText}>{t('scan.done')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
  subtitle: {
    fontSize: FontSize.sm, color: c.textMuted,
    paddingHorizontal: Spacing.base, marginBottom: Spacing.md,
  },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md },

  card: {
    backgroundColor: c.card, borderRadius: BorderRadius.xl,
    padding: Spacing.base, gap: Spacing.md,
    borderWidth: 1, borderColor: c.borderLight, ...Shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  name: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: c.text },

  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  stepBtn: {
    width: 46, height: 46, borderRadius: BorderRadius.lg,
    backgroundColor: c.primarySurface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.primary + '30',
  },
  amountValueWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  amountInput: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: c.text,
    textAlign: 'center', minWidth: 90, padding: 0,
  },
  amountUnit: { fontSize: FontSize.xs, color: c.textMuted, marginTop: 2, fontWeight: FontWeight.semibold },

  unitRow: { gap: Spacing.sm, paddingVertical: 2 },
  unitChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: BorderRadius.full, backgroundColor: c.surface,
    borderWidth: 1.5, borderColor: c.border,
  },
  unitChipActive: { backgroundColor: c.primary, borderColor: c.primary },
  unitChipText: { fontSize: FontSize.xs, color: c.textSecondary, fontWeight: FontWeight.semibold },
  unitChipTextActive: { color: c.textInverse },

  footer: {
    padding: Spacing.base, borderTopWidth: 1, borderTopColor: c.border,
    backgroundColor: c.background,
  },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingVertical: Spacing.base,
  },
  doneBtnText: { color: c.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
