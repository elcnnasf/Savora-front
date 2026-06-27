import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bookmark, Clock, Flame, LogIn, BookmarkX } from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { RootStackParamList, ApiRecipe } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { getSavedRecipes, unsaveRecipe } from '../../api/recipes';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SavedScreen() {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
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
  const [unsaving, setUnsaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getSavedRecipes();
      setRecipes(res.data);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleUnsave(recipe: ApiRecipe) {
    Alert.alert(
      t('saved.confirmUnsave'),
      `Remove "${recipe.title}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('saved.unsave'),
          style: 'destructive',
          onPress: async () => {
            setUnsaving(recipe.id);
            try {
              await unsaveRecipe(recipe.id);
              setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Could not remove recipe.');
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
        <Text style={styles.count}>{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
            onPress={() => navigation.navigate('Main' as any)}
          >
            <Text style={styles.discoverBtnText}>Explore Recipes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {recipes.map((recipe) => {
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
                {recipe.image_url ? (
                  <Image source={{ uri: recipe.image_url }} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                    <Flame size={24} color={colors.textMuted} strokeWidth={1.5} />
                  </View>
                )}
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
                  </View>
                  {primaryTag ? (
                    <View style={[styles.tag, { backgroundColor: tagStyle.bg }]}>
                      <Text style={[styles.tagText, { color: tagStyle.text }]}>{primaryTag}</Text>
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
                    <Bookmark size={18} color={colors.primary} fill={colors.primary} strokeWidth={2} />
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
  count: { fontSize: FontSize.sm, color: c.textMuted, fontWeight: FontWeight.medium },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: c.textMuted },

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

  list: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  card: { flexDirection: 'row', backgroundColor: c.card, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  thumbnail: { width: 88, height: 88 },
  thumbnailPlaceholder: { backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, padding: Spacing.md, gap: 6, justifyContent: 'center' },
  recipeName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text },
  metaRow: { flexDirection: 'row', gap: Spacing.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.xs, color: c.textMuted },
  tag: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  tagText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  bookmarkBtn: { padding: Spacing.md, justifyContent: 'center', alignItems: 'center', width: 48 },
});
