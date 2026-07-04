import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft, Search, Trash2, Pencil, Users, UtensilsCrossed,
  Crown, X, Check, Image as ImageIcon, Diamond, Rocket,
} from 'lucide-react-native';

const PRO_COLOR   = '#7C3AED';
const PRO_SURFACE = '#7C3AED18';
type PlanTier = 'free' | 'premium' | 'pro';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useTheme } from '../../hooks/useTheme';
import { RootStackParamList } from '../../navigation/types';
import {
  adminListRecipes, adminUpdateRecipe, adminDeleteRecipe,
  adminListUsers, adminSetPremium, adminSetPro, AdminRecipe, AdminUser,
} from '../../api/admin';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'recipes' | 'users';

export default function AdminPanelScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [tab, setTab]               = useState<Tab>('recipes');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Recipes state
  const [recipes, setRecipes]       = useState<AdminRecipe[]>([]);
  const [recipeTotal, setRecipeTotal] = useState(0);

  // Users state
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [userTotal, setUserTotal]   = useState(0);

  // Edit recipe modal state
  const [editTarget, setEditTarget] = useState<AdminRecipe | null>(null);
  const [editTitle, setEditTitle]   = useState('');
  const [editImage, setEditImage]   = useState('');
  const [saving, setSaving]         = useState(false);

  // Plan modal state
  const [planTarget, setPlanTarget]   = useState<AdminUser | null>(null);
  const [planSaving, setPlanSaving]   = useState(false);

  const loadRecipes = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const res = await adminListRecipes({ limit: 100, q });
      setRecipes(res.data.items);
      setRecipeTotal(res.data.total);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminListUsers({ limit: 100 });
      setUsers(res.data.items);
      setUserTotal(res.data.total);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'recipes') loadRecipes(search);
    else loadUsers();
  }, [tab]);

  // debounce search
  useEffect(() => {
    if (tab !== 'recipes') return;
    const t = setTimeout(() => loadRecipes(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  function openEdit(r: AdminRecipe) {
    setEditTarget(r);
    setEditTitle(r.title);
    setEditImage(r.image_url ?? '');
  }

  async function saveEdit() {
    if (!editTarget) return;
    setSaving(true);
    try {
      await adminUpdateRecipe(editTarget.id, { title: editTitle, image_url: editImage });
      setRecipes((prev) =>
        prev.map((r) => r.id === editTarget.id ? { ...r, title: editTitle, image_url: editImage } : r),
      );
      setEditTarget(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(r: AdminRecipe) {
    Alert.alert(
      'Delete Recipe',
      `"${r.title}" silinəcək. Əminsiniz?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await adminDeleteRecipe(r.id);
              setRecipes((prev) => prev.filter((x) => x.id !== r.id));
              setRecipeTotal((n) => n - 1);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ],
    );
  }

  function renderRecipe({ item }: { item: AdminRecipe }) {
    return (
      <View style={styles.row}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <UtensilsCrossed size={18} color={colors.textMuted} strokeWidth={1.5} />
          </View>
        )}
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.rowSub}>
            {item.cuisine ?? 'Unknown'} · {item.difficulty ?? '—'} · {item.cook_time}m
            {item.is_ai_generated ? ' · AI' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconAction} onPress={() => openEdit(item)} activeOpacity={0.7}>
          <Pencil size={16} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconAction} onPress={() => confirmDelete(item)} activeOpacity={0.7}>
          <Trash2 size={16} color={colors.error} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  }

  function getUserPlan(u: AdminUser): PlanTier {
    if (u.is_pro)     return 'pro';
    if (u.is_premium) return 'premium';
    return 'free';
  }

  async function assignPlan(user: AdminUser, plan: PlanTier) {
    setPlanSaving(true);
    try {
      const isPro     = plan === 'pro';
      const isPremium = plan === 'premium' || plan === 'pro';
      await adminSetPro(user.id, isPro);
      await adminSetPremium(user.id, isPremium);
      setUsers((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, is_pro: isPro, is_premium: isPremium } : u,
      ));
      setPlanTarget(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setPlanSaving(false);
    }
  }

  function renderUser({ item }: { item: AdminUser }) {
    const plan       = getUserPlan(item);
    const initial    = item.name?.[0]?.toUpperCase() || item.email?.[0]?.toUpperCase() || '?';
    const since      = item.member_since ? new Date(item.member_since).toLocaleDateString() : '—';

    const planColors = {
      free:    { bg: colors.primarySurface, text: colors.primary,  label: 'FREE'    },
      premium: { bg: colors.warning + '25', text: colors.warning,   label: 'PREMIUM' },
      pro:     { bg: PRO_SURFACE,           text: PRO_COLOR,        label: 'PRO'     },
    }[plan];

    return (
      <View style={styles.row}>
        <View style={[styles.userAvatar, { backgroundColor: planColors.bg }]}>
          <Text style={[styles.userAvatarText, { color: planColors.text }]}>{initial}</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>{item.name || 'No name'}</Text>
          <Text style={styles.rowSub} numberOfLines={1}>{item.email}</Text>
          <Text style={styles.rowSub2}>Since {since} · {item.cooking_skill}</Text>
        </View>
        <TouchableOpacity
          style={[styles.planBadgeBtn, { backgroundColor: planColors.bg }]}
          onPress={() => setPlanTarget(item)}
          activeOpacity={0.75}
        >
          {plan === 'pro'     && <Diamond size={10} color={PRO_COLOR}       strokeWidth={2.5} />}
          {plan === 'premium' && <Crown   size={10} color={colors.warning}  strokeWidth={2}   />}
          <Text style={[styles.planBadgeText, { color: planColors.text }]}>{planColors.label}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>savorachef@gmail.com</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'recipes' && styles.tabActive]}
          onPress={() => { setTab('recipes'); setSearch(''); }}
          activeOpacity={0.8}
        >
          <UtensilsCrossed size={15} color={tab === 'recipes' ? colors.primary : colors.textMuted} strokeWidth={2} />
          <Text style={[styles.tabText, tab === 'recipes' && styles.tabTextActive]}>
            Recipes {recipeTotal > 0 ? `(${recipeTotal})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'users' && styles.tabActive]}
          onPress={() => setTab('users')}
          activeOpacity={0.8}
        >
          <Users size={15} color={tab === 'users' ? colors.primary : colors.textMuted} strokeWidth={2} />
          <Text style={[styles.tabText, tab === 'users' && styles.tabTextActive]}>
            Users {userTotal > 0 ? `(${userTotal})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search (recipes only) */}
      {tab === 'recipes' && (
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search recipes..."
            placeholderTextColor={colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : tab === 'recipes' ? (
        <FlatList
          data={recipes}
          keyExtractor={(r) => r.id}
          renderItem={renderRecipe}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRecipes(search); }} colors={[colors.primary]} />}
          ListEmptyComponent={<Text style={styles.empty}>No recipes found</Text>}
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUsers(); }} colors={[colors.primary]} />}
          ListEmptyComponent={<Text style={styles.empty}>No users found</Text>}
        />
      )}

      {/* Plan Selector Modal */}
      <Modal visible={!!planTarget} transparent animationType="slide" onRequestClose={() => setPlanTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Plan dəyiştir</Text>
                <Text style={styles.modalSub}>{planTarget?.name || planTarget?.email}</Text>
              </View>
              <TouchableOpacity onPress={() => setPlanTarget(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {(['free', 'premium', 'pro'] as PlanTier[]).map((plan) => {
              const current   = planTarget ? getUserPlan(planTarget) : 'free';
              const isActive  = current === plan;
              const cfg = {
                free:    { label: 'Free',    price: '0 AZN/ay',     color: colors.primary,  bg: colors.primarySurface, Icon: null,    desc: '3 resept · 5 suggestion · 10 chat / gün' },
                premium: { label: 'Premium', price: '3.99 AZN/ay',  color: colors.warning,  bg: colors.warning + '18', Icon: Crown,   desc: '10 resept · 15 suggestion · 50 chat / gün' },
                pro:     { label: 'Pro',     price: '12.99 AZN/ay', color: PRO_COLOR,        bg: PRO_SURFACE,           Icon: Diamond, desc: '25 resept · 30 suggestion · 100 chat / gün' },
              }[plan];

              return (
                <TouchableOpacity
                  key={plan}
                  style={[styles.planOption, isActive && { borderColor: cfg.color, backgroundColor: cfg.bg }]}
                  onPress={() => planTarget && assignPlan(planTarget, plan)}
                  disabled={planSaving || isActive}
                  activeOpacity={0.8}
                >
                  <View style={[styles.planOptionIcon, { backgroundColor: cfg.bg }]}>
                    {cfg.Icon
                      ? <cfg.Icon size={16} color={cfg.color} strokeWidth={2} />
                      : <Text style={{ fontSize: 12, color: cfg.color, fontWeight: '700' }}>F</Text>
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planOptionLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    <Text style={styles.planOptionDesc}>{cfg.desc}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[styles.planOptionPrice, { color: cfg.color }]}>{cfg.price}</Text>
                    {isActive && <Check size={14} color={cfg.color} strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {planSaving && (
              <View style={styles.planSavingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.planSavingText}>Saxlanılır...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editTarget} transparent animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Recipe</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {editImage ? (
              <Image source={{ uri: editImage }} style={styles.modalPreview} resizeMode="cover" />
            ) : (
              <View style={[styles.modalPreview, styles.modalPreviewEmpty]}>
                <ImageIcon size={32} color={colors.textMuted} strokeWidth={1.5} />
              </View>
            )}

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.fieldInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Recipe title"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Image URL</Text>
            <TextInput
              style={styles.fieldInput}
              value={editImage}
              onChangeText={setEditImage}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditTarget(null)} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} activeOpacity={0.8} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Check size={16} color="#fff" strokeWidth={2.5} />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: c.text },
  headerSub:   { fontSize: FontSize.xs, color: c.textMuted },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.border },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.md,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive:     { borderBottomColor: c.primary },
  tabText:       { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: c.textMuted },
  tabTextActive: { color: c.primary, fontWeight: FontWeight.bold },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    margin: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: c.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: c.border,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: c.text, paddingVertical: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:  { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
  empty: { textAlign: 'center', color: c.textMuted, marginTop: 40, fontSize: FontSize.base },

  separator: { height: 1, backgroundColor: c.borderLight, marginLeft: 60 + Spacing.md },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  thumb: { width: 52, height: 52, borderRadius: BorderRadius.md, backgroundColor: c.borderLight },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text, marginBottom: 2 },
  rowSub:   { fontSize: FontSize.xs, color: c.textMuted },
  rowSub2:  { fontSize: FontSize.xs, color: c.textMuted, marginTop: 1 },
  iconAction: {
    width: 34, height: 34, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.borderLight,
  },

  userAvatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  userNameRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  planBadgeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'transparent',
  },
  planBadgeText: { fontSize: 10, fontWeight: FontWeight.bold },

  // Plan selector modal
  modalSub: { fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },
  planOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    borderWidth: 2, borderColor: c.borderLight,
  },
  planOptionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  planOptionLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  planOptionDesc:  { fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 },
  planOptionPrice: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  planSavingRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'center' },
  planSavingText:  { fontSize: FontSize.sm, color: c.textMuted },

  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  premiumBadgeText: { fontSize: 9, fontWeight: FontWeight.bold, color: '#D97706' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: c.background, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xl,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle:  { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
  modalPreview: { width: '100%', height: 180, borderRadius: BorderRadius.lg, backgroundColor: c.borderLight },
  modalPreviewEmpty: { alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: c.textSecondary, marginBottom: -4 },
  fieldInput: {
    backgroundColor: c.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: c.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.base, color: c.text,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  cancelBtn: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
    backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text },
  saveBtn: {
    flex: 2, flexDirection: 'row', gap: 6,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#fff' },
});
