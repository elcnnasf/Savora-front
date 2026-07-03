import { RecipeTranslation } from '../navigation/types';

/**
 * Overlay a recipe's `translations[lang]` content onto its base fields so
 * lists render in the app language. The `translations` object is kept intact,
 * so RecipeDetailScreen can still re-localize when the language changes.
 */
export function localizeRecipe<T extends { title: string; translations?: Record<string, RecipeTranslation> }>(
  recipe: T,
  lang: string,
): T {
  const trans = recipe.translations?.[lang];
  if (!trans) return recipe;
  return {
    ...recipe,
    title: trans.title || recipe.title,
    ...(trans.description ? { description: trans.description } : {}),
    ...(trans.ingredients?.length ? { ingredients: trans.ingredients } : {}),
    ...(trans.steps?.length ? { steps: trans.steps } : {}),
  };
}

export function localizeRecipes<T extends { title: string; translations?: Record<string, RecipeTranslation> }>(
  recipes: T[],
  lang: string,
): T[] {
  return recipes.map((r) => localizeRecipe(r, lang));
}
