/**
 * Abre un selector de archivos y devuelve el JSON parseado.
 * Lanza error si el archivo no es válido o si el usuario cancela.
 */
export function pickConfigFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    // Si el usuario cancela, no hay evento "cancel" confiable en todos los navegadores,
    // así que resolvemos cuando selecciona archivo o rechazamos al detectar el blur.
    let resolved = false;

    const onFocusBack = () => {
      setTimeout(() => {
        if (!resolved) {
          reject(new Error('IMPORT_CANCELLED'));
        }
      }, 300);
      window.removeEventListener('focus', onFocusBack);
    };

    input.onchange = async (e) => {
      resolved = true;
      const file = e.target.files?.[0];
      if (!file) {
        reject(new Error('NO_FILE_SELECTED'));
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        resolve(data);
      } catch (err) {
        reject(new Error('INVALID_JSON'));
      }
    };

    window.addEventListener('focus', onFocusBack);
    input.click();
  });
}

/**
 * Valida la estructura mínima del JSON importado.
 * Devuelve null si es válido, o un string de error si no lo es.
 */
export function validateConfigData(data) {
  if (!data || typeof data !== 'object') {
    return 'El archivo no contiene un objeto válido';
  }

  if (!data.combinaName || typeof data.combinaName !== 'string') {
    return 'Falta el campo "combinaName" o no es texto';
  }

  if (!Array.isArray(data.parts) || data.parts.length === 0) {
    return 'Falta el campo "parts" o está vacío';
  }

  for (let i = 0; i < data.parts.length; i++) {
    const part = data.parts[i];
    if (!part.name) {
      return `La parte ${i + 1} no tiene nombre`;
    }
    if (!Array.isArray(part.variants) || part.variants.length === 0) {
      return `La parte "${part.name}" no tiene imágenes`;
    }
    for (let j = 0; j < part.variants.length; j++) {
      const variant = part.variants[j];
      if (!variant.dataURL || typeof variant.dataURL !== 'string') {
        return `Una imagen de la parte "${part.name}" no tiene dataURL`;
      }
      if (!variant.dataURL.startsWith('data:image/')) {
        return `Una imagen de la parte "${part.name}" no es un dataURL válido`;
      }
    }
  }

  return null;
}