import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { CombinaGenerator } from './engine/CombinaGenerator';

export function GameCanvas({
  config,
  onCombinationChange,
  onMessage,
  onReset,
  onReady,
  onAdjustRequest,
  onExportRequest,
}) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const generatorRef = useRef(null);
  const [app, setApp] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // 1) Crear la app de PIXI una sola vez al montar
  useEffect(() => {
    if (!containerRef.current) return;

    const safeWidth = Math.max(1, Math.floor(window.innerWidth - 40 || 800));
    const safeHeight = Math.max(1, Math.floor(window.innerHeight - 40 || 600));

    let pixiApp;
    try {
      pixiApp = new Application({
        width: safeWidth,
        height: safeHeight,
        backgroundColor: 0x0f1219,
        resolution: 1,
        autoDensity: true,
        antialias: false,
        powerPreference: 'high-performance',
      });
    } catch (err) {
      console.error('Error creando PIXI Application:', err);
      return;
    }

    const canvasElement = pixiApp.view;
    canvasElement.style.display = 'block';
    canvasElement.style.borderRadius = '20px';
    containerRef.current.appendChild(canvasElement);

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
  }, []);

  // 2) Cuando la app esté lista y haya config, crear el generator y cargar la config
  useEffect(() => {
    if (!app || !config) return;

    let cancelled = false;

    const generator = new CombinaGenerator(app, {
      onCombinationChange,
      onMessage,
      onReset,
      onAdjustRequest,
      onExportRequest,
    });

    generator.load(config).then((ok) => {
      if (cancelled) return;
      if (ok) {
        generatorRef.current = generator;
        setIsReady(true);
        if (onReady) onReady(generator);
      } else {
        console.error('No se pudo cargar la config en el generator');
      }
    });

    return () => {
      cancelled = true;
      if (generatorRef.current) {
        generatorRef.current.destroy();
        generatorRef.current = null;
      }
      setIsReady(false);
    };
  }, [app, config]);

  // 3) Manejar resize
  useEffect(() => {
    if (!app) return;

    const handleResize = () => {
      const w = Math.max(1, Math.floor(window.innerWidth - 40 || 800));
      const h = Math.max(1, Math.floor(window.innerHeight - 40 || 600));
      app.renderer.resize(w, h);

      if (generatorRef.current && generatorRef.current.ui) {
        generatorRef.current.ui.createUI();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [app]);

  return (
    <div className="game-canvas-wrapper">
      <div ref={containerRef} className="game-canvas-container" />
      {!isReady && <div className="game-loading">Cargando juego...</div>}
    </div>
  );
}