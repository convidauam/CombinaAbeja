import React, { useMemo } from 'react';
import { Graphics, Sprite } from '@pixi/react';
import * as PIXI from 'pixi.js';

export default function CasinoBackground({ width, height }) {
  const bgTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a2f1d');
    gradient.addColorStop(0.4, '#06170f');
    gradient.addColorStop(1, '#020503');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, height);
    return PIXI.Texture.from(canvas);
  }, [height]);

  const drawTableLines = (g) => {
    g.clear();
    g.lineStyle(1, 0xffffff, 0.03);
    g.moveTo(0, height * 0.15);
    g.lineTo(width, height * 0.15);
    g.moveTo(0, height * 0.85);
    g.lineTo(width, height * 0.85);
  };

  return (
    <>
      <Sprite texture={bgTexture} width={width} height={height} />
      <Graphics draw={drawTableLines} />
    </>
  );
}