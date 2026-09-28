import { Routes, Route, Navigate } from 'react-router-dom';
import { HomeScreen } from '../screens/HomeScreen';
import { WizardScreen } from '../screens/WizardScreen';
import { GameScreen } from '../screens/GameScreen';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/wizard" element={<WizardScreen />} />
      <Route path="/game" element={<GameScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}