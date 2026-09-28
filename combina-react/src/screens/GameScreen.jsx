import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GameCanvas } from '../features/game/GameCanvas';
import './game.css';

export function GameScreen() {
  const navigate = useNavigate();
  const config = useGameStore((s) => s.config);
  const clearConfig = useGameStore((s) => s.clearConfig);
  const [toast, setToast] = useState(null);

  const handleCombinationChange = useCallback((combination) => {
    // React ahora "sabe" la combinación actual.
    // console.log('Combinación actual:', combination);
  }, []);

  const handleMessage = useCallback((text) => {
    setToast({ text, id: Date.now() });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleReset = useCallback(() => {
    clearConfig();
    navigate('/');
  }, [clearConfig, navigate]);

  if (!config) {
    return (
      <div className="game-empty">
        <h2>No hay configuración cargada</h2>
        <p>Importa un JSON o crea un nuevo Combina primero.</p>
        <div className="game-empty-actions">
          <Link to="/" className="game-link">Volver al Home</Link>
          <Link to="/wizard" className="game-link">Crear nuevo</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="game-root">
      <GameCanvas
        config={config}
        onCombinationChange={handleCombinationChange}
        onMessage={handleMessage}
        onReset={handleReset}
      />

      {toast && (
        <div className="game-toast" key={toast.id}>
          {toast.text}
        </div>
      )}

      <Link to="/" className="game-back-link">
        ← Volver al Home
      </Link>
    </div>
  );
}