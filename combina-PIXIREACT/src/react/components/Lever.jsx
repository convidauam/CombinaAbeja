import React, { useEffect, useRef } from 'react';
import { Container, Graphics } from '@pixi/react';

export default function Lever({ x, y, scale = 1.4, onPull }) {
  const movingPartRef = useRef(null);
  const knobRef = useRef(null);
  const shaftRef = useRef(null);

  const isPullingRef = useRef(false);
  const pullProgressRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const applyTransform = () => {
    const p = pullProgressRef.current;
    const moving = movingPartRef.current;
    const knob = knobRef.current;
    const shaft = shaftRef.current;

    if (moving) {
      const maxScaleY = -0.3;
      const currentScaleY = 1.0 - (p * (1.0 - maxScaleY));
      moving.scale.y = currentScaleY;
    }
    if (knob) {
      knob.y = p * 110;
    }
    if (shaft) {
      shaft.alpha = 1.0 - (p * 0.25);
    }
  };

  const animatePull = () => {
    const startTime = Date.now();
    const durationDown = 250;
    const durationUp = 350;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed < durationDown) {
        const t = elapsed / durationDown;
        pullProgressRef.current = Math.sin((t * Math.PI) / 2);
        applyTransform();
        rafRef.current = requestAnimationFrame(tick);
      } else if (elapsed < durationDown + durationUp) {
        const t = (elapsed - durationDown) / durationUp;
        const bounce = Math.exp(-t * 5) * Math.cos(t * Math.PI * 2.5);
        pullProgressRef.current = Math.max(0, bounce);
        applyTransform();
        rafRef.current = requestAnimationFrame(tick);
      } else {
        isPullingRef.current = false;
        pullProgressRef.current = 0;
        applyTransform();
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const handlePointerDown = () => {
    if (isPullingRef.current) return;
    isPullingRef.current = true;
    animatePull();
    if (onPull) onPull();
  };

  const drawBase = (g) => {
    g.clear();
    g.beginFill(0x000000, 0.45);
    g.drawRect(-22, -20, 48, 50);
    g.endFill();

    g.beginFill(0x4e545c);
    g.drawRoundedRect(-18, -16, 40, 44, 6);
    g.endFill();

    g.lineStyle(2, 0x95a5a6, 0.85);
    g.drawRoundedRect(-15, -13, 34, 38, 4);

    g.lineStyle(0);
    g.beginFill(0x1a1a1a);
    g.drawCircle(2, 6, 14);
    g.endFill();
  };

  const drawShaft = (g) => {
    g.clear();
    g.beginFill(0x000000, 0.3);
    g.drawRect(-7, -75, 12, 75);
    g.endFill();

    g.beginFill(0xbdc3c7);
    g.drawRect(-6, -75, 12, 75);
    g.endFill();

    g.beginFill(0xffffff, 0.75);
    g.drawRect(-2, -75, 3, 75);
    g.endFill();

    g.beginFill(0x7f8c8d, 0.4);
    g.drawRect(-6, -75, 2, 75);
    g.drawRect(4, -75, 2, 75);
    g.endFill();
  };

  const drawKnob = (g) => {
    g.clear();
    g.beginFill(0x000000, 0.35);
    g.drawCircle(0, -75, 21);
    g.endFill();

    g.beginFill(0xc0392b);
    g.drawCircle(0, -75, 20);
    g.endFill();

    g.beginFill(0xff7675, 0.85);
    g.drawCircle(-6, -81, 8);
    g.endFill();

    g.beginFill(0xffffff, 0.95);
    g.drawCircle(-8, -84, 3.5);
    g.endFill();
  };

  return (
    <Container
      x={x}
      y={y}
      scale={scale}
      eventMode="static"
      cursor="pointer"
      pointerdown={handlePointerDown}
    >
      <Graphics draw={drawBase} />

      <Container x={2} y={6} ref={movingPartRef}>
        <Graphics draw={drawShaft} ref={shaftRef} />
        <Container ref={knobRef}>
          <Graphics draw={drawKnob} />
        </Container>
      </Container>
    </Container>
  );
}