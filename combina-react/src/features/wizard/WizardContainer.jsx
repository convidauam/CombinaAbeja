import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardState, STEP_LABELS } from './hooks/useWizardState';
import { useGameStore } from '@/store/gameStore';
import { StepIndicator } from './components/StepIndicator';
import { StepName } from './components/StepName';
import { StepParts } from './components/StepParts';
import { StepOrientation } from './components/StepOrientation';
import { StepImages } from './components/StepImages';
import { WizardMessage } from './components/WizardMessage';
import { exportWizardJSON, downloadConfigJSON } from './utils/exportWizardJSON';
import './wizard.css';

export function WizardContainer() {
  const navigate = useNavigate();
  const setConfig = useGameStore((s) => s.setConfig);
  const wizard = useWizardState();
  const [message, setMessage] = useState(null);

  const showMessage = useCallback((text, type = 'error') => {
    setMessage({ text, type, id: Date.now() });
  }, []);

  const handleNext = useCallback(() => {
    const result = wizard.goNext();

    if (!result.ok) {
      showMessage(result.error, 'error');
      return;
    }

    if (result.complete) {
      try {
        const config = exportWizardJSON(wizard.data);
        downloadConfigJSON(config);   // ← ESTA es la línea que faltaba
        setConfig(config);
        showMessage(
          `Combina "${config.combinaName}" exportado. Redirigiendo al juego...`,
          'success'
        );
        setTimeout(() => navigate('/game'), 1800);
      } catch (err) {
        console.error('Error al exportar:', err);
        showMessage('Error al exportar la configuración', 'error');
      }
    }
  }, [wizard, showMessage, setConfig, navigate]);

  const handlePrev = useCallback(() => {
    wizard.goPrev();
    setMessage(null);
  }, [wizard]);

  return (
    <div className="wizard-root">
      <div className="wizard-container">
        <header className="wizard-header">
          <h1>Creador de Combina</h1>
          <p>Configura tu tragamonedas de combinaciones en 4 pasos</p>
        </header>

        <StepIndicator
          currentStep={wizard.step}
          totalSteps={wizard.totalSteps}
          labels={STEP_LABELS}
        />

        <main className="wizard-content">
          {message && (
            <WizardMessage
              key={message.id}
              text={message.text}
              type={message.type}
              id={message.id}
            />
          )}

          {wizard.step === 0 && (
            <StepName value={wizard.data.name} onChange={wizard.updateData} />
          )}
          {wizard.step === 1 && (
            <StepParts value={wizard.data.partsCount} onChange={wizard.updateData} />
          )}
          {wizard.step === 2 && (
            <StepOrientation value={wizard.data.orientation} onChange={wizard.updateData} />
          )}
          {wizard.step === 3 && (
            <StepImages
              data={wizard.data}
              onChange={wizard.updateData}
              onMessage={showMessage}
            />
          )}
        </main>

        <footer className="wizard-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrev}
            disabled={wizard.isFirstStep}
          >
            Anterior
          </button>

          <button
            type="button"
            className={`btn ${wizard.isLastStep ? 'btn-success' : 'btn-primary'}`}
            onClick={handleNext}
          >
            {wizard.isLastStep ? 'COMPLETAR Y EXPORTAR' : 'Siguiente'}
          </button>
        </footer>
      </div>
    </div>
  );
}