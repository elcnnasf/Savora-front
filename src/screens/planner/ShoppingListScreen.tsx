import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Plus, X, Check, Trash2 } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Header } from '../../components/ui/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  getShoppingList, addItem, updateItem, deleteItem,
  clearChecked, ShoppingItem,
} from '../../api/shoppingList';

const CAT_COLORS: Record<string, string> = {
  Et:          '#EF4444',
  Yag:         '#F59E0B',
  Terevez:     '#10B981',
  'Ədviyyat':  '#8B5CF6',
  Produce:     Colors.catProduce,
  'Dairy & Eggs': Colors.catDairy,
  'Meat & Fish':  Colors.catMeat,
  Pantry:      Colors.catPantry,
  Other:       Colors.textMuted,
};

export default function ShoppingListScreen() {
  const navigation = useNavigation();

  const [items,        setItems]        = useState<ShoppingItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [newItem,      setNewItem]      = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [saving,       setSaving]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getShoppingList();
      setItems(res.data.items);
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

  // Group by category
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
      await addItem(newItem.trim());
      setNewItem('');
      setShowAddInput(false);
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not add item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: ShoppingItem) {
    try {
      await updateItem(item.id, { is_checked: !item.is_checked });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_checked: !i.is_checked } : i));
    } catch { /* silent */ }
  }

  async function handleDelete(id: string) {
    try {
      await deleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { /* silent */ }
  }

  async function handleClearChecked() {
    try {
      await clearChecked();
      setItems((prev) => prev.filter((i) => !i.is_checked));
    } catch { /* silent */ }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header
        title="Shopping List"
        onBack={() => navigation.goBack()}
        showMore={checkedCount > 0}
        onMore={handleClearChecked}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressCheck}>
              <Check size={14} color={Colors.primary} strokeWidth={3} />
            </View>
            <Text style={styles.progressText}>{checkedCount} of {totalCount} items done</Text>
            <Text style={styles.progressPct}>{Math.round(progress)}%</Text>
          </View>
          <ProgressBar progress={progress} height={6} />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading list…</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Your shopping list is empty.</Text>
            <Text style={styles.emptyHint}>Tap "Add Item" to get started, or add ingredients from a recipe.</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([category, categoryItems]) => (
            <View key={category} style={styles.category}>
              <Text style={[styles.categoryTitle, { color: CAT_COLORS[category] ?? Colors.primary }]}>
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
                      {item.is_checked && <Check size={12} color={Colors.textInverse} strokeWidth={3} />}
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
                      <X size={14} color={Colors.textMuted} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Inline add input */}
        {showAddInput && (
          <View style={styles.addInputRow}>
            <TextInput
              style={styles.addInput}
              value={newItem}
              onChangeText={setNewItem}
              placeholder="Add item..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity style={styles.addConfirmBtn} onPress={handleAdd} activeOpacity={0.8} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={Colors.textInverse} />
                : <Check size={16} color={Colors.textInverse} strokeWidth={3} />}
            </TouchableOpacity>
          </View>
        )}

        {checkedCount > 0 && !loading && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearChecked} activeOpacity={0.8}>
            <Trash2 size={15} color={Colors.error} strokeWidth={2} />
            <Text style={styles.clearBtnText}>Clear checked items ({checkedCount})</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={() => setShowAddInput(true)}>
          <Plus size={20} color={Colors.textInverse} strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  scroll:      { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  loadingBox:  { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  emptyBox:    { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  emptyText:   { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text, textAlign: 'center' },
  emptyHint:   { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: FontSize.sm * 1.5 },

  progressCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.sm, ...Shadow.sm,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressCheck:  { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  progressText:   { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text },
  progressPct:    { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },

  category:      { marginBottom: Spacing.lg },
  categoryTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryItems: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  itemRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  checkbox:        { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  itemTextCol:     { flex: 1 },
  itemName:        { fontSize: FontSize.base, color: Colors.text },
  itemNameChecked: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  itemQty:         { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  removeBtn:       { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },

  addInputRow: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md,
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.sm, ...Shadow.sm,
  },
  addInput:      { flex: 1, fontSize: FontSize.base, color: Colors.text, paddingHorizontal: Spacing.sm },
  addConfirmBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  clearBtn:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'center', paddingVertical: Spacing.md },
  clearBtnText: { fontSize: FontSize.sm, color: Colors.error, fontWeight: FontWeight.medium },

  footer:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.base },
  addBtn:      { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: Spacing.base + 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  addBtnText:  { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
