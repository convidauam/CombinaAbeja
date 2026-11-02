import React from 'react';
import { Container, Graphics, Text } from '@pixi/react';
import { useGameStore } from '../state/GameContext.jsx';

export default function SpinningMessage({ progress = 0 }) {
  const isSpinning = useGameStore(s => s.isSpinning);
  if (!isSpinning) return null;

  const barWidth = 160;
  const barX = -barWidth / 2;
  const barY = 22;

  const drawBarBg = (g) => {
    g.clear();
    g.beginFill(0x22222b);
    g.drawRoundedRect(barX, barY, barWidth, 5, 2);
    g.endFill();
  };

  const drawBarFill = (g) => {
    g.clear();
    g.beginFill(0xffd93d);
    g.drawRoundedRect(barX, barY, progress * barWidth, 5, 2);
    g.endFill();
  };

  return (
    <Container>
      <Text
        text="GIRANDO..."
        anchor={0.5}
        y={-10}
        style={{
          fontFamily: 'Arial',
          fontSize: 16,
          fill: 0xffd93d,
          fontWeight: 'bold'
        }}
      />
      <Graphics draw={drawBarBg} />
      <Graphics draw={drawBarFill} />
    </Container>
  );
}