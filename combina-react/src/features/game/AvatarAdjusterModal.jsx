import { useState, useCallback } from 'react';
import { AdjusterCanvas } from './AdjusterCanvas';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 420;

export function AvatarAdjusterModal({
  currentCombination,
  config,
  onClose,
  onSaveAdjustments,
}) {
  const [adjuster, setAdjuster] = useState(null);
  const [state, setState] = useState({
    selected: null,
    parts: [],
    partNames: [],
  });

  const handleAdjusterReady = useCallback((adj) => {
    setAdjuster(adj);
  }, []);

  const handleChange = useCallback((newState) => {
    setState(newState);
  }, []);

  const handleSave = useCallback(() => {
    if (!adjuster) return;
    const adjustments = adjuster.getAdjustments();
    onSaveAdjustments(adjustments);
  }, [adjuster, onSaveAdjustments]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const selectPart = (index) => {
    if (!adjuster) return;
    adjuster.selectPart(index);
  };

  const moveSelected = (dx, dy) => {
    if (!adjuster) return;
    adjuster.moveSelected(dx, dy);
  };

  const adjustSize = (delta) => {
    if (!adjuster) return;
    adjuster.adjustSelectedSize(delta);
  };

  const resetSelected = () => {
    if (!adjuster) return;
    adjuster.resetSelected();
  };

  const resetAll = () => {
    if (!adjuster) return;
    adjuster.resetAll();
  };

  return (
    <div className="adjuster-overlay">
      <div className="adjuster-modal">
        <header className="adjuster-header">
          <h2>Ajustar avatar</h2>
          <button
            type="button"
            className="adjuster-close"
            onClick={handleCancel}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="adjuster-body">
          <div className="adjuster-canvas-area">
            <AdjusterCanvas
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              currentCombination={currentCombination}
              config={config}
              onAdjusterReady={handleAdjusterReady}
              onSave={() => {}}
              onCancel={handleCancel}
              onChange={handleChange}
            />
          </div>

          <aside className="adjuster-controls">
            <h3>Controles</h3>

            <label className="adjuster-field">
              <span>Parte:</span>
              <select
                value={state.selected?.index ?? ''}
                onChange={(e) => selectPart(Number(e.target.value))}
              >
                {state.partNames.map((name, i) => (
                  <option key={i} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <div className="adjuster-row">
              <button
                type="button"
                onClick={() => adjustSize(0.02)}
                className="adjuster-btn"
              >
                + Tamaño
              </button>
              <button
                type="button"
                onClick={() => adjustSize(-0.02)}
                className="adjuster-btn"
              >
                − Tamaño
              </button>
            </div>

            <div className="adjuster-row">
              <button
                type="button"
                onClick={() => moveSelected(-10, 0)}
                className="adjuster-btn adjuster-btn-arrow"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => moveSelected(10, 0)}
                className="adjuster-btn adjuster-btn-arrow"
              >
                →
              </button>
              <button
                type="button"
                onClick={() => moveSelected(0, -10)}
                className="adjuster-btn adjuster-btn-arrow"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveSelected(0, 10)}
                className="adjuster-btn adjuster-btn-arrow"
              >
                ↓
              </button>
            </div>

            <div className="adjuster-row">
              <button
                type="button"
                onClick={resetSelected}
                className="adjuster-btn adjuster-btn-warn"
              >
                Reset parte
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="adjuster-btn adjuster-btn-danger"
              >
                Reset todo
              </button>
            </div>

            {state.selected && (
              <div className="adjuster-info">
                <strong>{state.selected.name}</strong>
                <div>
                  Pos: {state.selected.x}, {state.selected.y}
                </div>
                <div>Escala: {state.selected.scale.toFixed(3)}</div>
              </div>
            )}
          </aside>
        </div>

        <footer className="adjuster-footer">
          <button
            type="button"
            className="adjuster-btn adjuster-btn-secondary"
            onClick={handleCancel}
          >
            CANCELAR
          </button>
          <button
            type="button"
            className="adjuster-btn adjuster-btn-primary"
            onClick={handleSave}
            disabled={!adjuster}
          >
            GUARDAR
          </button>
        </footer>
      </div>
    </div>
  );
}