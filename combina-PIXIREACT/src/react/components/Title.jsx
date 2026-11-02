import React from 'react';
import { Container, Graphics, Text } from '@pixi/react';

export default function Title({ text, width, isMobile = false }) {
  const panelWidth = isMobile ? 280 : 360;
  const panelHeight = isMobile ? 30 : 45;
  const panelY = isMobile ? 4 : 8;
  const fontSize = isMobile ? 14 : 26;
  const titleY = isMobile ? 10 : 16;

  const drawBg = (g) => {
    g.clear();
    g.beginFill(0x000000, 0.4);
    g.drawRoundedRect(width / 2 - panelWidth / 2, panelY, panelWidth, panelHeight, 8);
    g.endFill();
    g.lineStyle(1, 0xffffff, 0.1);
    g.drawRoundedRect(width / 2 - panelWidth / 2, panelY, panelWidth, panelHeight, 8);
  };

  const style = {
    fontFamily: 'Arial',
    fontSize,
    fill: 0xffd93d,
    fontWeight: 'bold',
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: isMobile ? 4 : 6,
    dropShadowDistance: isMobile ? 2 : 3,
    dropShadowAngle: Math.PI / 6
  };

  return (
    <Container>
      <Graphics draw={drawBg} />
      <Text
        text={` ${text} `}
        x={width / 2}
        y={titleY}
        anchor={{ x: 0.5, y: 0 }}
        style={style}
      />
    </Container>
  );
}