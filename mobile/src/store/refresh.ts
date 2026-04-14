import { create } from "zustand";

type RefreshState = {
  version: number;
  bump: () => void;
};

export const useRefresh = create<RefreshState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
