export function GameControls({ generator, avatarCanvasRef, disabled = false }) {
  const handleSave = async () => {
    if (!avatarCanvasRef?.current) {
      console.warn('No hay canvas de avatar');
      return;
    }

    const canvas = avatarCanvasRef.current;
    const blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );

    if (!blob) {
      console.warn('No se pudo generar la imagen');
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const name = generator?.config?.combinaName || 'avatar';
    link.download = `${name}_${timestamp}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAdjust = () => {
    if (!generator) return;
    generator.openAvatarAdjuster();
  };

  const handlePackage = () => {
    if (!generator) return;
    generator.exportCombinaPackage();
  };

  const handleNew = () => {
    if (!generator) return;
    generator.resetToImport();
  };

  return (
    <div className="game-controls">
      <button
        type="button"
        className="game-btn game-btn-danger"
        onClick={handleNew}
        disabled={disabled}
      >
        NUEVO
      </button>

      <div className="game-controls-right">
        <button
          type="button"
          className="game-btn game-btn-purple"
          onClick={handlePackage}
          disabled={disabled}
        >
          PAQUETE
        </button>

        <button
          type="button"
          className="game-btn game-btn-warning"
          onClick={handleAdjust}
          disabled={disabled}
        >
          AJUSTAR
        </button>

        <button
          type="button"
          className="game-btn game-btn-success"
          onClick={handleSave}
          disabled={disabled}
        >
          GUARDAR
        </button>
      </div>
    </div>
  );
}