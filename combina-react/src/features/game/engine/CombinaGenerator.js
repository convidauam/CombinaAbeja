import { ConfigManager } from './ConfigManager.js';
import { CombinaUI } from './CombinaUI.js';
import { CombinaSpin } from './CombinaSpin.js';
import { CombinaExport } from './CombinaExport.js';

export class CombinaGenerator {
    constructor(app, callbacks = {}) {
        this.app = app;
        this.callbacks = callbacks;

        this.app.renderer.backgroundColor = 0x0f1219;

        this.configManager = new ConfigManager();

        this.slots = [];
        this.slotViews = [];
        this.currentCombination = [];
        this.isSpinning = false;
        this.spinStartTime = 0;
        this.config = null;
        this.lever = null;
        this.ui = null;
        this.spinModule = null;
        this.exportModule = null;
    }

    applyTheme(theme) {
        if (theme === 'light') {
            this.app.renderer.backgroundColor = 0xf5f5f5;
        } else {
            this.app.renderer.backgroundColor = 0x0f1219;
        }
    }

    async load(configData) {
        if (!configData.parts || !configData.combinaName) {
            this.showMessage('Formato de configuracion invalido');
            return false;
        }

        const partsData = [];

        for (let i = 0; i < configData.parts.length; i++) {
            const partConfig = configData.parts[i];
            const variants = [];

            for (const variantData of (partConfig.variants || [])) {
                if (variantData.dataURL) {
                    const img = await this.dataURLToImage(variantData.dataURL);
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
                    variants: variants,
                    loadedVariants: variants
                });
            }
        }

        if (partsData.length === 0) {
            this.showMessage('No se pudieron cargar las imagenes');
            return false;
        }

        this.config = {
            combinaName: configData.combinaName,
            orientation: configData.orientation || 'horizontal',
            parts: partsData,
            adjustments: configData.adjustments || { parts: [] },
            theme: configData.theme || 'dark',
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        this.applyTheme(this.config.theme);
        this.configManager.saveConfig(this.config);
        this.initSlots();

        this.app.stage.removeChildren();
        this.ui = new CombinaUI(this);
        this.ui.createUI();

        // Notificar a React la combinación inicial (todo null) + config enriquecido
        this.notifyCombinationChange();

        return true;
    }

    async dataURLToImage(dataURL) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => {
                console.error('Error cargando imagen:', e);
                resolve(null);
            };
            img.src = dataURL;
        });
    }

    initSlots() {
        if (!this.config || !this.config.parts) return;

        this.slots = this.config.parts.map((part, index) => ({
            index: index,
            type: part.name,
            parts: part.loadedVariants || [],
            spinning: false,
            position: 0,
            finalIndex: null,
            spinSpeed: 0,
            currentIndex: 0
        }));

        this.spinModule = new CombinaSpin(this);
        this.exportModule = new CombinaExport(this);

        this.spinModule.spinConfig.spinDelay = this.slots.map((_, i) => i * 300);
        this.currentCombination = this.slots.map(() => null);
    }

    notifyCombinationChange() {
        if (this.callbacks && this.callbacks.onCombinationChange) {
            this.callbacks.onCombinationChange(
                [...this.currentCombination],
                this.config
            );
        }
    }

    getCurrentCombination() {
        return [...this.currentCombination];
    }

    async spin() {
        if (this.spinModule) {
            await this.spinModule.spin();
            // El spin ya llama a notifyCombinationChange internamente
        }
    }

    updateCurrentCombination() {
        if (this.spinModule) this.spinModule.updateCurrentCombination();
    }

    exportResult() {
        if (this.callbacks && this.callbacks.onExportRequest) {
            this.callbacks.onExportRequest();
        } else if (this.exportModule) {
            this.exportModule.exportResult();
        }
    }

    async exportCombinaPackage() {
        if (this.exportModule) await this.exportModule.exportCombinaPackage();
    }

    resetToImport() {
        if (this.callbacks && this.callbacks.onReset) {
            this.callbacks.onReset();
        } else {
            window.location.reload();
        }
    }

    async openAvatarAdjuster() {
        const hasValid = this.currentCombination.some(p => p !== null);
        if (!hasValid) {
            this.showMessage('Gira primero para generar un avatar antes de ajustar');
            return;
        }

        if (this.callbacks && this.callbacks.onAdjustRequest) {
            this.callbacks.onAdjustRequest({
                currentCombination: [...this.currentCombination],
                config: this.config,
            });
            return;
        }

        console.warn('No hay callback onAdjustRequest configurado');
    }

    applyAdjustments(adjustments) {
        if (!this.config.adjustments) {
            this.config.adjustments = { parts: [] };
        }

        for (const adj of adjustments.parts) {
            const existingIndex = this.config.adjustments.parts.findIndex(a => a.index === adj.index);
            if (existingIndex !== -1) {
                this.config.adjustments.parts[existingIndex] = adj;
            } else {
                this.config.adjustments.parts.push(adj);
            }
        }

        this.configManager.saveConfig(this.config);

        // Notificar a React con combinación + config actualizado
        this.notifyCombinationChange();

        this.showMessage('Ajustes guardados!');
    }

    showMessage(text) {
        if (this.callbacks && this.callbacks.onMessage) {
            this.callbacks.onMessage(text);
        }
    }

    destroy() {
        this.ui = null;
        this.spinModule = null;
        this.exportModule = null;
        this.slots = [];
        this.slotViews = [];
        this.config = null;
    }
}