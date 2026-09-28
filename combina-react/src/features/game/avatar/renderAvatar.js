/**
 * Dibuja el avatar en un canvas 2D.
 * @param {Array<number|null>} combination - Índice de variante elegida por slot (null si no hay)
 * @param {Object} config - Config del Combina (parts, orientation, theme, adjustments)
 * @param {Object} options - { width, height } opcional. Default 180x130.
 * @returns {HTMLCanvasElement} - Canvas 2D listo para usar
 */
export function renderAvatar(combination, config, options = {}) {
  const canvasWidth = options.width || 180;
  const canvasHeight = options.height || 130;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // Fondo
  const bgColor = config.theme === 'light' ? '#f5f5f5' : '#1a1a2e';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (!combination || combination.length === 0) {
    return canvas;
  }

  // Recolectar partes válidas
  const validParts = [];
  for (let i = 0; i < combination.length; i++) {
    const partIndex = combination[i];
    if (partIndex !== null && typeof partIndex === 'number') {
      validParts.push({ slotIndex: i, variantIndex: partIndex });
    }
  }

  if (validParts.length === 0) {
    return canvas;
  }

  const adjustments = config.adjustments || { parts: [] };
  const savedAdjustments = adjustments.parts || [];
  const orientation = config.orientation;

  // Escala base del avatar (mismo valor que en el motor Pixi)
  const BASE_SCALE = 0.05;

  if (orientation === 'horizontal') {
    const startX = 100;
    const spacing = 2;
    const centerY = 75;

    for (let i = 0; i < validParts.length; i++) {
      const { slotIndex, variantIndex } = validParts[i];

      const configPart = config.parts[slotIndex];
      if (!configPart) continue;

      const variant = configPart.loadedVariants
        ? configPart.loadedVariants[variantIndex]
        : null;
      if (!variant) continue;

      let adj = savedAdjustments.find((a) => a.index === slotIndex);
      if (!adj) {
        adj = {
          index: slotIndex,
          x: startX + i * spacing,
          y: centerY,
          scale: BASE_SCALE,
        };
      }

      drawPart(ctx, variant, adj, BASE_SCALE);
    }
  } else {
    const centerX = 90;
    const startY = 15;
    const spacing = 30;

    for (let i = 0; i < validParts.length; i++) {
      const { slotIndex, variantIndex } = validParts[i];

      const configPart = config.parts[slotIndex];
      if (!configPart) continue;

      const variant = configPart.loadedVariants
        ? configPart.loadedVariants[variantIndex]
        : null;
      if (!variant) continue;

      let adj = savedAdjustments.find((a) => a.index === slotIndex);
      if (!adj) {
        adj = {
          index: slotIndex,
          x: centerX,
          y: startY + i * spacing,
          scale: BASE_SCALE,
        };
      }

      drawPart(ctx, variant, adj, BASE_SCALE);
    }
  }

  return canvas;
}

/**
 * Dibuja una parte individual con sus ajustes.
 */
function drawPart(ctx, variant, adj, baseScale) {
  const img = variant.originalImageElement;
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const scale = adj.scale || baseScale;
  const width = img.width * scale;
  const height = img.height * scale;
  const x = adj.x - width / 2;
  const y = adj.y - height / 2;

  ctx.drawImage(img, x, y, width, height);
}

/**
 * Convierte un canvas HTML a Blob para descargar.
 */
export function canvasToPngBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}