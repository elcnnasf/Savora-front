import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Plus, X, Check, Trash2, CloudOff } from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ShoppingItem } from '../../api/shoppingList';
import * as shoppingList from '../../services/shoppingListOffline';

const FIXED_CAT_COLORS: Record<string, string> = {
  Et:          '#EF4444',
  Yag:         '#F59E0B',
  Terevez:     '#10B981',
  'Ədviyyat':  '#8B5CF6',
};

function getCatColors(c: AppColors): Record<string, string> {
  return {
    ...FIXED_CAT_COLORS,
    Produce:        c.catProduce,
    'Dairy & Eggs': c.catDairy,
    'Meat & Fish':  c.catMeat,
    Pantry:         c.catPantry,
    Other:          c.textMuted,
  };
}

export default function ShoppingListScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);
  const CAT_COLORS = getCatColors(colors);

  const [items,        setItems]        = useState<ShoppingItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [newItem,      setNewItem]      = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [offline,      setOffline]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shoppingList.loadList();
      setItems(res.items);
      setOffline(res.offline);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const checkedCount = items.filter((i) => i.is_checked).length;
  const totalCount   = items.length;
  const progress     = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  const grouped: Record<string, ShoppingItem[]> = {};
  for (const item of items) {
    const cat = item.category ?? 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  async function handleAdd() {
    if (!newItem.trim()) return;
    setSaving(true);
    try {
      const res = await shoppingList.add(newItem.trim());
      setItems(res.items);
      setOffline(res.offline);
      setNewItem('');
      setShowAddInput(false);
    } catch (err: any) {
      Alert.alert(t('shoppingList.errorTitle'), err?.message ?? t('shoppingList.addError'));
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(item: ShoppingItem) {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_checked: !i.is_checked } : i));
    shoppingList.toggle(item.id, !item.is_checked).catch(() => {});
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    shoppingList.remove(id).catch(() => {});
  }

  function handleClearChecked() {
    setItems((prev) => prev.filter((i) => !i.is_checked));
    shoppingList.clearCheckedItems().catch(() => {});
  }

  function handleClearAll() {
    Alert.alert(
      t('shoppingList.clearAllConfirmTitle'),
      t('shoppingList.clearAllConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setItems([]);
            shoppingList.clearAllItems().catch(() => {});
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header
        title={t('shoppingList.title')}
        onBack={() => navigation.goBack()}
        showMore={checkedCount > 0}
        onMore={handleClearChecked}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {offline && (
          <View style={styles.offlineBanner}>
            <CloudOff size={14} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.offlineText}>{t('shoppingList.offlineNote')}</Text>
          </View>
        )}

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressCheck}>
              <Check size={14} color={colors.primary} strokeWidth={3} />
            </View>
            <Text style={styles.progressText}>{checkedCount} {t('shoppingList.of')} {totalCount} {t('shoppingList.itemsDone')}</Text>
            <Text style={styles.progressPct}>{Math.round(progress)}%</Text>
          </View>
          <ProgressBar progress={progress} height={6} />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>{t('shoppingList.loading')}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{t('shoppingList.empty')}</Text>
            <Text style={styles.emptyHint}>{t('shoppingList.emptyHint')}</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([category, categoryItems]) => (
            <View key={category} style={styles.category}>
              <Text style={[styles.categoryTitle, { color: CAT_COLORS[category] ?? colors.primary }]}>
                {category}
              </Text>
              <View style={styles.categoryItems}>
                {categoryItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemRow}
                    onPress={() => handleToggle(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}>
                      {item.is_checked && <Check size={12} color={colors.textInverse} strokeWidth={3} />}
                    </View>
                    <View style={styles.itemTextCol}>
                      <Text style={[styles.itemName, item.is_checked && styles.itemNameChecked]}>
                        {item.name}
                      </Text>
                      {item.quantity ? (
                        <Text style={styles.itemQty}>{item.quantity}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleDelete(item.id)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={14} color={colors.textMuted} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}

        {showAddInput && (
          <View style={styles.addInputRow}>
            <TextInput
              style={styles.addInput}
              value={newItem}
              onChangeText={setNewItem}
              placeholder={t('shoppingList.addPlaceholder')}
              placeholderTextColor={colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity style={styles.addConfirmBtn} onPress={handleAdd} activeOpacity={0.8} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Check size={16} color={colors.textInverse} strokeWidth={3} />}
            </TouchableOpacity>
          </View>
        )}

        {checkedCount > 0 && !loading && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearChecked} activeOpacity={0.8}>
            <Trash2 size={15} color={colors.error} strokeWidth={2} />
            <Text style={styles.clearBtnText}>{t('shoppingList.clearChecked')} ({checkedCount})</Text>
          </TouchableOpacity>
        )}

        {totalCount > 0 && !loading && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll} activeOpacity={0.8}>
            <Trash2 size={15} color={colors.error} strokeWidth={2} />
            <Text style={styles.clearBtnText}>{t('shoppingList.clearAll')} ({totalCount})</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={() => setShowAddInput(true)}>
          <Plus size={20} color={colors.textInverse} strokeWidth={2.5} />
          <Text style={styles.addBtnText}>{t('shoppingList.addItem')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: c.background },
    scroll:      { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
    loadingBox:  { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
    loadingText: { fontSize: FontSize.sm, color: c.textMuted },
    emptyBox:    { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm, paddingHorizontal: Spacing.xl },
    emptyText:   { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text, textAlign: 'center' },
    emptyHint:   { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', lineHeight: FontSize.sm * 1.5 },

    offlineBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      backgroundColor: c.borderLight, borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
    },
    offlineText: { fontSize: FontSize.xs, color: c.textMuted, flexShrink: 1 },

    progressCard: {
      backgroundColor: c.card, borderRadius: BorderRadius.lg,
      padding: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.sm, ...Shadow.sm,
    },
    progressHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    progressCheck:  { width: 24, height: 24, borderRadius: 12, backgroundColor: c.primarySurface, alignItems: 'center', justifyContent: 'center' },
    progressText:   { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: c.text },
    progressPct:    { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.primary },

    category:      { marginBottom: Spacing.lg },
    categoryTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
    categoryItems: { backgroundColor: c.card, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
    itemRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: c.borderLight },
    checkbox:        { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    checkboxChecked: { backgroundColor: c.primary, borderColor: c.primary },
    itemTextCol:     { flex: 1 },
    itemName:        { fontSize: FontSize.base, color: c.text },
    itemNameChecked: { color: c.textMuted, textDecorationLine: 'line-through' },
    itemQty:         { fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 },
    removeBtn:       { width: 28, height: 28, borderRadius: 14, backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center' },

    addInputRow: {
      flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md,
      backgroundColor: c.card, borderRadius: BorderRadius.lg, padding: Spacing.sm, ...Shadow.sm,
    },
    addInput:      { flex: 1, fontSize: FontSize.base, color: c.text, paddingHorizontal: Spacing.sm },
    addConfirmBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },

    clearBtn:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'center', paddingVertical: Spacing.md },
    clearBtnText: { fontSize: FontSize.sm, color: c.error, fontWeight: FontWeight.medium },

    footer:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border, padding: Spacing.base },
    addBtn:     { backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingVertical: Spacing.base + 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
    addBtnText: { color: c.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  });
}
