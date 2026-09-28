import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';

export function usePixiApp({ width, height, backgroundColor = 0x0f1219 }) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const [app, setApp] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Asegurar dimensiones válidas (>0)
    const safeWidth = Math.max(1, Math.floor(width || window.innerWidth - 40 || 800));
    const safeHeight = Math.max(1, Math.floor(height || window.innerHeight - 40 || 600));

    let pixiApp;

    try {
      pixiApp = new Application({
        view: canvas,
        width: safeWidth,
        height: safeHeight,
        backgroundColor,
        resolution: 1,           // ← bajamos a 1 para evitar problemas en algunos drivers
        autoDensity: true,
        antialias: false,
        powerPreference: 'high-performance',
      });
    } catch (err) {
      console.error('Error creando PIXI Application:', err);
      return;
    }

    appRef.current = pixiApp;
    setApp(pixiApp);

    return () => {
      try {
        pixiApp.destroy(true, {
          children: true,
          texture: true,
          baseTexture: true,
        });
      } catch (err) {
        console.warn('Error destruyendo PIXI app:', err);
      }
      appRef.current = null;
      setApp(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { canvasRef, app };
}