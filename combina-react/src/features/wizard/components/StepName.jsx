export function StepName({ value, onChange }) {
  return (
    <div className="step-content">
      <h2>Nombre del Combina</h2>

      <div className="form-group">
        <label htmlFor="combinaName">¿Cómo se llamará tu creación?</label>
        <input
          id="combinaName"
          type="text"
          placeholder="Ej: Combinabeja, CriaturaFantastica, AvatarEpico"
          value={value}
          onChange={(e) => onChange({ name: e.target.value })}
          autoFocus
        />
      </div>

      <div className="preview-area">
        <p>Elige un nombre descriptivo y divertido que identifique tu creación.</p>
        <p className="hint">Este nombre aparecerá en el título del juego.</p>
      </div>
    </div>
  );
}