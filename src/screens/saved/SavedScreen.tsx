import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Pressable, TextInput, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bookmark, Clock, Flame, LogIn, BookmarkX, CloudOff, Star, UtensilsCrossed,
  Plus, FolderPlus, Share2, Trash2, X, Check, FolderHeart,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { RootStackParamList, ApiRecipe } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { getSavedRecipes, unsaveRecipe } from '../../api/recipes';
import {
  Collection, getCollections, createCollection, deleteCollection,
  getCollectionRecipes, addRecipeToCollection, removeRecipeFromCollection,
  getCollectionsForRecipe, shareCollection,
} from '../../api/collections';
import { localizeRecipes } from '../../utils/recipeLocale';
import { SafeImage } from '../../components/ui/SafeImage';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SAVED_CACHE_PREFIX = 'savora_saved_cache_';
const EMOJI_CHOICES = ['🍳', '🥗', '🍲', '🍰', '🍕', '🌮', '🍜', '🥘', '🍱', '🥑', '🔥', '⭐'];

function isNetworkError(e: any): boolean {
  return e instanceof TypeError || /network request failed|failed to fetch/i.test(e?.message ?? '');
}

export default function SavedScreen() {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated, user } = useAuthStore();
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  const styles = makeStyles(colors);

  const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    'High Protein': { bg: colors.tagHighProtein,  text: colors.tagHighProteinText },
    Comfort:        { bg: colors.tagComfort,       text: colors.tagComfortText },
    Healthy:        { bg: colors.tagHealthy,       text: colors.tagHealthyText },
    Vegan:          { bg: colors.tagVegan,         text: colors.tagVeganText },
    Quick:          { bg: colors.tagQuick,         text: colors.tagQuickText },
  };

  const [recipes, setRecipes] = useState<ApiRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [unsaving, setUnsaving] = useState<string | null>(null);

  // Collections ("playlists")
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null); // null = All
  const [collectionRecipes, setCollectionRecipes] = useState<ApiRecipe[]>([]);
  const [loadingCollection, setLoadingCollection] = useState(false);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState(EMOJI_CHOICES[0]);
  const [creating, setCreating] = useState(false);
  const [sheetRecipe, setSheetRecipe] = useState<ApiRecipe | null>(null);
  const [sheetIds, setSheetIds] = useState<Set<string>>(new Set());

  const cacheKey = user?.id ? SAVED_CACHE_PREFIX + user.id : null;
  const selectedCollection = collections.find((c) => c.id === selectedId) ?? null;

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getSavedRecipes();
      setRecipes(res.data);
      setOffline(false);
      if (cacheKey) AsyncStorage.setItem(cacheKey, JSON.stringify(res.data)).catch(() => {});
    } catch (e) {
      if (isNetworkError(e) && cacheKey) {
        try {
          const raw = await AsyncStorage.getItem(cacheKey);
          if (raw) { setRecipes(JSON.parse(raw)); setOffline(true); return; }
        } catch { /* fall through */ }
      }
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, cacheKey]);

  const loadCollections = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getCollections();
      setCollections(res.data);
    } catch { /* keep previous */ }
  }, [isAuthenticated]);

  useFocusEffect(useCallback(() => { load(); loadCollections(); }, [load, loadCollections]));

  async function selectCollection(id: string | null) {
    setSelectedId(id);
    if (id === null) return;
    setLoadingCollection(true);
    try {
      const res = await getCollectionRecipes(id);
      setCollectionRecipes(res.data.recipes);
    } catch {
      setCollectionRecipes([]);
    } finally {
      setLoadingCollection(false);
    }
  }

  async function handleUnsave(recipe: ApiRecipe) {
    Alert.alert(
      t('saved.confirmUnsave'),
      `${t('saved.removeQuestionPrefix')}${recipe.title}${t('saved.removeQuestionSuffix')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('saved.unsave'),
          style: 'destructive',
          onPress: async () => {
            setUnsaving(recipe.id);
            try {
              await unsaveRecipe(recipe.id);
              setRecipes((prev) => {
                const next = prev.filter((r) => r.id !== recipe.id);
                if (cacheKey) AsyncStorage.setItem(cacheKey, JSON.stringify(next)).catch(() => {});
                return next;
              });
              setCollectionRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
              loadCollections();
            } catch (err: any) {
              Alert.alert(t('errors.title'), err?.message ?? t('errors.couldNotRemoveRecipe'));
            } finally {
              setUnsaving(null);
            }
          },
        },
      ],
    );
  }

  // ── Create collection ──────────────────────────────────────────────────
  async function handleCreate() {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const res = await createCollection({ name, emoji: newEmoji });
      setCollections((prev) => [res.data, ...prev]);
      setCreateOpen(false);
      setNewName('');
      setNewEmoji(EMOJI_CHOICES[0]);
      selectCollection(res.data.id);
    } catch (err: any) {
      Alert.alert(t('errors.title'), err?.message ?? '');
    } finally {
      setCreating(false);
    }
  }

  // ── Add-to-collection sheet ────────────────────────────────────────────
  async function openAddSheet(recipe: ApiRecipe) {
    setSheetRecipe(recipe);
    setSheetIds(new Set());
    try {
      const res = await getCollectionsForRecipe(recipe.id);
      setSheetIds(new Set(res.data.collection_ids));
    } catch { /* start empty */ }
  }

  async function toggleInCollection(collectionId: string) {
    if (!sheetRecipe) return;
    const has = sheetIds.has(collectionId);
    // optimistic
    setSheetIds((prev) => {
      const next = new Set(prev);
      if (has) next.delete(collectionId); else next.add(collectionId);
      return next;
    });
    try {
      if (has) await removeRecipeFromCollection(collectionId, sheetRecipe.id);
      else     await addRecipeToCollection(collectionId, sheetRecipe.id);
      loadCollections();
      if (selectedId === collectionId) selectCollection(collectionId);
    } catch {
      // revert
      setSheetIds((prev) => {
        const next = new Set(prev);
        if (has) next.add(collectionId); else next.delete(collectionId);
        return next;
      });
    }
  }

  // ── Share / delete a collection ────────────────────────────────────────
  async function handleShareCollection(col: Collection) {
    try {
      const res = await getCollectionRecipes(col.id);
      const list = res.data.recipes;
      try { await shareCollection(col.id); } catch { /* share link best-effort */ }
      const lines = [
        `${col.emoji ?? '📗'} ${col.name} — ${t('saved.sharedCollectionIntro')}`,
        '',
        ...list.map((r, i) => `${i + 1}. ${r.title}${r.cook_time ? ` · ${r.cook_time} ${t('recipe.min')}` : ''}`),
        '',
        '🧡 Savora',
      ];
      await Share.share({ message: lines.join('\n'), title: col.name });
    } catch { /* dismissed */ }
  }

  function handleDeleteCollection(col: Collection) {
    Alert.alert(
      t('saved.deleteCollection'),
      t('saved.deleteCollectionConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('saved.deleteCollection'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCollection(col.id);
              setCollections((prev) => prev.filter((c) => c.id !== col.id));
              if (selectedId === col.id) selectCollection(null);
            } catch (err: any) {
              Alert.alert(t('errors.title'), err?.message ?? '');
            }
          },
        },
      ],
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('nav.saved')}</Text>
        </View>
        <View style={styles.guestWall}>
          <View style={styles.guestIcon}>
            <Bookmark size={40} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.guestTitle}>{t('saved.signInPrompt')}</Text>
          <Text style={styles.guestSubtitle}>{t('saved.signInDesc')}</Text>
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

  const displayRecipes = selectedId === null ? recipes : collectionRecipes;
  const showLoading = selectedId === null ? loading : loadingCollection;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.saved')}</Text>
        {!loading && recipes.length > 0 && (
          <View style={styles.countChip}>
            <Bookmark size={12} color={colors.primary} fill={colors.primary} strokeWidth={2} />
            <Text style={styles.countChipText}>{recipes.length} {t('saved.recipesLabel')}</Text>
          </View>
        )}
      </View>

      {/* ── Collection chips ─────────────────────────────────────────────── */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[styles.chip, selectedId === null && styles.chipActive]}
            onPress={() => selectCollection(null)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, selectedId === null && styles.chipTextActive]}>
              {t('saved.allRecipes')}
            </Text>
          </TouchableOpacity>

          {collections.map((col) => {
            const active = selectedId === col.id;
            return (
              <TouchableOpacity
                key={col.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => selectCollection(col.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.chipEmoji}>{col.emoji ?? '📗'}</Text>
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {col.name}
                </Text>
                <View style={[styles.chipCount, active && styles.chipCountActive]}>
                  <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>{col.recipe_count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.chipNew}
            onPress={() => setCreateOpen(true)}
            activeOpacity={0.8}
          >
            <FolderPlus size={14} color={colors.primary} strokeWidth={2.2} />
            <Text style={styles.chipNewText}>{t('saved.newCollection')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Selected-collection action bar ───────────────────────────────── */}
      {selectedCollection && (
        <View style={styles.collectionBar}>
          <TouchableOpacity style={styles.collectionBarBtn} onPress={() => handleShareCollection(selectedCollection)} activeOpacity={0.8}>
            <Share2 size={14} color={colors.primary} strokeWidth={2} />
            <Text style={styles.collectionBarBtnText}>{t('saved.shareCollection')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.collectionBarBtn} onPress={() => handleDeleteCollection(selectedCollection)} activeOpacity={0.8}>
            <Trash2 size={14} color={colors.error ?? '#EF4444'} strokeWidth={2} />
            <Text style={[styles.collectionBarBtnText, { color: colors.error ?? '#EF4444' }]}>{t('saved.deleteCollection')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {offline && !loading && (
        <View style={styles.offlineBanner}>
          <CloudOff size={14} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.offlineText}>{t('saved.offlineNote')}</Text>
        </View>
      )}

      {showLoading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.card, styles.skeletonCard]}>
              <View style={[styles.thumbnail, styles.skeletonBlock]} />
              <View style={styles.cardInfo}>
                <View style={[styles.skeletonBlock, styles.skeletonLineWide]} />
                <View style={[styles.skeletonBlock, styles.skeletonLineNarrow]} />
                <View style={[styles.skeletonBlock, styles.skeletonChip]} />
              </View>
            </View>
          ))}
        </View>
      ) : displayRecipes.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            {selectedId === null
              ? <BookmarkX size={40} color={colors.textMuted} strokeWidth={1.5} />
              : <FolderHeart size={40} color={colors.textMuted} strokeWidth={1.5} />}
          </View>
          <Text style={styles.emptyTitle}>{selectedId === null ? t('saved.empty') : t('saved.emptyCollection')}</Text>
          <Text style={styles.emptySubtitle}>{selectedId === null ? t('saved.emptySubtitle') : t('saved.emptyCollectionSub')}</Text>
          {selectedId === null && (
            <TouchableOpacity
              style={styles.discoverBtn}
              activeOpacity={0.85}
              onPress={() => (navigation as any).navigate('Discover')}
            >
              <Text style={styles.discoverBtnText}>{t('saved.exploreRecipes')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {localizeRecipes(displayRecipes, lang).map((recipe) => {
            const primaryTag = recipe.tags?.[0];
            const tagStyle = TAG_COLORS[primaryTag] ?? { bg: colors.primarySurface, text: colors.primary };
            const cookTime = recipe.cook_time ?? 0;
            const prepTime = recipe.prep_time ?? 0;
            const totalTime = cookTime + prepTime;

            return (
              <TouchableOpacity
                key={recipe.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('RecipeDetail', { recipe })}
              >
                <View style={styles.thumbWrap}>
                  <SafeImage
                    uri={recipe.image_url}
                    style={styles.thumbnail}
                    containerStyle={[styles.thumbnail, styles.thumbnailPlaceholder]}
                    fallback={<UtensilsCrossed size={26} color={colors.textMuted} strokeWidth={1.5} />}
                  />
                  {recipe.is_ai_generated && (
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.recipeName} numberOfLines={2}>{recipe.title}</Text>
                  <View style={styles.metaRow}>
                    {totalTime > 0 && (
                      <View style={styles.meta}>
                        <Clock size={12} color={colors.textMuted} strokeWidth={2} />
                        <Text style={styles.metaText}>{totalTime} {t('recipe.min')}</Text>
                      </View>
                    )}
                    {recipe.calories != null && (
                      <View style={styles.meta}>
                        <Flame size={12} color={colors.textMuted} strokeWidth={2} />
                        <Text style={styles.metaText}>{recipe.calories} kcal</Text>
                      </View>
                    )}
                    {recipe.rating_avg != null && (
                      <View style={styles.meta}>
                        <Star size={12} color={colors.warning} fill={colors.warning} strokeWidth={0} />
                        <Text style={styles.metaText}>{Number(recipe.rating_avg).toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                  {primaryTag ? (
                    <View style={[styles.tag, { backgroundColor: tagStyle.bg }]}>
                      <Text style={[styles.tagText, { color: tagStyle.text }]} numberOfLines={1}>{primaryTag}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.folderBtn}
                    onPress={() => openAddSheet(recipe)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <FolderPlus size={16} color={colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bookmarkBtn}
                    onPress={() => handleUnsave(recipe)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    disabled={unsaving === recipe.id}
                  >
                    {unsaving === recipe.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Bookmark size={16} color={colors.primary} fill={colors.primary} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}

      {/* ── Create collection modal ──────────────────────────────────────── */}
      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCreateOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('saved.createCollection')}</Text>
              <TouchableOpacity onPress={() => setCreateOpen(false)}><X size={20} color={colors.textMuted} /></TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>{t('saved.collectionName')}</Text>
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
            <View style={{ height: Spacing.md }} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Add-to-collection sheet ──────────────────────────────────────── */}
      <Modal visible={!!sheetRecipe} transparent animationType="slide" onRequestClose={() => setSheetRecipe(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSheetRecipe(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>{t('saved.addToCollection')}</Text>
              <TouchableOpacity onPress={() => setSheetRecipe(null)}><X size={20} color={colors.textMuted} /></TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {collections.length === 0 && (
                <Text style={styles.sheetEmpty}>{t('saved.emptyCollectionSub')}</Text>
              )}
              {collections.map((col) => {
                const checked = sheetIds.has(col.id);
                return (
                  <TouchableOpacity
                    key={col.id}
                    style={styles.collectionRow}
                    onPress={() => toggleInCollection(col.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.collectionRowEmoji}>{col.emoji ?? '📗'}</Text>
                    <Text style={styles.collectionRowName} numberOfLines={1}>{col.name}</Text>
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Check size={14} color={colors.textInverse} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.newInSheet}
              onPress={() => { setSheetRecipe(null); setTimeout(() => setCreateOpen(true), 250); }}
              activeOpacity={0.8}
            >
              <FolderPlus size={16} color={colors.primary} strokeWidth={2} />
              <Text style={styles.newInSheetText}>{t('saved.newCollection')}</Text>
            </TouchableOpacity>
            <View style={{ height: Spacing.md }} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: c.text },
  countChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.primarySurface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
  },
  countChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.primary },

  // ── Collection chips ──
  chipsWrap: { marginBottom: Spacing.sm },
  chipsRow: { paddingHorizontal: Spacing.base, gap: Spacing.sm, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: c.card, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderWidth: 1, borderColor: c.borderLight, maxWidth: 200,
  },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.text },
  chipTextActive: { color: c.textInverse },
  chipCount: {
    minWidth: 18, paddingHorizontal: 5, height: 18, borderRadius: 9,
    backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  chipCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  chipCountText: { fontSize: 10, fontWeight: FontWeight.bold, color: c.textMuted },
  chipCountTextActive: { color: c.textInverse },
  chipNew: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderWidth: 1.5, borderColor: c.primary, borderStyle: 'dashed',
  },
  chipNewText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.primary },

  collectionBar: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, marginBottom: Spacing.sm,
  },
  collectionBarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: c.card, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderWidth: 1, borderColor: c.borderLight,
  },
  collectionBarBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: c.primary },

  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: c.borderLight, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.base, marginBottom: Spacing.md,
  },
  offlineText: { fontSize: FontSize.xs, color: c.textMuted, flexShrink: 1 },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', lineHeight: FontSize.sm * 1.6 },
  discoverBtn: { backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  discoverBtnText: { color: c.textInverse, fontSize: FontSize.base, fontWeight: FontWeight.semibold },

  guestWall: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  guestIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: c.primarySurface, alignItems: 'center', justifyContent: 'center' },
  guestTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.text, textAlign: 'center' },
  guestSubtitle: { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', lineHeight: FontSize.sm * 1.6 },
  signInBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  signInBtnText: { color: c.textInverse, fontSize: FontSize.base, fontWeight: FontWeight.semibold },

  list: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.sm },
  card: {
    flexDirection: 'row', backgroundColor: c.card, borderRadius: BorderRadius.lg,
    padding: Spacing.sm, gap: Spacing.md,
    borderWidth: 1, borderColor: c.borderLight,
    ...Shadow.sm,
  },
  thumbWrap: { position: 'relative' },
  thumbnail: { width: 92, height: 92, borderRadius: BorderRadius.md },
  thumbnailPlaceholder: { backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center' },
  aiBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: c.primary, borderRadius: BorderRadius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  aiBadgeText: { fontSize: 9, fontWeight: FontWeight.bold, color: c.textInverse },
  cardInfo: { flex: 1, paddingVertical: 2, gap: 6, justifyContent: 'center' },
  recipeName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, rowGap: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.xs, color: c.textMuted },
  tag: { alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  tagText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  cardActions: { alignItems: 'center', justifyContent: 'flex-start', gap: Spacing.sm },
  folderBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },
  bookmarkBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: c.primarySurface,
    justifyContent: 'center', alignItems: 'center',
  },

  skeletonCard: { borderColor: c.borderLight },
  skeletonBlock: { backgroundColor: c.borderLight, borderRadius: BorderRadius.md },
  skeletonLineWide: { height: 16, width: '85%' },
  skeletonLineNarrow: { height: 12, width: '55%' },
  skeletonChip: { height: 18, width: 72, borderRadius: BorderRadius.full },

  // ── Modals / sheets ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.card, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, maxHeight: '85%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: Spacing.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text, flex: 1 },
  sheetEmpty: { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },

  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.textSecondary, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1.5, borderColor: c.border, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.base, color: c.text, backgroundColor: c.surface,
    marginBottom: Spacing.md,
  },
  emojiRow: { gap: Spacing.sm, paddingVertical: 2, marginBottom: Spacing.md },
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
    marginTop: Spacing.sm,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: c.textInverse, fontSize: FontSize.base, fontWeight: FontWeight.bold },

  collectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: c.borderLight,
  },
  collectionRowEmoji: { fontSize: 20 },
  collectionRowName: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium, color: c.text },
  checkbox: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: c.primary, borderColor: c.primary },
  newInSheet: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: Spacing.md, marginTop: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: c.primary, borderStyle: 'dashed',
  },
  newInSheetText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.primary },
});
