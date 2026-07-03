import { create } from 'zustand';

interface DiscoverFilterStore {
  pendingQuery: string;
  setPendingQuery: (q: string) => void;
  clear: () => void;
}

export const useDiscoverFilterStore = create<DiscoverFilterStore>((set) => ({
  pendingQuery: '',
  setPendingQuery: (q) => set({ pendingQuery: q }),
  clear: () => set({ pendingQuery: '' }),
}));
