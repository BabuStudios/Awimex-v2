import { create } from "zustand";

/** DOM-only UI state (no scroll data here — see engine/scroll/store). */
type UiState = {
  bridgeOpen: boolean;
  openBridge: () => void;
  closeBridge: () => void;
};

export const useUi = create<UiState>((set) => ({
  bridgeOpen: false,
  openBridge: () => set({ bridgeOpen: true }),
  closeBridge: () => set({ bridgeOpen: false }),
}));
