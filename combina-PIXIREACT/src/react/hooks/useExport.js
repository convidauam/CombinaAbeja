import { useCallback } from 'react';
import { useGameStore } from '../state/GameContext.jsx';
import { assembleResult } from '../services/assembleResult.js';

export function useExport() {
  const config = useGameStore(s => s.config);
  const combination = useGameStore(s => s.combination);
  const pushToast = useGameStore(s => s.pushToast);

  const handleSave = useCallback(() => {
    if (!config) return;
    if (!combination || combination.every(p => p === null)) {
      pushToast('Gira primero para generar un avatar');
      return;
    }
    
    const canvas = assembleResult(combination, config);
    if (canvas) {
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `${config.combinaName}_${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      pushToast('Avatar guardado!');
    }
  }, [config, combination, pushToast]);

  return { handleSave };
}