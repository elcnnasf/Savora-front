import { create } from 'zustand';
import { INITIAL_SHOPPING_LIST, ShoppingList } from '../data/mockData';

const PRODUCE_KW = ['spinach', 'tomato', 'avocado', 'lemon', 'lime', 'onion', 'garlic',
  'cilantro', 'parsley', 'basil', 'broccoli', 'carrot', 'cucumber', 'pepper', 'lettuce',
  'mushroom', 'zucchini', 'kale', 'potato', 'ginger', 'arugula', 'corn', 'peas',
  'asparagus', 'eggplant', 'cabbage', 'banana', 'apple', 'orange', 'cherry'];
const DAIRY_KW = ['cheese', 'cream', 'butter', 'yogurt', 'milk', 'egg', 'parmesan',
  'feta', 'mozzarella', 'cheddar'];
const MEAT_KW = ['chicken', 'beef', 'salmon', 'tuna', 'pork', 'turkey', 'shrimp',
  'bacon', 'cod', 'fish', 'tofu', 'meat'];

function categorize(name: string): string {
  const lower = name.toLowerCase();
  if (PRODUCE_KW.some((k) => lower.includes(k))) return 'Produce';
  if (DAIRY_KW.some((k) => lower.includes(k))) return 'Dairy & Eggs';
  if (MEAT_KW.some((k) => lower.includes(k))) return 'Meat & Fish';
  return 'Pantry';
}

interface ShoppingListStore {
  items: ShoppingList;
  toggleItem: (category: string, id: string) => void;
  removeItem: (category: string, id: string) => void;
  addItem: (name: string) => void;
  addIngredient: (name: string) => boolean;
}

export const useShoppingListStore = create<ShoppingListStore>((set, get) => ({
  items: { ...INITIAL_SHOPPING_LIST },

  toggleItem: (category, id) =>
    set((s) => ({
      items: {
        ...s.items,
        [category]: s.items[category]?.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item,
        ) ?? [],
      },
    })),

  removeItem: (category, id) =>
    set((s) => ({
      items: {
        ...s.items,
        [category]: s.items[category]?.filter((item) => item.id !== id) ?? [],
      },
    })),

  addItem: (name) =>
    set((s) => {
      const id = `new-${Date.now()}`;
      return {
        items: {
          ...s.items,
          Pantry: [...(s.items.Pantry ?? []), { id, name: name.trim(), checked: false }],
        },
      };
    }),

  addIngredient: (name) => {
    const state = get();
    const exists = Object.values(state.items)
      .flat()
      .some((item) => item.name.toLowerCase() === name.toLowerCase());
    if (exists) return false;

    const category = categorize(name);
    const id = `ing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({
      items: {
        ...s.items,
        [category]: [...(s.items[category] ?? []), { id, name: name.trim(), checked: false }],
      },
    }));
    return true;
  },
}));
