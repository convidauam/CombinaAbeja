import React from 'react';
import { Container, Text } from '@pixi/react';
import { useGameStore } from '../state/GameContext.jsx';

export default function ToastMessage({ width, height }) {
  const toasts = useGameStore(s => s.toasts);
  if (!toasts || toasts.length === 0) return null;

  return (
    <Container x={width / 2} y={height - 70}>
      {toasts.map((t, i) => (
        <Text
          key={t.id}
          text={t.text}
          y={i * 22}
          anchor={0.5}
          style={{
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffd93d,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowDistance: 2
          }}
        />
      ))}
    </Container>
  );
}