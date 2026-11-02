import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  phase: 'home', // 'home' | 'wizard' | 'game'
  setPhase: (phase) => set({ phase }),

  config: null,
  setConfig: (config) => set({ config }),

  combination: [],
  setCombination: (combination) => set({ combination }),

  isSpinning: false,
  setSpinning: (isSpinning) => set({ isSpinning }),

  isMobile: false,
  setIsMobile: (isMobile) => set({ isMobile }),

  toasts: [],
  pushToast: (text) => {
    const id = Date.now() + Math.random();
    set(state => ({ toasts: [...state.toasts, { id, text }] }));
    setTimeout(() => {
      const { toasts } = get();
      set({ toasts: toasts.filter(t => t.id !== id) });
    }, 2500);
  },

  reset: () => set({
    phase: 'home',
    config: null,
    combination: [],
    isSpinning: false,
    toasts: []
  })
}));