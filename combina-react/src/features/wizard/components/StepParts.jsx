export function StepParts({ value, onChange }) {
  return (
    <div className="step-content">
      <h2>Número de partes</h2>

      <div className="form-group">
        <label htmlFor="partsCount">¿Cuántas partes tendrá tu Combina?</label>
        <input
          id="partsCount"
          type="number"
          min={2}
          max={10}
          value={value}
          onChange={(e) => {
            const raw = parseInt(e.target.value, 10);
            if (Number.isNaN(raw)) return;
            if (raw < 2 || raw > 10) return;
            onChange({ partsCount: raw });
          }}
          autoFocus
        />
      </div>

      <div className="preview-area">
        <p><strong>Ejemplos según cantidad de partes</strong></p>
        <ul>
          <li><strong>2 partes:</strong> Cabeza + Cuerpo</li>
          <li><strong>3 partes:</strong> Cabeza + Torso + Piernas</li>
          <li><strong>4 partes:</strong> Casco + Visera + Armadura + Botas</li>
        </ul>
      </div>
    </div>
  );
}