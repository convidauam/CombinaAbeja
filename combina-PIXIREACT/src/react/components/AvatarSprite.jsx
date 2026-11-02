import React, { useEffect, useMemo, useState } from 'react';
import { Sprite, Text } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { useGameStore } from '../state/GameContext.jsx';
import { assembleResult } from '../services/assembleResult.js';

export default function AvatarSprite() {
  const config = useGameStore(s => s.config);
  const combination = useGameStore(s => s.combination);

  const hasValid = combination && combination.some(p => p !== null && p !== undefined);

  // Textura memoizada: solo se recrea si cambia la combinacion o el config
  const texture = useMemo(() => {
    if (!config || !hasValid) return null;
    const canvas = assembleResult(combination, config);
    return PIXI.Texture.from(canvas);
  }, [config, combination, hasValid]);

  // Limpieza de textura anterior
  useEffect(() => {
    return () => {
      if (texture) texture.destroy(true);
    };
  }, [texture]);

  if (!hasValid) {
    return (
      <Text
        text={'GIRA\nPARA COMENZAR'}
        anchor={0.5}
        style={{
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0x333333,
          align: 'center',
          fontWeight: 'bold'
        }}
      />
    );
  }

  if (!texture) return null;

  return <Sprite texture={texture} anchor={0.5} />;
}