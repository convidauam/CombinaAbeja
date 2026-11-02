import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../state/GameContext.jsx';
import { buildConfigFromJSON } from '../../services/importService.js';
import StepIndicator from './StepIndicator.jsx';
import StepName from './StepName.jsx';
import StepPartsCount from './StepPartsCount.jsx';
import StepOrientation from './StepOrientation.jsx';
import StepImages from './StepImages.jsx';
import StepReview from './StepReview.jsx'; 
import './wizard.css';

const TOTAL_STEPS = 5; 

export default function Wizard() {
  const setConfig = useGameStore(s => s.setConfig);
  const setPhase = useGameStore(s => s.setPhase);
  const pushToast = useGameStore(s => s.pushToast); 

  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [partsCount, setPartsCount] = useState(3);
  const [orientation, setOrientation] = useState('horizontal');
  const [parts, setParts] = useState([
    { name: 'Parte 1', variants: [] },
    { name: 'Parte 2', variants: [] },
    { name: 'Parte 3', variants: [] }
  ]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setParts(prev => {
      const next = [...prev];
      while (next.length < partsCount) {
        next.push({ name: `Parte ${next.length + 1}`, variants: [] });
      }
      while (next.length > partsCount) {
        next.pop();
      }
      return next;
    });
  }, [partsCount]);

  const validateStep = () => {
    setError(null);
    if (currentStep === 0) {
      if (!name.trim()) {
        setError('Por favor ingresa un nombre para tu Combina');
        return false;
      }
      if (name.trim().length < 3) {
        setError('El nombre debe tener al menos 3 caracteres');
        return false;
      }
    }
    if (currentStep === 1) {
      if (partsCount < 2 || partsCount > 10) {
        setError('El numero de partes debe estar entre 2 y 10');
        return false;
      }
    }
    if (currentStep === 3) {
      const missing = [];
      for (let i = 0; i < partsCount; i++) {
        if (!parts[i] || parts[i].variants.length === 0) {
          missing.push(`Parte ${i + 1}`);
        }
      }
      if (missing.length > 0) {
        setError(`Faltan imagenes para: ${missing.join(', ')}. Cada parte necesita al menos una imagen.`);
        return false;
      }
    }
    return true;
  };

  const buildFinalJSON = () => {
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      combinaName: name.trim(),
      orientation,
      theme: 'light',
      parts: parts.slice(0, partsCount).map((p, i) => ({
        id: i,
        name: p.name || `Parte ${i + 1}`,
        variants: p.variants.map(v => ({
          name: v.name,
          dataURL: v.dataURL,
          width: 0,
          height: 0
        }))
      })),
      adjustments: { parts: [] }
    };
  };

  const goNext = async () => {
    if (!validateStep()) return;

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setLoading(true);
    try {
      const json = buildFinalJSON();
      const config = await buildConfigFromJSON(json);
      if (!config) {
        setError('No se pudieron cargar las imagenes');
        setLoading(false);
        return;
      }
      setConfig(config);
      setPhase('game');
    } catch (e) {
      console.error(e);
      setError('Error construyendo el Combina');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!validateStep()) return;
    const json = buildFinalJSON();
    
    // Descarga directa
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = name.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `${safeName}_${timestamp}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    
    if (pushToast) pushToast('JSON descargado!');
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setError(null);
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return <StepName value={name} onChange={setName} />;
      case 1: return <StepPartsCount value={partsCount} onChange={setPartsCount} />;
      case 2: return <StepOrientation value={orientation} onChange={setOrientation} />;
      case 3: return <StepImages partsCount={partsCount} parts={parts} onChange={setParts} />;
      case 4: return <StepReview config={buildFinalJSON()} />; // <-- Paso 5
      default: return null;
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <div className="wizard-root">
      <div className="wizard-container">
        <div className="wizard-header">
          <h1>Creador de Combina</h1>
          <p>Configura tu tragamonedas de combinaciones</p>
        </div>

        <StepIndicator currentStep={currentStep} />

        <div className="wizard-content">
          {error && <div className="wizard-message error">{error}</div>}
          {renderStepContent()}
        </div>

        <div className="wizard-footer">
          <button
            type="button"
            className="wizard-btn wizard-btn-secondary"
            onClick={goPrev}
            disabled={currentStep === 0 || loading}
          >
            Anterior
          </button>

          {isLastStep ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="wizard-btn wizard-btn-info" 
                onClick={handleDownload}
                disabled={loading}
              >
                Descargar JSON
              </button>
              <button
                type="button"
                className="wizard-btn wizard-btn-success" 
                onClick={goNext}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Jugar ahora'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="wizard-btn wizard-btn-primary" 
              onClick={goNext}
              disabled={loading}
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}