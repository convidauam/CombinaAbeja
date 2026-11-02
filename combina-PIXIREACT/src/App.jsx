import React from 'react';
import { useGameStore } from './react/state/GameContext.jsx';
import HomeScreen from './react/components/HomeScreen.jsx';
import Wizard from './react/components/wizard/Wizard.jsx';
import GameStage from './react/components/GameStage.jsx';

export default function App() {
  const phase = useGameStore(s => s.phase);
  const config = useGameStore(s => s.config);

  if (phase === 'wizard') {
    return <Wizard />;
  }

  if (phase === 'home' || !config) {
    return <HomeScreen />;
  }

  return <GameStage />;
}