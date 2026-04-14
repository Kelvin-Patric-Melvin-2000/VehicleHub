import { create } from "zustand";

type UiSettings = {
  showArchived: boolean;
  setShowArchived: (v: boolean) => void;
};

export const useUiSettings = create<UiSettings>((set) => ({
  showArchived: false,
  setShowArchived: (showArchived) => set({ showArchived }),
}));
