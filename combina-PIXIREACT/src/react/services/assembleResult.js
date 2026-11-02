import { AVATAR_DIMS } from '../state/constants.js';

/**
 * Ensambla el avatar en un canvas.
 * Puerto puro de CombinaGenerator.assembleResult.
 *
 * @param {Array<number|null>} combination - Indices de variante por slot
 * @param {object} config - Config del Combina (parts, adjustments, orientation, theme)
 * @returns {HTMLCanvasElement}
 */
export function assembleResult(combination, config) {
  const { width: W, height: H, baseScale: BASE_SCALE } = AVATAR_DIMS;

  const validParts = [];
  for (let i = 0; i < combination.length; i++) {
    const idx = combination[i];
    if (idx !== null && typeof idx === 'number') {
      validParts.push({ slotIndex: i, variantIndex: idx });
    }
  }

  if (validParts.length === 0) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#888888';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GIRA', W / 2, H / 2 - 10);
    ctx.fillText('PARA COMENZAR', W / 2, H / 2 + 10);
    return canvas;
  }

  const adjustments = config.adjustments || { parts: [] };
  const savedAdjustments = adjustments.parts || [];

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = config.theme === 'light' ? '#f5f5f5' : '#1a1a2e';
  ctx.fillRect(0, 0, W, H);

  if (config.orientation === 'horizontal') {
    const { startX, spacing, centerY } = AVATAR_DIMS.horizontal;

    for (let i = 0; i < validParts.length; i++) {
      const { slotIndex, variantIndex } = validParts[i];
      const configPart = config.parts[slotIndex];
      if (!configPart) continue;

      const variant = configPart.loadedVariants
        ? configPart.loadedVariants[variantIndex]
        : null;
      if (!variant) continue;

      let adj = savedAdjustments.find(a => a.index === slotIndex);
      if (!adj) {
        adj = { index: slotIndex, x: startX + i * spacing, y: centerY, scale: BASE_SCALE };
      }

      const img = variant.originalImageElement;
      if (img && img.complete && img.naturalWidth > 0) {
        const scale = adj.scale || BASE_SCALE;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, adj.x - w / 2, adj.y - h / 2, w, h);
      }
    }
  } else {
    const { centerX, startY, spacingY } = AVATAR_DIMS.vertical;

    for (let i = 0; i < validParts.length; i++) {
      const { slotIndex, variantIndex } = validParts[i];
      const configPart = config.parts[slotIndex];
      if (!configPart) continue;

      const variant = configPart.loadedVariants
        ? configPart.loadedVariants[variantIndex]
        : null;
      if (!variant) continue;

      let adj = savedAdjustments.find(a => a.index === slotIndex);
      if (!adj) {
        adj = { index: slotIndex, x: centerX, y: startY + i * spacingY, scale: BASE_SCALE };
      }

      const img = variant.originalImageElement;
      if (img && img.complete && img.naturalWidth > 0) {
        const scale = adj.scale || BASE_SCALE;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, adj.x - w / 2, adj.y - h / 2, w, h);
      }
    }
  }

  return canvas;
}