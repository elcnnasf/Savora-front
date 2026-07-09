// Units for the scan/manual ingredient basket. Solves the "1q is ambiguous"
// problem (#9): each ingredient carries a real unit, so we can render "2 çay
// qaşığı" vs "200 q" correctly, and hand the AI clean strings like "200 g rice".

import { INGREDIENT_CATALOG, CatalogCategoryId } from '../data/ingredientCatalog';

export type UnitId = 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'tbsp' | 'tsp' | 'cup' | 'pinch';

export const UNIT_ORDER: UnitId[] = ['g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp', 'cup', 'pinch'];

type LangKey = 'en' | 'az' | 'ru' | 'tr';

const UNIT_LABELS: Record<UnitId, Record<LangKey, string>> = {
  g:     { en: 'g',     az: 'q',            ru: 'г',       tr: 'g' },
  kg:    { en: 'kg',    az: 'kq',           ru: 'кг',      tr: 'kg' },
  ml:    { en: 'ml',    az: 'ml',           ru: 'мл',      tr: 'ml' },
  l:     { en: 'L',     az: 'L',            ru: 'л',       tr: 'L' },
  pcs:   { en: 'pcs',   az: 'ədəd',         ru: 'шт',      tr: 'adet' },
  tbsp:  { en: 'tbsp',  az: 'xörək qaşığı', ru: 'ст. л.',  tr: 'yemek k.' },
  tsp:   { en: 'tsp',   az: 'çay qaşığı',   ru: 'ч. л.',   tr: 'çay k.' },
  cup:   { en: 'cup',   az: 'stəkan',       ru: 'стакан',  tr: 'su bardağı' },
  pinch: { en: 'pinch', az: 'çimdik',       ru: 'щепотка', tr: 'tutam' },
};

const asLang = (lang: string): LangKey => (['en', 'az', 'ru', 'tr'].includes(lang) ? (lang as LangKey) : 'en');

export function unitLabel(unit: UnitId, lang: string): string {
  return UNIT_LABELS[unit][asLang(lang)];
}

function trimNum(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r);
}

/** Human display for a basket item, e.g. "2 çay qaşığı", "200 q", "3 ədəd". */
export function formatItemAmount(amount: number, unit: UnitId, lang: string): string {
  return `${trimNum(amount)} ${unitLabel(unit, lang)}`;
}

/** English string for the AI / recipe payload, e.g. "200 g rice", "2 egg". */
export function amountToEnglish(amount: number, unit: UnitId, name: string): string {
  if (unit === 'pcs') return `${trimNum(amount)} ${name}`;
  return `${trimNum(amount)} ${UNIT_LABELS[unit].en} ${name}`;
}

/** Stepper increment appropriate to the unit. */
export function stepFor(unit: UnitId): number {
  switch (unit) {
    case 'g':   return 50;
    case 'ml':  return 50;
    case 'kg':  return 0.5;
    case 'l':   return 0.25;
    case 'cup': return 0.5;
    default:    return 1; // pcs, tbsp, tsp, pinch
  }
}

// ── Sensible default unit + amount per ingredient ────────────────────────────

const COUNTABLE = new Set<string>([
  'egg', 'quail egg',
  'apple', 'pear', 'banana', 'orange', 'mandarin', 'lemon', 'lime', 'grapefruit',
  'peach', 'apricot', 'plum', 'kiwi', 'pomegranate', 'fig', 'quince', 'avocado', 'persimmon',
  'tomato', 'cucumber', 'onion', 'red onion', 'potato', 'sweet potato', 'carrot',
  'eggplant', 'zucchini', 'bell pepper', 'chili pepper', 'corn', 'beetroot',
]);

const LIQUID = new Set<string>([
  'milk', 'ayran', 'kefir', 'coconut milk', 'chicken broth', 'beef broth', 'condensed milk',
  'water', 'sparkling water', 'orange juice', 'red wine', 'white wine', 'black tea', 'green tea', 'coffee',
]);

const catByEn = new Map<string, CatalogCategoryId>(INGREDIENT_CATALOG.map((it) => [it.en, it.cat]));

export interface ItemAmount { amount: number; unit: UnitId; }

export function defaultAmountFor(en: string): ItemAmount {
  const name = en.toLowerCase();
  if (COUNTABLE.has(name)) return { amount: 2, unit: 'pcs' };
  if (LIQUID.has(name))    return { amount: 250, unit: 'ml' };

  switch (catByEn.get(en)) {
    case 'herb':   return { amount: 1,   unit: 'tsp' };
    case 'oil':    return { amount: 2,   unit: 'tbsp' };
    case 'drink':  return { amount: 250, unit: 'ml' };
    case 'meat':
    case 'fish':   return { amount: 300, unit: 'g' };
    case 'grain':
    case 'legume': return { amount: 200, unit: 'g' };
    case 'nut':    return { amount: 50,  unit: 'g' };
    default:       return { amount: 100, unit: 'g' };
  }
}
