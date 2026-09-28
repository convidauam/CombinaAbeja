/**
 * Convierte los datos del wizard al formato JSON final
 * que espera CombinaGenerator.buildFromConfig()
 */
export function exportWizardJSON(wizardData) {
  const config = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    combinaName: wizardData.name.trim(),
    orientation: wizardData.orientation,
    theme: 'light',
    parts: [],
    adjustments: { parts: [] },
  };

  for (let i = 0; i < wizardData.partsCount; i++) {
    const part = wizardData.parts[i];
    config.parts.push({
      id: i,
      name: `Parte ${i + 1}`,
      variants: (part?.variants || []).map((v) => ({
        name: v.name,
        dataURL: v.dataURL,
        width: 0,
        height: 0,
      })),
    });
  }

  return config;
}

/**
 * Descarga el JSON como archivo
 */
export function downloadConfigJSON(config) {
  const jsonString = JSON.stringify(config, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const safeName = config.combinaName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  link.download = `${safeName}_${timestamp}.json`;
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}