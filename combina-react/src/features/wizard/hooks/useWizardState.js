import { useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';

const TOTAL_STEPS = 4;

export const STEP_LABELS = ['Nombre', 'Partes', 'Orientación', 'Imágenes'];

export function useWizardState() {
  const wizardStep = useGameStore((s) => s.wizardStep);
  const wizardData = useGameStore((s) => s.wizardData);
  const setWizardStep = useGameStore((s) => s.setWizardStep);
  const updateWizardData = useGameStore((s) => s.updateWizardData);
  const resetWizard = useGameStore((s) => s.resetWizard);

  const isFirstStep = wizardStep === 0;
  const isLastStep = wizardStep === TOTAL_STEPS - 1;

  const validateStep = useCallback(
    (step = wizardStep) => {
      switch (step) {
        case 0: {
          const name = wizardData.name.trim();
          if (!name) return 'Por favor ingresa un nombre para tu Combina';
          if (name.length < 3) return 'El nombre debe tener al menos 3 caracteres';
          return null;
        }
        case 1: {
          const count = wizardData.partsCount;
          if (count < 2 || count > 10) {
            return 'El número de partes debe estar entre 2 y 10';
          }
          return null;
        }
        case 2: {
          if (!['horizontal', 'vertical'].includes(wizardData.orientation)) {
            return 'Selecciona una orientación válida';
          }
          return null;
        }
        case 3: {
          const missing = [];
          for (let i = 0; i < wizardData.partsCount; i++) {
            const part = wizardData.parts[i];
            if (!part || !part.variants || part.variants.length === 0) {
              missing.push(`Parte ${i + 1}`);
            }
          }
          if (missing.length > 0) {
            return `Faltan imágenes para: ${missing.join(', ')}. Cada parte necesita al menos una imagen.`;
          }
          return null;
        }
        default:
          return null;
      }
    },
    [wizardStep, wizardData]
  );

  const goNext = useCallback(() => {
    const error = validateStep();
    if (error) return { ok: false, error };

    if (isLastStep) return { ok: true, complete: true };

    setWizardStep(wizardStep + 1);
    return { ok: true };
  }, [wizardStep, isLastStep, validateStep, setWizardStep]);

  const goPrev = useCallback(() => {
    if (isFirstStep) return;
    setWizardStep(wizardStep - 1);
  }, [wizardStep, isFirstStep, setWizardStep]);

  const goToStep = useCallback(
    (step) => {
      if (step < 0 || step >= TOTAL_STEPS) return;
      setWizardStep(step);
    },
    [setWizardStep]
  );

  return {
    step: wizardStep,
    totalSteps: TOTAL_STEPS,
    data: wizardData,
    isFirstStep,
    isLastStep,
    updateData: updateWizardData,
    validateStep,
    goNext,
    goPrev,
    goToStep,
    reset: resetWizard,
  };
}