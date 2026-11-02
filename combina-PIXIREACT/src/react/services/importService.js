/**
 * Convierte un dataURL en HTMLImageElement.
 */
export function dataURLToImage(dataURL) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataURL;
  });
}

/**
 * Construye un config con loadedVariants a partir de un JSON del formulario
 * o de un archivo importado.
 *
 * @param {object} json - { combinaName, orientation, theme, parts, adjustments }
 * @returns {Promise<object|null>} config listo para el store
 */
export async function buildConfigFromJSON(json) {
  if (!json || !json.parts || !json.combinaName) {
    return null;
  }

  const partsData = [];

  for (let i = 0; i < json.parts.length; i++) {
    const partConfig = json.parts[i];
    const variants = [];

    for (const variantData of partConfig.variants || []) {
      if (variantData.dataURL) {
        const img = await dataURLToImage(variantData.dataURL);
        if (img) {
          variants.push({
            id: Date.now() + Math.random(),
            name: variantData.name,
            originalImageElement: img,
            originalImageData: variantData.dataURL,
            originalWidth: img.width,
            originalHeight: img.height
          });
        }
      }
    }

    if (variants.length > 0) {
      partsData.push({
        id: i,
        name: partConfig.name,
        variants,
        loadedVariants: variants
      });
    }
  }

  if (partsData.length === 0) {
    return null;
  }

  return {
    combinaName: json.combinaName,
    orientation: json.orientation || 'horizontal',
    parts: partsData,
    adjustments: json.adjustments || { parts: [] },
    theme: json.theme || 'dark',
    createdAt: json.createdAt || new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
}