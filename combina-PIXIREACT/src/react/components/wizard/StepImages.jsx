import React, { useRef, useState } from 'react';

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StepImages({ partsCount, parts, onChange }) {
  const [dragging, setDragging] = useState(null);
  const fileInputsRef = useRef({});

  const ensurePart = (index, currentParts) => {
    const next = [...currentParts];
    while (next.length <= index) {
      next.push({ name: `Parte ${next.length + 1}`, variants: [] });
    }
    return next;
  };

  const processFiles = async (fileList, partIndex) => {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    let next = ensurePart(partIndex, parts);

    for (const file of files) {
      try {
        const dataURL = await readFileAsDataURL(file);
        const name = file.name.replace(/\.[^/.]+$/, '');
        next = next.map((p, i) => {
          if (i !== partIndex) return p;
          return { ...p, variants: [...p.variants, { name, dataURL }] };
        });
      } catch (e) {
        console.error('Error leyendo archivo', file.name, e);
      }
    }

    onChange(next);
  };

  const handleFileInputChange = (partIndex, e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files, partIndex);
      e.target.value = '';
    }
  };

  const handleDrop = (partIndex, e) => {
    e.preventDefault();
    setDragging(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files, partIndex);
    }
  };

  const handleRemove = (partIndex, variantIndex) => {
    const next = parts.map((p, i) => {
      if (i !== partIndex) return p;
      return { ...p, variants: p.variants.filter((_, vi) => vi !== variantIndex) };
    });
    onChange(next);
  };

  const triggerFilePicker = (partIndex) => {
    const input = fileInputsRef.current[partIndex];
    if (input) input.click();
  };

  const partsToRender = [];
  for (let i = 0; i < partsCount; i++) {
    partsToRender.push(parts[i] || { name: `Parte ${i + 1}`, variants: [] });
  }

  return (
    <div>
      <h2>Cargar imagenes</h2>
      <p><strong>Importante:</strong> cada parte necesita al menos una imagen.</p>

      {partsToRender.map((part, i) => {
        const count = part.variants.length;
        const isDragging = dragging === i;
        return (
          <div key={i} className="wizard-part-section">
            <div className="wizard-part-title">
              <span>{`Parte ${i + 1}`}</span>
              <span className={`wizard-counter ${count === 0 ? 'warn' : ''}`}>
                {count} {count === 1 ? 'imagen' : 'imagenes'}
              </span>
            </div>

            <input
              ref={(el) => { fileInputsRef.current[i] = el; }}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFileInputChange(i, e)}
            />

            <div
              className={`wizard-upload-area ${isDragging ? 'dragover' : ''}`}
              onClick={() => triggerFilePicker(i)}
              onDragOver={(e) => { e.preventDefault(); setDragging(i); }}
              onDragLeave={(e) => { e.preventDefault(); setDragging(null); }}
              onDrop={(e) => handleDrop(i, e)}
            >
              Haz clic o arrastra imagenes aqui
              <small>Formatos: PNG, JPG, GIF, WEBP</small>
            </div>

            {count > 0 && (
              <div className="wizard-image-list">
                {part.variants.map((variant, vi) => (
                  <div key={vi} className="wizard-image-item">
                    <img src={variant.dataURL} alt={variant.name} />
                    <button
                      type="button"
                      className="wizard-image-remove"
                      onClick={() => handleRemove(i, vi)}
                      title="Eliminar imagen"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="wizard-hint">
        <strong>Consejo:</strong> para mejores resultados, usa imagenes con fondo transparente (PNG)
        y proporciones similares. Las imagenes se guardan directamente en el JSON en formato base64.
      </div>
    </div>
  );
}