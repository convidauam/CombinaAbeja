import { create } from 'zustand';

const initialWizardData = {
  name: '',
  partsCount: 3,
  orientation: 'horizontal',
  parts: [],
};

export const useGameStore = create((set, get) => ({
  // ----- Estado de la config del Combina -----
  config: null,

  // ----- Estado del wizard -----
  wizardStep: 0,
  wizardData: initialWizardData,

  // ----- Acciones del wizard -----
  setWizardStep: (step) => set({ wizardStep: step }),

  updateWizardData: (partial) =>
    set((state) => ({
      wizardData: { ...state.wizardData, ...partial },
    })),

  resetWizard: () => set({ wizardStep: 0, wizardData: initialWizardData }),

  // ----- Acciones de config -----
  setConfig: (config) => set({ config }),

  clearConfig: () => set({ config: null }),
}));