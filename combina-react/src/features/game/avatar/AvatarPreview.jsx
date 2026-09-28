import { useEffect, useRef } from 'react';
import { renderAvatar } from './renderAvatar';
import './avatar.css';

/**
 * Muestra el avatar generado por la combinación actual.
 * Se dibuja sobre un <canvas> HTML, encima del canvas de Pixi.
 */
export function AvatarPreview({
  combination,
  config,
  width = 220,
  height = 200,
  canvasRef: externalRef,
}) {
  const internalRef = useRef(null);
  const ref = externalRef || internalRef;

  useEffect(() => {
    if (!ref.current || !config) return;
    if (!combination || combination.length === 0) return;

    const hasValid = combination.some((part) => part !== null);
    if (!hasValid) return;

    const rendered = renderAvatar(combination, config, {
      width: 180,
      height: 130,
    });

    const targetCanvas = ref.current;
    targetCanvas.width = 180;
    targetCanvas.height = 130;

    const ctx = targetCanvas.getContext('2d');
    ctx.clearRect(0, 0, 180, 130);
    ctx.drawImage(rendered, 0, 0);
  }, [combination, config, ref]);

  const hasValidCombination =
    combination && combination.some((part) => part !== null);

  return (
    <div className="avatar-preview" style={{ width, height }}>
      <div className="avatar-preview-title">RESULTADO</div>
      <div className="avatar-preview-frame">
        {!hasValidCombination && (
          <div className="avatar-preview-empty">
            GIRA
            <br />
            PARA COMENZAR
          </div>
        )}
        <canvas
          ref={ref}
          className="avatar-preview-canvas"
          style={{ display: hasValidCombination ? 'block' : 'none' }}
        />
      </div>
    </div>
  );
}