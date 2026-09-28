import { useEffect } from 'react';
import { ImageUploader } from './ImageUploader';

export function StepImages({ data, onChange, onMessage }) {
  const { partsCount, parts } = data;

  // Asegurar que el array parts tenga el tamaño correcto
  useEffect(() => {
    const next = [...parts];

    while (next.length < partsCount) {
      next.push({
        name: `Parte ${next.length + 1}`,
        variants: [],
      });
    }
    while (next.length > partsCount) {
      next.pop();
    }

    // Solo actualizar si realmente cambió (evita loops)
    const changed =
      next.length !== parts.length ||
      next.some((p, i) => !parts[i] || p.variants !== parts[i].variants);

    if (changed) {
      onChange({ parts: next });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partsCount]);

  const addImages = (partIndex, files) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      onMessage('Por favor selecciona archivos de imagen válidos (PNG, JPG, GIF, WEBP)', 'warning');
      return;
    }

    let processed = 0;
    const newVariants = [];

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newVariants.push({
          name: file.name.replace(/\.[^/.]+$/, ''),
          dataURL: e.target.result,
        });
        processed++;

        if (processed === validFiles.length) {
          const next = [...parts];
          next[partIndex] = {
            ...next[partIndex],
            variants: [...(next[partIndex]?.variants || []), ...newVariants],
          };
          onChange({ parts: next });
          onMessage(
            `Se cargaron ${validFiles.length} imagen(es) para la parte ${partIndex + 1}`,
            'success'
          );
        }
      };
      reader.onerror = () => {
        processed++;
        onMessage(`Error al cargar ${file.name}`, 'error');
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (partIndex, variantIndex) => {
    const next = [...parts];
    next[partIndex] = {
      ...next[partIndex],
      variants: next[partIndex].variants.filter((_, i) => i !== variantIndex),
    };
    onChange({ parts: next });
  };

  return (
    <div className="step-content">
      <h2>Cargar imágenes</h2>
      <p className="step-description">
        <strong>Importante:</strong> Cada parte necesita al menos UNA imagen.
      </p>

      {Array.from({ length: partsCount }).map((_, i) => {
        const part = parts[i] || { name: `Parte ${i + 1}`, variants: [] };
        return (
          <div key={i} className="part-section">
            <div className="part-title">
              {part.name}
              <span className={`image-counter ${part.variants.length === 0 ? 'empty' : ''}`}>
                {part.variants.length} imagen(es)
              </span>
            </div>

            <ImageUploader
              partIndex={i}
              onFiles={(files) => addImages(i, files)}
            />

            {part.variants.length > 0 && (
              <div className="image-list">
                {part.variants.map((variant, idx) => (
                  <div key={idx} className="image-item">
                    <img src={variant.dataURL} alt={variant.name} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(i, idx)}
                      aria-label={`Eliminar imagen ${variant.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="preview-area highlight">
        <p>
          <strong>Consejo:</strong> Para mejores resultados, usa imágenes con fondo
          transparente (PNG) y proporciones similares.
        </p>
        <p className="hint">
          Las imágenes se guardarán directamente en el archivo JSON en formato base64.
        </p>
      </div>
    </div>
  );
}