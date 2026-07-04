import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bookmark, Clock, Flame, LogIn, BookmarkX, CloudOff, Star, UtensilsCrossed } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { RootStackParamList, ApiRecipe } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { getSavedRecipes, unsaveRecipe } from '../../api/recipes';
import { localizeRecipes } from '../../utils/recipeLocale';
import { SafeImage } from '../../components/ui/SafeImage';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SAVED_CACHE_PREFIX = 'savora_saved_cache_';

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

  const cacheKey = user?.id ? SAVED_CACHE_PREFIX + user.id : null;

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getSavedRecipes();
      setRecipes(res.data);
      setOffline(false);
      if (cacheKey) AsyncStorage.setItem(cacheKey, JSON.stringify(res.data)).catch(() => {});
    } catch (e) {
      // offline — serve the last successful copy so saved recipes stay readable
      if (isNetworkError(e) && cacheKey) {
        try {
          const raw = await AsyncStorage.getItem(cacheKey);
          if (raw) {
            setRecipes(JSON.parse(raw));
            setOffline(true);
            return;
          }
        } catch { /* fall through */ }
      }
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, cacheKey]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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

      {offline && !loading && (
        <View style={styles.offlineBanner}>
          <CloudOff size={14} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.offlineText}>{t('saved.offlineNote')}</Text>
        </View>
      )}

      {loading ? (
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
      ) : recipes.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <BookmarkX size={40} color={colors.textMuted} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>{t('saved.empty')}</Text>
          <Text style={styles.emptySubtitle}>{t('saved.emptySubtitle')}</Text>
          <TouchableOpacity
            style={styles.discoverBtn}
            activeOpacity={0.85}
            onPress={() => (navigation as any).navigate('Discover')}
          >
            <Text style={styles.discoverBtnText}>{t('saved.exploreRecipes')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {localizeRecipes(recipes, lang).map((recipe) => {
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
              </TouchableOpacity>
            );
          })}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}
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
  bookmarkBtn: {
    alignSelf: 'flex-start',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: c.primarySurface,
    justifyContent: 'center', alignItems: 'center',
  },

  skeletonCard: { borderColor: c.borderLight },
  skeletonBlock: { backgroundColor: c.borderLight, borderRadius: BorderRadius.md },
  skeletonLineWide: { height: 16, width: '85%' },
  skeletonLineNarrow: { height: 12, width: '55%' },
  skeletonChip: { height: 18, width: 72, borderRadius: BorderRadius.full },
});
