import React from 'react';

const ORIENTATIONS = [
  {
    value: 'horizontal',
    icon: '\u2190 \u2192',
    title: 'Horizontal',
    description: 'Partes una al lado de la otra',
    example: '[Parte1] [Parte2] [Parte3]'
  },
  {
    value: 'vertical',
    icon: '\u2191 \u2193',
    title: 'Vertical',
    description: 'Partes apiladas una sobre otra',
    example: '[Parte1]\n[Parte2]\n[Parte3]'
  }
];

export default function StepOrientation({ value, onChange }) {
  return (
    <div>
      <h2>Orientacion del ensamblaje</h2>
      <p>Como se uniran las partes para formar el avatar final</p>
      <div className="wizard-orientations">
        {ORIENTATIONS.map(opt => (
          <div
            key={opt.value}
            className={`wizard-orientation ${value === opt.value ? 'selected' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            <div className="wizard-orientation-icon">{opt.icon}</div>
            <strong>{opt.title}</strong>
            <small>{opt.description}</small>
            <div className="wizard-orientation-example">
              {opt.example.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}