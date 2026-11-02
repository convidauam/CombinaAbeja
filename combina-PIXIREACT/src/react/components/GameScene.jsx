import React from 'react';
import { Container, Graphics, Text } from '@pixi/react';
import { useGameStore } from '../state/GameContext.jsx';
import { useSpin } from '../hooks/useSpin.js';
import { useExport } from '../hooks/useExport.js';
import { SLOT_DESKTOP, SPIN_CONFIG } from '../state/constants.js';
import Title from './Title.jsx';
import ResultPanel from './ResultPanel.jsx';
import CylinderChassis, { getCylinderDimensions } from './CylinderChassis.jsx';
import SlotView from './SlotView.jsx';
import Lever from './Lever.jsx';
import AvatarSprite from './AvatarSprite.jsx';
import SpinningMessage from './SpinningMessage.jsx';
import ToastMessage from './ToastMessage.jsx';

function SaveButton({ x, y, width, height, onClick }) {
  const drawBg = (g) => {
    g.clear();
    g.beginFill(0x2ed573); // Verde
    g.drawRoundedRect(0, 0, width, height, 6);
    g.endFill();
  };

  return (
    <Container x={x} y={y} eventMode="static" cursor="pointer" pointerdown={onClick}>
      <Graphics draw={drawBg} />
      <Text
        text="GUARDAR"
        x={width / 2}
        y={height / 2}
        anchor={0.5}
        style={{ fontFamily: 'Arial', fontSize: 12, fill: 0xffffff, fontWeight: 'bold' }}
      />
    </Container>
  );
}

export default function GameScene({ width, height, config }) {
  const isMobile = useGameStore(s => s.isMobile);
  const isSpinning = useGameStore(s => s.isSpinning);
  
  const partsBySlot = React.useMemo(() => {
    return config.parts.map(p => p.loadedVariants || []);
  }, [config]);

  const { positions, speeds, spin, progress } = useSpin(partsBySlot);
  const { handleSave } = useExport();

  const slotDims = SLOT_DESKTOP;
  const cylinder = React.useMemo(() => {
    const dims = getCylinderDimensions(
      partsBySlot.length, slotDims.width, slotDims.height, slotDims.spacing, slotDims.paddingH, slotDims.paddingV
    );
    return {
      ...dims,
      startX: (width - dims.cylinderWidth) / 2,
      startY: 300 - slotDims.paddingV
    };
  }, [partsBySlot.length, width, slotDims]);

  const leverX = width - 85;
  const leverY = height / 2 + 15;

  return (
    <>
      <Title text={config.combinaName} width={width} isMobile={isMobile} />

      <ResultPanel x={20} y={60}>
        <AvatarSprite />
        {isSpinning && <SpinningMessage progress={progress} />}
      </ResultPanel>

      <CylinderChassis
        slotCount={partsBySlot.length}
        slotWidth={slotDims.width}
        slotHeight={slotDims.height}
        slotSpacing={slotDims.spacing}
        paddingH={slotDims.paddingH}
        paddingV={slotDims.paddingV}
        x={cylinder.startX}
        y={cylinder.startY}
      >
        {config.parts.map((part, i) => {
          const slotX = slotDims.paddingH + i * (slotDims.width + slotDims.spacing);
          return (
            <SlotView
              key={i}
              x={slotX}
              y={slotDims.paddingV}
              width={slotDims.width}
              height={slotDims.height}
              parts={part.loadedVariants || []}
              position={positions[i] || 0}
              spacing={SPIN_CONFIG.spacing}
              isMobile={isMobile}
              isSpinning={isSpinning}
              spinSpeed={speeds[i] || 0}
            />
          );
        })}
      </CylinderChassis>

      <Lever x={leverX} y={leverY} scale={1.4} onPull={spin} />

      <SaveButton
        x={width - 140}
        y={height - 55}
        width={120}
        height={38}
        onClick={handleSave}
      />

      <ToastMessage width={width} height={height} />
    </>
  );
}