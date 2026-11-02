import React from 'react';

export default function StepReview({ config, onPlay, onDownload }) {
  const totalImages = config.parts.reduce((acc, p) => acc + p.variants.length, 0);

  return (
    <div>
      <h2>Revisar y jugar</h2>
      <p>Revisa la configuracion de tu Combina antes de continuar.</p>

      <div className="wizard-review">
        <div className="wizard-review-row">
          <span>Nombre</span>
          <span>{config.combinaName}</span>
        </div>
        <div className="wizard-review-row">
          <span>Orientacion</span>
          <span>{config.orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}</span>
        </div>
        <div className="wizard-review-row">
          <span>Partes</span>
          <span>{config.parts.length}</span>
        </div>
        <div className="wizard-review-row">
          <span>Imagenes totales</span>
          <span>{totalImages}</span>
        </div>
      </div>

      <div className="wizard-hint">
        <strong>Listo!</strong> Puedes jugar directamente en la app o descargar el JSON
        para guardarlo o compartirlo.
      </div>
    </div>
  );
}