import { create } from 'zustand';
import { UnitId, ItemAmount, defaultAmountFor } from '../utils/ingredientUnits';

export interface BasketItem {
  name: string;   // canonical English name
  amount: number; // sensible default, used to seed the amounts editor
  unit: UnitId;
  /** true once the user explicitly sets an amount; until then only the name is
   *  shown/sent (no default quantity is attached). */
  custom?: boolean;
}

interface ScanBasket {
  items: BasketItem[];
  has: (name: string) => boolean;
  setNames: (names: string[]) => void;      // seed from a scan / list (keeps existing amounts)
  add: (name: string) => void;
  remove: (name: string) => void;
  update: (name: string, patch: Partial<ItemAmount>) => void;
  clear: () => void;
}

export const useScanBasketStore = create<ScanBasket>((set, get) => ({
  items: [],
  has: (name) => get().items.some((i) => i.name === name),

  setNames: (names) =>
    set((s) => {
      const existing = new Map(s.items.map((i) => [i.name, i]));
      return {
        items: names.map((n) => existing.get(n) ?? { name: n, ...defaultAmountFor(n) }),
      };
    }),

  add: (name) =>
    set((s) => {
      const trimmed = name.trim();
      if (!trimmed || s.items.some((i) => i.name === trimmed)) return s;
      return { items: [...s.items, { name: trimmed, ...defaultAmountFor(trimmed) }] };
    }),

  remove: (name) => set((s) => ({ items: s.items.filter((i) => i.name !== name) })),

  update: (name, patch) =>
    set((s) => ({
      // any manual edit marks the item as custom so its amount is shown/used
      items: s.items.map((i) => (i.name === name ? { ...i, ...patch, custom: true } : i)),
    })),

  clear: () => set({ items: [] }),
}));
