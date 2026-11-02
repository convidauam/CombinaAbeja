import { useCallback, useRef, useState, useEffect } from 'react';
import { useTick } from '@pixi/react';
import { SPIN_CONFIG } from '../state/constants.js';
import { useGameStore } from '../state/GameContext.jsx';

export function useSpin(partsBySlot) {
  const setSpinning = useGameStore(s => s.setSpinning);
  const setCombination = useGameStore(s => s.setCombination);
  const isSpinning = useGameStore(s => s.isSpinning);

  const slotsRef = useRef([]);
  const startTimeRef = useRef(0);
  const runningRef = useRef(false);

  const [positions, setPositions] = useState(() => (partsBySlot || []).map(() => 0));
  const [speeds, setSpeeds] = useState(() => (partsBySlot || []).map(() => 0));
  const [progress, setProgress] = useState(0);

  const desiredCount = (partsBySlot || []).length;
  if (slotsRef.current.length !== desiredCount) {
    slotsRef.current = Array.from({ length: desiredCount }, (_, i) => {
      const prev = slotsRef.current[i];
      return prev || {
        position: 0,
        spinning: false,
        spinSpeed: 0,
        finalIndex: null,
        targetPosition: 0,
        startPosition: 0
      };
    });
    if (positions.length !== desiredCount) setPositions(new Array(desiredCount).fill(0));
    if (speeds.length !== desiredCount) setSpeeds(new Array(desiredCount).fill(0));
  }

  useTick(() => {
    if (!runningRef.current) return;

    const slots = slotsRef.current;
    const partsArrays = partsBySlot || [];
    const elapsed = Date.now() - startTimeRef.current;
    const baseDuration = SPIN_CONFIG.spinTime;

    const newPositions = positions.slice();
    const newSpeeds = speeds.slice();

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const parts = partsArrays[i] || [];

      if (!slot.spinning) {
        newPositions[i] = slot.position;
        newSpeeds[i] = 0;
        continue;
      }

      const slotDelay = i * 180;
      const slotElapsed = Math.max(0, elapsed - slotDelay);
      const slotProgress = Math.min(1, slotElapsed / baseDuration);

      if (slotProgress <= 0) slot.spinSpeed = 0;
      else if (slotProgress < 0.15) slot.spinSpeed = SPIN_CONFIG.maxSpeed * Math.pow(slotProgress / 0.15, 2);
      else if (slotProgress < 0.65) slot.spinSpeed = SPIN_CONFIG.maxSpeed;
      else slot.spinSpeed = SPIN_CONFIG.maxSpeed * (1 - Math.pow((slotProgress - 0.65) / 0.35, 3));

      const maxPosition = parts.length * SPIN_CONFIG.spacing;
      if (maxPosition <= 0) {
        slot.spinning = false; slot.spinSpeed = 0;
        newPositions[i] = slot.position; newSpeeds[i] = 0;
        continue;
      }

      slot.position += Math.max(0.5, slot.spinSpeed);
      slot.position %= maxPosition;

      if (slotProgress > 0.88) {
        const remaining = (slot.targetPosition - slot.position + maxPosition) % maxPosition;
        if (remaining < slot.spinSpeed * 1.5 || slotElapsed >= baseDuration) {
          slot.spinning = false;
          slot.position = slot.targetPosition;
          slot.spinSpeed = 0;
        }
      }

      newPositions[i] = slot.position;
      newSpeeds[i] = slot.spinSpeed;
    }

    const allFinished = slots.every(s => !s.spinning);

    setPositions(newPositions);
    setSpeeds(newSpeeds);
    setProgress(Math.min(1, elapsed / baseDuration));

    if (allFinished) {
      runningRef.current = false;
      const combination = slots.map((slot, i) => {
        const parts = partsArrays[i] || [];
        return (parts.length > 0 && slot.finalIndex !== null) ? Math.min(slot.finalIndex, parts.length - 1) : null;
      });
      setCombination(combination);
      setSpinning(false);
      setProgress(0);
    }
  });

  const spin = useCallback(() => {
    if (runningRef.current || !partsBySlot || partsBySlot.length === 0) return;

    slotsRef.current.forEach((slot, i) => {
      const parts = partsBySlot[i] || [];
      if (parts.length === 0) {
        slot.spinning = false; slot.finalIndex = null; return;
      }
      slot.spinning = true;
      slot.finalIndex = Math.floor(Math.random() * parts.length);
      slot.spinSpeed = SPIN_CONFIG.maxSpeed;
      slot.targetPosition = slot.finalIndex * SPIN_CONFIG.spacing;
      slot.startPosition = slot.position || 0;
    });

    startTimeRef.current = Date.now();
    runningRef.current = true;
    setSpinning(true);
  }, [partsBySlot, setSpinning]);

  // Auto-spin o combinación inicial al montar (opcional, para que no esté vacío)
  useEffect(() => {
    if (partsBySlot.length > 0 && positions.every(p => p === 0)) {
       // Si quieres que el juego inicie con un giro automático, descomenta:
       // spin(); 
       // O simplemente asigna una posición aleatoria inicial
       const initialComb = partsBySlot.map(parts => parts.length > 0 ? Math.floor(Math.random() * parts.length) : null);
       setCombination(initialComb);
       const initialPositions = initialComb.map((idx, i) => idx !== null ? idx * SPIN_CONFIG.spacing : 0);
       slotsRef.current.forEach((s, i) => { s.position = initialPositions[i]; });
       setPositions(initialPositions);
    }
  }, [partsBySlot.length]); // Solo al iniciar

  return { positions, speeds, spin, isSpinning, progress };
}