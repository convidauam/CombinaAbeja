import React from 'react';

export default function StepName({ value, onChange }) {
  return (
    <div>
      <h2>Nombre del Combina</h2>
      <div className="wizard-form-group">
        <label>Como se llamara tu creacion</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ej: Combinabeja, CriaturaFantastica, AvatarEpico"
          autoFocus
        />
      </div>
      <div className="wizard-hint">
        <strong>Consejo:</strong> elige un nombre descriptivo y divertido. Aparecera en el titulo del juego.
        Minimo 3 caracteres.
      </div>
    </div>
  );
}