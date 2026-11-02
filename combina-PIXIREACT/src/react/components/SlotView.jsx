import React, { useMemo } from 'react';
import { Container, Graphics, Sprite, Text } from '@pixi/react';
import * as PIXI from 'pixi.js';

export default function SlotView({
  x = 0,
  y = 0,
  width,
  height,
  parts,
  position = 0,
  spacing = 90,
  isMobile = false,
  isSpinning = false,
  spinSpeed = 0
}) {
  const selectorY = height / 2;

  const cachedTextures = useMemo(() => {
    if (!parts || parts.length === 0) return [];
    return parts.map((part) => {
      if (part.originalImageElement) {
        return PIXI.Texture.from(part.originalImageElement);
      }
      return null;
    });
  }, [parts]);

  const blurFilter = useMemo(() => {
    const f = new PIXI.BlurFilter();
    f.blur = 0;
    return f;
  }, []);

  const blurAmount = isSpinning ? Math.min(5, spinSpeed / 10) : 0;
  if (blurFilter.blur !== blurAmount) {
    blurFilter.blur = blurAmount;
  }

  const sprites = useMemo(() => {
    if (!parts || parts.length === 0) return [];

    const radius = height * 0.52;
    const centerIndex = Math.floor(position / spacing) % parts.length;
    const offsetRange = isMobile
      ? [-3, -2, -1, 0, 1, 2, 3]
      : [-4, -3, -2, -1, 0, 1, 2, 3, 4];

    const result = [];

    for (const offset of offsetRange) {
      const partIndex = (centerIndex + offset + parts.length) % parts.length;
      const part = parts[partIndex];
      if (!part) continue;

      const texture = cachedTextures[partIndex] || null;
      if (!texture) continue;

      const yOffset = (position % spacing) - (offset * spacing);
      const angle = yOffset / radius;
      if (Math.abs(angle) > Math.PI / 2) continue;

      const spriteY = selectorY + Math.sin(angle) * radius;
      const zScale = Math.cos(angle);

      const maxSlotSize = isMobile ? 85 : 195;
      const baseScale = Math.min(
        maxSlotSize / texture.width,
        maxSlotSize / texture.height,
        isMobile ? 0.70 : 1.25
      );

      const scaleY = baseScale * zScale;
      const scaleX = baseScale * (1 - Math.abs(angle) * 0.08);

      let alpha = Math.pow(zScale, 1.5);
      if (isSpinning) {
        alpha *= 0.8;
      } else if (offset === 0 && Math.abs(yOffset) < 15) {
        alpha = 1.0;
      }

      result.push({
        key: `${partIndex}-${offset}`,
        texture,
        x: width / 2,
        y: spriteY,
        scaleX,
        scaleY,
        alpha: Math.max(0, Math.min(1, alpha))
      });
    }

    return result;
  }, [parts, position, spacing, height, width, isMobile, isSpinning, cachedTextures, selectorY]);

  const drawBackground = (g) => {
    g.clear();
    g.beginFill(0xffffff);
    g.drawRect(0, 0, width, height);
    g.endFill();
  };

  const drawOverlay3D = (g) => {
    g.clear();
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const pct = i / steps;
      const shadowAlpha = Math.pow(1 - pct, 2.3) * 0.88;
      const segmentHeight = (height * 0.25) / steps;
      g.beginFill(0x000000, shadowAlpha);
      g.drawRect(-1, i * segmentHeight, width + 2, segmentHeight);
      g.drawRect(-1, height - (i * segmentHeight) - segmentHeight, width + 2, segmentHeight);
      g.endFill();
    }

    g.beginFill(0x000000, 0.02);
    g.drawRect(-1, height * 0.25, width + 2, height * 0.08);
    g.drawRect(-1, height * 0.67, width + 2, height * 0.08);
    g.endFill();

    g.beginFill(0xffffff, 0.08);
    g.drawRect(-1, height * 0.45, width + 2, 4);
    g.endFill();

    g.lineStyle(1, 0x000000, 0.03);
    g.moveTo(-1, selectorY);
    g.lineTo(width + 1, selectorY);
  };

  return (
    <Container x={x} y={y}>
      <Graphics draw={drawBackground} />

      {(!parts || parts.length === 0) && (
        <Text
          text="Cargar JSON"
          x={width / 2}
          y={selectorY}
          anchor={0.5}
          style={{
            fontFamily: 'Arial',
            fontSize: 13,
            fill: 0xff4757,
            align: 'center',
            fontWeight: 'bold'
          }}
        />
      )}

      {sprites.map((s) => (
        <Sprite
          key={s.key}
          texture={s.texture}
          x={s.x}
          y={s.y}
          anchor={0.5}
          scale={{ x: s.scaleX, y: s.scaleY }}
          alpha={s.alpha}
          filters={isSpinning ? [blurFilter] : null}
        />
      ))}

      <Graphics draw={drawOverlay3D} />
    </Container>
  );
}