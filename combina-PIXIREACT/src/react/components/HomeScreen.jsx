import React, { useRef } from 'react';
import { useGameStore } from '../state/GameContext.jsx';
import { buildConfigFromJSON } from '../services/importService.js';

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #0a2f1d 0%, #06170f 40%, #020503 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: 'Arial, sans-serif',
    color: '#dfe6e9',
    overflow: 'auto'
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffd93d',
    marginBottom: 8,
    textShadow: '0 4px 20px rgba(255, 217, 61, 0.4)',
    letterSpacing: 1,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 15,
    color: '#b2bec3',
    marginBottom: 48,
    textAlign: 'center'
  },
  cardsRow: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 720,
    width: '100%'
  },
  card: {
    flex: 1,
    minWidth: 240,
    maxWidth: 320,
    background: '#1e252b',
    border: '2px solid #3a4143',
    borderRadius: 16,
    padding: '32px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.25s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd93d',
    margin: 0
  },
  cardDesc: {
    fontSize: 12,
    color: '#b2bec3',
    lineHeight: 1.5,
    margin: 0
  },
  cardPrimary: {
    borderColor: '#ffd93d',
    background: '#2d3436'
  },
  error: {
    marginTop: 24,
    padding: '10px 16px',
    background: 'rgba(255, 71, 87, 0.15)',
    color: '#ff6b7a',
    borderRadius: 8,
    borderLeft: '3px solid #ff4757',
    fontSize: 13
  }
};

export default function HomeScreen() {
  const setConfig = useGameStore(s => s.setConfig);
  const setPhase = useGameStore(s => s.setPhase);
  const pushToast = useGameStore(s => s.pushToast);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const fileInputRef = useRef(null);

  const handleCreate = () => {
    setPhase('wizard');
  };

  const handleImportClick = () => {
    setError(null);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const config = await buildConfigFromJSON(json);
      if (!config) {
        setError('Formato de JSON invalido o sin imagenes cargables');
        setLoading(false);
        return;
      }
      setConfig(config);
      setPhase('game');
      pushToast(`${config.combinaName} cargado!`);
    } catch (err) {
      console.error(err);
      setError('Error al leer el archivo JSON');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.title}>CombinaCosas</div>
      <div style={styles.subtitle}>Crea tu propio combinador</div>

      <div style={styles.cardsRow}>
        <div
          style={{ ...styles.card, ...styles.cardPrimary }}
          onClick={handleCreate}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <h2 style={styles.cardTitle}>Crear nuevo Combina</h2>
          <p style={styles.cardDesc}>
            Asistente paso a paso para disenar tu propio juego desde cero.
          </p>
        </div>

        <div
          style={styles.card}
          onClick={loading ? undefined : handleImportClick}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <h2 style={styles.cardTitle}>{loading ? 'Cargando...' : 'Importar configuracion'}</h2>
          <p style={styles.cardDesc}>
            Carga un archivo JSON previamente generado para jugar.
          </p>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}