import React, { useEffect, useMemo, useState } from 'react';
import { Stage } from '@pixi/react';
import { useGameStore } from '../state/GameContext.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import CasinoBackground from './CasinoBackground.jsx';
import GameScene from './GameScene.jsx';

function computeDimensions(isMobile) {
  if (typeof window === 'undefined') return { width: 1400, height: 900 };
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (isMobile || w < 768) return { width: w - 20, height: h - 20 };
  return { width: Math.min(1400, w - 40), height: Math.min(900, h - 40) };
}

export default function GameStage() {
  const config = useGameStore(s => s.config);
  const isMobile = useGameStore(s => s.isMobile);
  const setIsMobile = useGameStore(s => s.setIsMobile);
  const isMobileMQ = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (isMobileMQ !== isMobile) setIsMobile(isMobileMQ);
  }, [isMobileMQ, isMobile, setIsMobile]);

  const [viewport, setViewport] = useState(() => computeDimensions(isMobileMQ));
  
  useEffect(() => {
    const onResize = () => setViewport(computeDimensions(isMobileMQ));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isMobileMQ]);

  const stageOptions = useMemo(() => ({
    backgroundColor: 0x061c12,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1
  }), []);

  if (!config || !config.parts || config.parts.length === 0) {
    return null;
  }

  return (
    <Stage width={viewport.width} height={viewport.height} options={stageOptions}>
      <CasinoBackground width={viewport.width} height={viewport.height} />
      <GameScene width={viewport.width} height={viewport.height} config={config} />
    </Stage>
  );
}