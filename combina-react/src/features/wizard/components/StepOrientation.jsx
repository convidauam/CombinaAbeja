const OPTIONS = [
  {
    value: 'horizontal',
    icon: '⬅️ ➡️',
    title: 'Horizontal',
    subtitle: 'Partes una al lado de la otra',
    example: '[Parte1] [Parte2] [Parte3]',
  },
  {
    value: 'vertical',
    icon: '⬆️ ⬇️',
    title: 'Vertical',
    subtitle: 'Partes apiladas una sobre otra',
    example: '[Parte1] [Parte2] [Parte3]'.split(' ').join('\n'),
  },
];

export function StepOrientation({ value, onChange }) {
  return (
    <div className="step-content">
      <h2>Orientación del ensamblaje</h2>
      <p className="step-description">
        ¿Cómo se unirán las partes para formar el avatar final?
      </p>

      <div className="orientation-preview">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`orientation-box ${value === opt.value ? 'selected' : ''}`}
            onClick={() => onChange({ orientation: opt.value })}
          >
            <div className="orientation-icon">{opt.icon}</div>
            <div className="orientation-title"><strong>{opt.title}</strong></div>
            <small className="orientation-subtitle">{opt.subtitle}</small>
            <div className="orientation-example">
              {opt.value === 'horizontal' ? (
                <span>{opt.example}</span>
              ) : (
                <>
                  <div>[Parte1]</div>
                  <div>[Parte2]</div>
                  <div>[Parte3]</div>
                </>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}