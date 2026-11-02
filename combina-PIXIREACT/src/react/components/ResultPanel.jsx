import React from 'react';
import { Container, Graphics, Text } from '@pixi/react';

const PANEL_W = 220;
const PANEL_H = 200;
const INNER_X = 8;
const INNER_Y = 28;
const INNER_W = PANEL_W - 16;
const INNER_H = PANEL_H - 38;

export default function ResultPanel({ x = 20, y = 60, children }) {
  const drawBg = (g) => {
    g.clear();
    g.beginFill(0x1e252b);
    g.drawRoundedRect(0, 0, PANEL_W, PANEL_H, 8);
    g.endFill();
    g.lineStyle(2, 0x4f5d65, 1);
    g.drawRoundedRect(0, 0, PANEL_W, PANEL_H, 8);
  };

  const drawResultBg = (g) => {
    g.clear();
    g.beginFill(0xffffff);
    g.drawRoundedRect(INNER_X, INNER_Y, INNER_W, INNER_H, 4);
    g.endFill();
  };

  return (
    <Container x={x} y={y}>
      <Graphics draw={drawBg} />
      <Text
        text="RESULTADO"
        x={PANEL_W / 2}
        y={8}
        anchor={{ x: 0.5, y: 0 }}
        style={{
          fontFamily: 'Arial',
          fontSize: 11,
          fill: 0xdfe6e9,
          fontWeight: 'bold'
        }}
      />
      <Graphics draw={drawResultBg} />
      <Container x={INNER_X + INNER_W / 2} y={INNER_Y + INNER_H / 2}>
        {children}
      </Container>
    </Container>
  );
}