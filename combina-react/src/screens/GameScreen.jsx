import { useCallback, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GameCanvas } from '../features/game/GameCanvas';
import { GameControls } from '../features/game/GameControls';
import { AvatarPreview } from '../features/game/avatar/AvatarPreview';
import { AvatarAdjusterModal } from '../features/game/AvatarAdjusterModal';
import '../features/game/avatar/avatar.css';
import './game.css';
import './adjuster.css';

export function GameScreen() {
  const navigate = useNavigate();
  const config = useGameStore((s) => s.config);
  const clearConfig = useGameStore((s) => s.clearConfig);

  const [toast, setToast] = useState(null);
  const [generator, setGenerator] = useState(null);
  const [adjustRequest, setAdjustRequest] = useState(null);
  const [loadedConfig, setLoadedConfig] = useState(null);
  const [currentCombination, setCurrentCombination] = useState(
    config ? config.parts.map(() => null) : []
  );

  const avatarCanvasRef = useRef(null);

  const handleCombinationChange = useCallback((combination, engineConfig) => {
    setCurrentCombination(combination);
    if (engineConfig) {
      setLoadedConfig(engineConfig);
    }
  }, []);

  const handleMessage = useCallback((text) => {
    setToast({ text, id: Date.now() });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleReset = useCallback(() => {
    clearConfig();
    navigate('/');
  }, [clearConfig, navigate]);

  const handleGeneratorReady = useCallback((gen) => {
    setGenerator(gen);
  }, []);

  const handleAdjustRequest = useCallback((data) => {
    setAdjustRequest(data);
  }, []);

  const handleCloseAdjuster = useCallback(() => {
    setAdjustRequest(null);
  }, []);

  const handleSaveAdjustments = useCallback(
    (adjustments) => {
      if (generator) {
        generator.applyAdjustments(adjustments);
      }
      setAdjustRequest(null);
    },
    [generator]
  );

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
        onReady={handleGeneratorReady}
        onAdjustRequest={handleAdjustRequest}
      />

      <AvatarPreview
        combination={currentCombination}
        config={loadedConfig || config}
        width={220}
        height={200}
        canvasRef={avatarCanvasRef}
      />

      <GameControls
        generator={generator}
        avatarCanvasRef={avatarCanvasRef}
        disabled={!generator}
      />

      {toast && (
        <div className="game-toast" key={toast.id}>
          {toast.text}
        </div>
      )}

      {adjustRequest && (
        <AvatarAdjusterModal
          currentCombination={adjustRequest.currentCombination}
          config={adjustRequest.config}
          onClose={handleCloseAdjuster}
          onSaveAdjustments={handleSaveAdjustments}
        />
      )}

      <Link to="/" className="game-back-link">
        ← Volver al Home
      </Link>
    </div>
  );
}