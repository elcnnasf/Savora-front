import { ApiRecipe } from '../navigation/types';
import { UserPreferences } from '../store/userStore';

/**
 * Preference-aware recipe ranking used by Home ("Today's recommendation"),
 * scan ingredient matches and any list that should respect Taste Preferences.
 *
 * Hard rules (allergies, disliked ingredients) exclude a recipe outright;
 * soft rules add/subtract score so better-fitting recipes float to the top.
 */

// App allergy labels → recipe.allergens values produced by the backend
const ALLERGY_TO_ALLERGEN: Record<string, string[]> = {
  'Peanuts':        ['nuts'],
  'Tree Nuts':      ['nuts'],
  'Shellfish':      ['shellfish'],
  'Fish':           ['fish'],
  'Eggs':           ['eggs'],
  'Soy':            ['soy'],
  'Wheat / Gluten': ['gluten'],
  'Milk / Dairy':   ['dairy'],
  'Sesame':         ['sesame'],
  // Mustard has no allergen tag — caught via ingredient names below
};

// Fallback ingredient keywords per allergy, for recipes without allergen tags
const ALLERGY_KEYWORDS: Record<string, string[]> = {
  'Peanuts':        ['peanut'],
  'Tree Nuts':      ['walnut', 'almond', 'hazelnut', 'cashew', 'pistachio', 'pecan'],
  'Shellfish':      ['shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'oyster', 'clam'],
  'Fish':           ['fish', 'salmon', 'tuna', 'anchov', 'sardine', 'trout', 'cod'],
  'Eggs':           ['egg'],
  'Soy':            ['soy', 'tofu', 'edamame'],
  'Wheat / Gluten': ['flour', 'wheat', 'bread', 'pasta', 'bulgur', 'couscous', 'barley'],
  'Milk / Dairy':   ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'yoghurt', 'kefir'],
  'Sesame':         ['sesame', 'tahini'],
  'Mustard':        ['mustard'],
};

const PROTEIN_KEYWORDS: Record<string, string[]> = {
  'Chicken': ['chicken'],
  'Beef':    ['beef', 'veal'],
  'Lamb':    ['lamb', 'mutton'],
  'Fish':    ['fish', 'salmon', 'tuna', 'trout', 'cod', 'sardine'],
  'Seafood': ['shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'squid', 'octopus'],
  'Eggs':    ['egg'],
  'Legumes': ['lentil', 'chickpea', 'bean', 'pea'],
  'Tofu':    ['tofu', 'tempeh'],
};

function ingredientNames(recipe: ApiRecipe): string {
  return (recipe.ingredients ?? []).map((i) => i.name).join(' ').toLowerCase();
}

function tagsLower(recipe: ApiRecipe): string[] {
  return (recipe.tags ?? []).map((t) => t.toLowerCase());
}

/** True when the recipe hits an allergy or a disliked ingredient. */
export function violatesHardRules(recipe: ApiRecipe, prefs: UserPreferences): boolean {
  const allergens = (recipe.allergens ?? []).map((a) => a.toLowerCase());
  const names = ingredientNames(recipe);

  for (const allergy of prefs.allergies ?? []) {
    if ((ALLERGY_TO_ALLERGEN[allergy] ?? []).some((a) => allergens.includes(a))) return true;
    if ((ALLERGY_KEYWORDS[allergy] ?? []).some((k) => names.includes(k))) return true;
  }
  for (const disliked of prefs.dislikedIngredients ?? []) {
    const d = disliked.trim().toLowerCase();
    if (d.length >= 3 && names.includes(d)) return true;
  }
  return false;
}

/** Soft score — higher is a better fit. Roughly −40 … +100. */
export function preferenceScore(recipe: ApiRecipe, prefs: UserPreferences): number {
  let score = 0;
  const tags = tagsLower(recipe);
  const names = ingredientNames(recipe);

  // Favorite cuisines
  if (recipe.cuisine && (prefs.cuisines ?? []).some(
    (c) => recipe.cuisine!.toLowerCase().includes(c.toLowerCase()),
  )) score += 30;

  // Dietary preferences matched against tags (e.g. "vegetarian", "keto")
  let dietHits = 0;
  for (const d of prefs.dietary ?? []) {
    const key = d.toLowerCase().replace(/[^a-z]/g, '');
    if (tags.some((t) => t.replace(/[^a-z]/g, '').includes(key))) dietHits++;
  }
  score += Math.min(dietHits * 10, 20);

  // Favorite proteins present in the ingredient list
  let proteinHits = 0;
  for (const p of prefs.favoriteProteins ?? []) {
    if ((PROTEIN_KEYWORDS[p] ?? []).some((k) => names.includes(k))) proteinHits++;
  }
  score += Math.min(proteinHits * 10, 20);

  // Preferred prep time
  const time = recipe.cook_time ?? 0;
  const pt = prefs.prepTimePreference ?? 'No Preference';
  if (pt !== 'No Preference' && time > 0) {
    const fits =
      (pt === 'Quick (<15 min)' && time < 15) ||
      (pt === '15-30 min'       && time <= 30) ||
      (pt === '30-60 min'       && time <= 60) ||
      (pt === 'Long (60+ min)'  && time >= 45);
    score += fits ? 15 : -5;
  }

  // Per-meal calorie cap
  const cap = prefs.maxCaloriesPerMeal ?? 0;
  if (cap > 0 && recipe.calories != null) {
    score += recipe.calories <= cap ? 10 : -15;
  }

  // Health goal
  const goal = prefs.healthGoal ?? 'No Goal';
  if (goal === 'Lose Weight'   && recipe.calories != null && recipe.calories <= 500) score += 10;
  if (goal === 'Gain Muscle'   && (recipe.protein ?? 0) >= 25)                       score += 10;
  if (goal === 'Eat Healthier' && tags.some((t) => t.includes('healthy')))           score += 10;

  // Spice fit
  const spicy = tags.some((t) => t.includes('spicy') || t.includes('hot'));
  const level = prefs.spiceLevel ?? 'Medium';
  if (spicy && (level === 'No Spice' || level === 'Mild')) score -= 20;
  if (spicy && (level === 'Hot' || level === 'Very Hot'))  score += 10;

  // Slight boost for well-rated recipes so ties break sensibly
  if (recipe.rating_avg) score += Math.min(recipe.rating_avg * 2, 10);

  return score;
}

/**
 * Sort by preference fit, dropping hard-rule violations.
 * If everything violates (or list is empty), returns the original order
 * so screens never end up blank because of preferences.
 */
export function rankByPreferences<T extends ApiRecipe>(recipes: T[], prefs: UserPreferences): T[] {
  const safe = recipes.filter((r) => !violatesHardRules(r, prefs));
  const pool = safe.length > 0 ? safe : recipes;
  return [...pool].sort((a, b) => preferenceScore(b, prefs) - preferenceScore(a, prefs));
}
