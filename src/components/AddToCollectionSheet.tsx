import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { X, Check, FolderPlus, Plus } from 'lucide-react-native';
import { AppColors } from '../constants/colors';
import { Spacing, BorderRadius } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import {
  Collection, getCollections, getCollectionsForRecipe,
  addRecipeToCollection, removeRecipeFromCollection, createCollection,
} from '../api/collections';

const EMOJI_CHOICES = ['🍳', '🥗', '🍲', '🍰', '🍕', '🌮', '🍜', '🥘', '🍱', '🥑', '🔥', '⭐'];

interface Props {
  visible: boolean;
  recipeId: string;
  onClose: () => void;
  /** Fired after any add/remove so the parent can refresh (e.g. toast, counts). */
  onChanged?: () => void;
}

export function AddToCollectionSheet({ visible, recipeId, onClose, onChanged }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState(EMOJI_CHOICES[0]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cols, mine] = await Promise.all([
        getCollections(),
        getCollectionsForRecipe(recipeId),
      ]);
      setCollections(cols.data);
      setSelected(new Set(mine.data.collection_ids));
    } catch {
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    if (visible) { setShowCreate(false); setNewName(''); load(); }
  }, [visible, load]);

  async function toggle(collectionId: string) {
    const has = selected.has(collectionId);
    setSelected((prev) => {
      const next = new Set(prev);
      if (has) next.delete(collectionId); else next.add(collectionId);
      return next;
    });
    try {
      if (has) await removeRecipeFromCollection(collectionId, recipeId);
      else     await addRecipeToCollection(collectionId, recipeId);
      onChanged?.();
    } catch {
      // revert on failure
      setSelected((prev) => {
        const next = new Set(prev);
        if (has) next.add(collectionId); else next.delete(collectionId);
        return next;
      });
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const res = await createCollection({ name, emoji: newEmoji });
      const col = res.data;
      setCollections((prev) => [col, ...prev]);
      // add the recipe straight into the freshly-created collection
      await addRecipeToCollection(col.id, recipeId);
      setSelected((prev) => new Set(prev).add(col.id));
      onChanged?.();
      setShowCreate(false);
      setNewName('');
      setNewEmoji(EMOJI_CHOICES[0]);
    } catch {
      /* ignore */
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{t('saved.addToCollection')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {collections.length === 0 && !showCreate && (
                <Text style={styles.empty}>{t('saved.emptyCollectionSub')}</Text>
              )}
              {collections.map((col) => {
                const checked = selected.has(col.id);
                return (
                  <TouchableOpacity key={col.id} style={styles.row} onPress={() => toggle(col.id)} activeOpacity={0.75}>
                    <Text style={styles.rowEmoji}>{col.emoji ?? '📗'}</Text>
                    <Text style={styles.rowName} numberOfLines={1}>{col.name}</Text>
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Check size={14} color={colors.textInverse} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {showCreate ? (
            <View style={styles.createBox}>
              <TextInput
                style={styles.input}
                placeholder={t('saved.collectionNamePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                maxLength={60}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
                {EMOJI_CHOICES.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.emojiBtn, newEmoji === e && styles.emojiBtnActive]}
                    onPress={() => setNewEmoji(e)}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[styles.primaryBtn, (!newName.trim() || creating) && styles.primaryBtnDisabled]}
                onPress={handleCreate}
                disabled={!newName.trim() || creating}
                activeOpacity={0.85}
              >
                {creating ? <ActivityIndicator size="small" color={colors.textInverse} /> : (
                  <>
                    <Plus size={16} color={colors.textInverse} strokeWidth={2.5} />
                    <Text style={styles.primaryBtnText}>{t('saved.create')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)} activeOpacity={0.8}>
              <FolderPlus size={16} color={colors.primary} strokeWidth={2} />
              <Text style={styles.newBtnText}>{t('saved.newCollection')}</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: Spacing.md }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.card, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, maxHeight: '85%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text, flex: 1 },
  loadingBox: { paddingVertical: Spacing.xl, alignItems: 'center' },
  empty: { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: c.borderLight,
  },
  rowEmoji: { fontSize: 20 },
  rowName: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium, color: c.text },
  checkbox: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: c.primary, borderColor: c.primary },

  newBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: Spacing.md, marginTop: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: c.primary, borderStyle: 'dashed',
  },
  newBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.primary },

  createBox: { marginTop: Spacing.md, gap: Spacing.md },
  input: {
    borderWidth: 1.5, borderColor: c.border, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.base, color: c.text, backgroundColor: c.surface,
  },
  emojiRow: { gap: Spacing.sm, paddingVertical: 2 },
  emojiBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.lg,
    backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: c.borderLight,
  },
  emojiBtnActive: { borderColor: c.primary, backgroundColor: c.primarySurface },
  emojiText: { fontSize: 22 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingVertical: Spacing.md,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: c.textInverse, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
