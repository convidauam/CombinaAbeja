export function hasValidCombination(combination) {
  if (!Array.isArray(combination)) return false;
  return combination.some(p => p !== null && p !== undefined);
}

export function hasConfig(config) {
  return !!(config && Array.isArray(config.parts) && config.parts.length > 0);
}