export class ConfigManager {
    constructor() {
        this.storageKey = 'combina_config';
    }

    saveConfig(config) {
        try {
            const configToSave = this.sanitizeConfig(config);
            const jsonString = JSON.stringify(configToSave);
            localStorage.setItem(this.storageKey, jsonString);
            console.log('Configuracion guardada correctamente');
        } catch (error) {
            console.error('Error guardando configuracion:', error);
        }
    }

    sanitizeConfig(config) {
        if (!config) return null;
        
        const safeConfig = {
            combinaName: config.combinaName,
            orientation: config.orientation,
            theme: config.theme,
            createdAt: config.createdAt,
            lastModified: config.lastModified,
            adjustments: { parts: [] },
            parts: []
        };
        
        if (config.adjustments && config.adjustments.parts) {
            safeConfig.adjustments.parts = config.adjustments.parts.map(part => ({
                index: part.index,
                name: part.name,
                x: part.x,
                y: part.y,
                scale: part.scale
            }));
        }
        
        if (config.parts && Array.isArray(config.parts)) {
            safeConfig.parts = config.parts.map(part => ({
                id: part.id,
                name: part.name,
                variantsCount: part.variants ? part.variants.length : 0
            }));
        }
        
        return safeConfig;
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error cargando configuracion:', error);
        }
        return null;
    }

    clearConfig() {
        localStorage.removeItem(this.storageKey);
        console.log('Configuracion eliminada');
    }
}