import React from 'react';
import { Container, Graphics } from '@pixi/react';

export function getCylinderDimensions(slotCount, slotWidth, slotHeight, slotSpacing, paddingH, paddingV) {
  const totalSlotsWidth = slotCount * slotWidth + Math.max(0, slotCount - 1) * slotSpacing;
  return {
    totalSlotsWidth,
    cylinderWidth: totalSlotsWidth + paddingH * 2,
    cylinderHeight: slotHeight + paddingV * 2
  };
}

export default function CylinderChassis({
  slotCount,
  slotWidth,
  slotHeight,
  slotSpacing,
  paddingH,
  paddingV,
  x,
  y,
  children
}) {
  const { totalSlotsWidth, cylinderWidth, cylinderHeight } = getCylinderDimensions(
    slotCount,
    slotWidth,
    slotHeight,
    slotSpacing,
    paddingH,
    paddingV
  );

  const drawChassis = (g) => {
    g.clear();
    g.beginFill(0x353b48);
    g.drawRoundedRect(0, 0, cylinderWidth, cylinderHeight, 12);
    g.endFill();
    g.lineStyle(3, 0x718093, 1);
    g.drawRoundedRect(1, 1, cylinderWidth - 2, cylinderHeight - 2, 11);
    g.lineStyle(1, 0x2f3640, 1);
    g.drawRoundedRect(3, 3, cylinderWidth - 6, cylinderHeight - 6, 9);
  };

  const drawWindow = (g) => {
    g.clear();
    g.beginFill(0xffffff);
    g.drawRect(paddingH, paddingV, totalSlotsWidth, slotHeight);
    g.endFill();
  };

  const drawDividers = (g) => {
    g.clear();
    for (let i = 1; i < slotCount; i++) {
      const divX = paddingH + i * slotWidth + (i - 1) * slotSpacing + slotSpacing / 2;
      g.beginFill(0x2f3640);
      g.drawRect(divX - 2, paddingV, 4, slotHeight);
      g.endFill();
      g.lineStyle(1, 0x718093, 0.7);
      g.moveTo(divX + 2, paddingV);
      g.lineTo(divX + 2, paddingV + slotHeight);
    }
  };

  return (
    <Container x={x} y={y}>
      <Graphics draw={drawChassis} />
      <Graphics draw={drawWindow} />
      <Graphics draw={drawDividers} />
      {children}
    </Container>
  );
}