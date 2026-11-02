import React from 'react';

export default function StepPartsCount({ value, onChange }) {
  const handleChange = (e) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 2 && v <= 10) {
      onChange(v);
    }
  };

  return (
    <div>
      <h2>Numero de partes</h2>
      <div className="wizard-form-group">
        <label>Cuantas partes tendra tu Combina (2-10)</label>
        <input
          type="number"
          min={2}
          max={10}
          value={value}
          onChange={handleChange}
          autoFocus
        />
      </div>
      <div className="wizard-hint">
        <strong>Ejemplos segun cantidad de partes</strong>
        <ul>
          <li><strong>2 partes:</strong> Cabeza + Cuerpo</li>
          <li><strong>3 partes:</strong> Cabeza + Torso + Piernas</li>
          <li><strong>4 partes:</strong> Casco + Visera + Armadura + Botas</li>
        </ul>
      </div>
    </div>
  );
}