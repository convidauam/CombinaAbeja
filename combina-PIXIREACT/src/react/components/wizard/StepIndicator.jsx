import React from 'react';

const STEPS = ['Nombre', 'Partes', 'Orientacion', 'Imagenes', 'Revisar'];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="wizard-steps">
      {STEPS.map((label, index) => {
        const cls = [
          'wizard-step',
          index === currentStep ? 'active' : '',
          index < currentStep ? 'completed' : ''
        ].filter(Boolean).join(' ');
        return (
          <div key={label} className={cls}>
            <div className="wizard-step-number">{index + 1}</div>
            <div className="wizard-step-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
}