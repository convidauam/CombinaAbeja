import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { pickConfigFile, validateConfigData } from '../features/import/importConfigFile';
import './home.css';

export function HomeScreen() {
  const navigate = useNavigate();
  const setConfig = useGameStore((s) => s.setConfig);
  const config = useGameStore((s) => s.config);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImport = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const data = await pickConfigFile();
      const validationError = validateConfigData(data);

      if (validationError) {
        setError(validationError);
        setIsLoading(false);
        return;
      }

      setConfig(data);
      setIsLoading(false);
      navigate('/game');
    } catch (err) {
      if (err.message === 'IMPORT_CANCELLED' || err.message === 'NO_FILE_SELECTED') {
        setIsLoading(false);
        return;
      }

      if (err.message === 'INVALID_JSON') {
        setError('El archivo no es un JSON válido');
      } else {
        setError('Error al importar la configuración');
      }
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/wizard');
  };

  return (
    <div className="home-root">
      <div className="home-panel">
        <h1 className="home-title">COMBINATODO</h1>
        <p className="home-subtitle">Cargar configuración existente</p>

        {error && <div className="home-error">{error}</div>}

        <div className="home-actions">
          <button
            type="button"
            className="home-btn home-btn-primary"
            onClick={handleImport}
            disabled={isLoading}
          >
            {isLoading ? 'Cargando...' : 'IMPORTAR CONFIGURACIÓN'}
          </button>

          <button
            type="button"
            className="home-btn home-btn-secondary"
            onClick={handleCreate}
            disabled={isLoading}
          >
            CREAR NUEVO COMBINA
          </button>
        </div>

        {config && (
          <div className="home-current">
            <p>Última configuración cargada:</p>
            <strong>{config.combinaName}</strong>
            <button
              type="button"
              className="home-btn home-btn-tertiary"
              onClick={() => navigate('/game')}
            >
              Ir al juego
            </button>
          </div>
        )}

        <p className="home-help">
          Usa el creador para generar un JSON, o importa uno existente para jugar.
        </p>
      </div>
    </div>
  );
}