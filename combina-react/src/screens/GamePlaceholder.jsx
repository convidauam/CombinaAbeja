import { Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export function GamePlaceholder() {
  const config = useGameStore((s) => s.config);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>CombinaCosas — Game</h1>
      <p style={styles.subtitle}>Aquí vivirá el canvas de Pixi (Fase 3)</p>

      {config ? (
        <p style={styles.info}>
          Config actual: <strong style={{ color: '#ffd93d' }}>{config.combinaName}</strong>
          <br />
          <span style={{ fontSize: 13, color: '#cccccc' }}>
            {config.parts.length} partes · Orientación: {config.orientation}
          </span>
        </p>
      ) : (
        <p style={styles.info}>No hay configuración cargada todavía.</p>
      )}

      <nav style={styles.nav}>
        <Link to="/" style={styles.link}>
          Volver al Home
        </Link>
        <Link to="/wizard" style={styles.link}>
          Ir al Wizard
        </Link>
      </nav>
    </div>
  );
}

const styles = {
  page: {
    color: '#fff',
    fontSize: 20,
    padding: 40,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    marginBottom: 12,
    color: '#ffd93d',
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 24,
  },
  info: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 24,
    lineHeight: 1.6,
  },
  nav: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  link: {
    color: '#ffd93d',
    textDecoration: 'none',
    padding: '10px 20px',
    border: '2px solid #ffd93d',
    borderRadius: 8,
    fontWeight: 'bold',
  },
};