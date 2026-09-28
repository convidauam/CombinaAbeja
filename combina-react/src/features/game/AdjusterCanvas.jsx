import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';

export function AdjusterCanvas({
  width,
  height,
  currentCombination,
  config,
  onAdjusterReady,
  onSave,
  onCancel,
  onChange,
}) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const adjusterRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Crear app Pixi
  useEffect(() => {
    if (!containerRef.current) return;

    let pixiApp;
    try {
      pixiApp = new Application({
        width,
        height,
        backgroundColor: 0x1e2b38,
        resolution: 1,
        autoDensity: true,
        antialias: true,
      });
    } catch (err) {
      console.error('Error creando PIXI Application (Adjuster):', err);
      return;
    }

    const canvasElement = pixiApp.view;
    canvasElement.style.display = 'block';
    canvasElement.style.borderRadius = '12px';
    containerRef.current.appendChild(canvasElement);

    appRef.current = pixiApp;

    return () => {
      try {
        pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
      } catch (err) {
        console.warn('Error destruyendo PIXI Adjuster:', err);
      }
      appRef.current = null;
      adjusterRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Crear el AvatarAdjuster dentro de la app
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    let cancelled = false;

    import('./engine/AvatarAdjuster.js').then(({ AvatarAdjuster }) => {
      if (cancelled) return;

      const adjuster = new AvatarAdjuster(
        app,
        0,
        0,
        width,
        height,
        currentCombination,
        config,
        onSave,
        onCancel,
        onChange
      );

      app.stage.addChild(adjuster.container);
      adjuster.loadParts();
      adjusterRef.current = adjuster;
      setIsReady(true);

      if (onAdjusterReady) onAdjusterReady(adjuster);
    });

    return () => {
      cancelled = true;
      if (adjusterRef.current) {
        if (adjusterRef.current.container) {
          adjusterRef.current.container.destroy({ children: true });
        }
        adjusterRef.current = null;
      }
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {!isReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffd93d',
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          Cargando ajustador...
        </div>
      )}
    </div>
  );
}