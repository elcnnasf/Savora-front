import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Sparkles, Clock, ChefHat, Flame } from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { RootStackParamList } from '../../navigation/types';
import { matchRecipes, MatchedRecipe } from '../../api/recipes';
import { generateRecipe, buildAiPreferences } from '../../api/ai';
import { ApiRecipe } from '../../navigation/types';
import { preferenceScore, violatesHardRules } from '../../utils/preferenceScore';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { localizeRecipe } from '../../utils/recipeLocale';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'MatchedRecipes'>;

function MatchBadge({ percent }: { percent: number }) {
  const color = percent >= 80 ? '#16A34A' : percent >= 50 ? '#D97706' : '#6B7280';
  const bg    = percent >= 80 ? '#F0FDF4' : percent >= 50 ? '#FFFBEB' : '#F3F4F6';
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: color + '50' }]}>
      <Text style={[styles.badgeText, { color }]}>{percent}%</Text>
    </View>
  );
}

export default function MatchedRecipesScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { ingredients } = route.params;
  const { preferences, language } = useUserStore();
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  const dynStyles = makeStyles(colors);

  const [recipes, setRecipes]     = useState<MatchedRecipe[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await matchRecipes(ingredients);
      // Rank by ingredient match AND taste preferences; recipes that hit an
      // allergy / disliked ingredient sink to the bottom instead of hiding —
      // the user did scan these ingredients, so we still show everything.
      const ranked = [...(res.data ?? [])].sort((a, b) => {
        const combined = (r: MatchedRecipe) => {
          const rec = r as unknown as ApiRecipe;
          return r.match_percent
            + preferenceScore(rec, preferences) * 0.5
            + (violatesHardRules(rec, preferences) ? -1000 : 0);
        };
        return combined(b) - combined(a);
      });
      setRecipes(ranked);
    } catch (err: any) {
      setError(err?.message ?? t('matchedRecipes.loadFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAI() {
    setGenerating(true);
    try {
      const res = await generateRecipe({
        ingredients,
        language,
        preferences: buildAiPreferences(preferences),
      });
      navigation.replace('RecipeDetail', { recipe: res.data });
    } catch (err: any) {
      setError(err?.message ?? 'AI generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  function openRecipe(item: MatchedRecipe) {
    navigation.navigate('RecipeDetail', { recipeId: item.id });
  }

  const renderItem = ({ item }: { item: MatchedRecipe }) => (
    <TouchableOpacity style={dynStyles.card} onPress={() => openRecipe(item)} activeOpacity={0.85}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={dynStyles.cardImage} />
      ) : (
        <View style={dynStyles.cardImagePlaceholder}>
          <ChefHat size={32} color={colors.textMuted} strokeWidth={1.5} />
        </View>
      )}

      <View style={dynStyles.cardBody}>
        <View style={dynStyles.cardTop}>
          <MatchBadge percent={item.match_percent} />
          <Text style={dynStyles.matchCount} numberOfLines={1}>
            {item.matched_count}/{item.total_count} {t('matchedRecipes.ingredientsWord')}
          </Text>
        </View>

        <Text style={dynStyles.cardTitle} numberOfLines={2}>{localizeRecipe(item, lang).title}</Text>

        <View style={dynStyles.cardMeta}>
          {item.cook_time != null && (
            <View style={dynStyles.metaChip}>
              <Clock size={11} color={colors.textMuted} strokeWidth={2} />
              <Text style={dynStyles.metaText}>{item.cook_time}m</Text>
            </View>
          )}
          {item.calories != null && (
            <View style={dynStyles.metaChip}>
              <Flame size={11} color={colors.textMuted} strokeWidth={2} />
              <Text style={dynStyles.metaText}>{item.calories} cal</Text>
            </View>
          )}
          {item.difficulty && (
            <View style={dynStyles.metaChip}>
              <ChefHat size={11} color={colors.textMuted} strokeWidth={2} />
              <Text style={dynStyles.metaText}>{item.difficulty}</Text>
            </View>
          )}
        </View>

        {item.matched_ingredients.length > 0 && (
          <Text style={dynStyles.matchedLine} numberOfLines={1}>
            {t('matchedRecipes.has')}: {item.matched_ingredients.slice(0, 4).join(', ')}
            {item.matched_ingredients.length > 4 ? '...' : ''}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={dynStyles.container} edges={['top']}>
      <View style={dynStyles.header}>
        <TouchableOpacity style={dynStyles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={dynStyles.headerCenter}>
          <Text style={dynStyles.headerTitle}>{t('matchedRecipes.title')}</Text>
          <Text style={dynStyles.headerSub}>{ingredients.length} {t('matchedRecipes.ingredientsScanned')}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={dynStyles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={dynStyles.loadingText}>{t('matchedRecipes.findingMatches')}</Text>
        </View>
      ) : error ? (
        <View style={dynStyles.center}>
          <Text style={dynStyles.errorText}>{error}</Text>
          <TouchableOpacity style={dynStyles.retryBtn} onPress={load} activeOpacity={0.8}>
            <Text style={dynStyles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={dynStyles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={dynStyles.emptyCard}>
              <ChefHat size={40} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={dynStyles.emptyTitle}>{t('matchedRecipes.noMatches')}</Text>
              <Text style={dynStyles.emptySubtitle}>{t('matchedRecipes.noMatchesDesc')}</Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity
              style={[dynStyles.aiBtn, generating && dynStyles.aiBtnLoading]}
              onPress={handleGenerateAI}
              activeOpacity={0.85}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Sparkles size={18} color={colors.textInverse} strokeWidth={2.5} />
              )}
              <Text style={dynStyles.aiBtnText}>
                {generating ? t('common.loading') : t('matchedRecipes.generateNew')}
              </Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

// Static badge styles (badge has fixed light colors regardless of theme)
const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: FontWeight.bold },
});

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, gap: Spacing.md,
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
  headerSub:    { fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 },

  list: { padding: Spacing.base, paddingBottom: Spacing.xl, gap: Spacing.sm },

  card: {
    backgroundColor: c.card, borderRadius: BorderRadius.lg,
    overflow: 'hidden', ...Shadow.sm,
    flexDirection: 'row',
  },
  cardImage: { width: 100, height: 110 },
  cardImagePlaceholder: {
    width: 100, height: 110, backgroundColor: c.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody:  { flex: 1, padding: Spacing.md, gap: 4 },
  cardTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text, lineHeight: 20 },
  matchCount: { fontSize: FontSize.xs, color: c.textMuted },

  cardMeta:   { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  metaChip:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:   { fontSize: FontSize.xs, color: c.textMuted },

  matchedLine: { fontSize: FontSize.xs, color: c.textMuted, marginTop: 2, fontStyle: 'italic' },

  emptyCard: {
    alignItems: 'center', padding: Spacing.xl, gap: Spacing.md,
    backgroundColor: c.card, borderRadius: BorderRadius.lg, ...Shadow.sm,
    marginBottom: Spacing.md,
  },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
  emptySubtitle: { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center', lineHeight: 20 },

  aiBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: c.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base + 2, marginTop: Spacing.md,
  },
  aiBtnLoading: { opacity: 0.7 },
  aiBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: c.textInverse },

  loadingText: { fontSize: FontSize.base, color: c.textMuted, marginTop: Spacing.sm },
  errorText:   { fontSize: FontSize.base, color: c.error, textAlign: 'center' },
  retryBtn: {
    backgroundColor: c.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
  },
  retryText: { color: c.textInverse, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
