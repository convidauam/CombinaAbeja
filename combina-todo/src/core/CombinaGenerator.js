import { ConfigManager } from './ConfigManager.js';
import { AssetLoader } from './AssetLoader.js';
import { CombinaUI } from './CombinaUI.js';
import { CombinaSpin } from './CombinaSpin.js';
import { CombinaExport } from './CombinaExport.js';
import * as PIXI from 'pixi.js';

export class CombinaGenerator {
    constructor(app) {
        console.log('CombinaGenerator constructor');
        this.app = app;
        
        this.app.renderer.backgroundColor = 0x0f1219;
        
        this.configManager = new ConfigManager();
        this.assetLoader = new AssetLoader();
        
        this.slots = [];
        this.slotViews = [];
        this.currentCombination = [];
        this.isSpinning = false;
        this.spinStartTime = 0;
        this.config = null;
        this.resultSprite = null;
        this.resultContainer = null;
        this.lever = null;
        this.ui = null;
        this.spinModule = null;
        this.exportModule = null;
        this.saveBtn = null;
        this.cancelBtn = null;
        
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
    }

    handleResize() {
        if (!this.app || !this.config) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        let gameWidth = Math.min(1400, width - 40);
        let gameHeight = Math.min(900, height - 40);
        
        if (width < 768) {
            gameWidth = width - 20;
            gameHeight = height - 20;
        }
        
        this.app.renderer.resize(gameWidth, gameHeight);
        
        if (this.ui && this.config) {
            const currentCombination = [...this.currentCombination];
            const currentAdjustments = this.config.adjustments;
            
            this.ui.createUI();
            
            this.currentCombination = currentCombination;
            this.config.adjustments = currentAdjustments;
            this.updateResultDisplay();
            
            if (this.slotViews && this.slotViews.length > 0) {
                this.slotViews.forEach((view, index) => {
                    const slot = this.slots[index];
                    if (slot && slot.parts) {
                        view.updateParts(
                            slot.parts,
                            slot.position,
                            { spinning: false, spinSpeed: 0, finalIndex: slot.finalIndex }
                        );
                    }
                });
            }
        }
    }

    applyTheme(theme) {
        if (theme === 'light') {
            this.app.renderer.backgroundColor = 0xf5f5f5;
        } else {
            this.app.renderer.backgroundColor = 0x0f1219;
        }
    }

    async importConfigFromFile() {
        console.log('Abriendo selector de archivos...');
        
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) {
                    reject('No se selecciono archivo');
                    return;
                }
                
                try {
                    const text = await file.text();
                    const configData = JSON.parse(text);
                    console.log('JSON cargado:', configData);
                    
                    await this.buildFromConfig(configData);
                    resolve(configData);
                } catch (error) {
                    console.error('Error:', error);
                    this.showMessage('Error al cargar el archivo JSON');
                    reject(error);
                }
            };
            
            input.click();
        });
    }

    async buildFromConfig(configData) {
        console.log('buildFromConfig iniciado', configData);
        
        if (!configData.parts || !configData.combinaName) {
            this.showMessage('Formato de JSON invalido');
            return;
        }
        
        const loadingMsg = new PIXI.Text('Cargando imagenes...', {
            fontFamily: 'Arial', fontSize: 20, fill: 0xffd93d, fontWeight: 'bold'
        });
        loadingMsg.x = this.app.screen.width / 2 - loadingMsg.width / 2;
        loadingMsg.y = this.app.screen.height / 2;
        this.app.stage.addChild(loadingMsg);
        
        await new Promise(r => setTimeout(r, 50));
        
        const partsData = [];
        
        for (let i = 0; i < configData.parts.length; i++) {
            const partConfig = configData.parts[i];
            const variants = [];
            
            console.log(`Procesando parte ${i}: ${partConfig.name}`);
            
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
        
        loadingMsg.destroy();
        
        if (partsData.length === 0) {
            this.showMessage('No se pudieron cargar las imagenes');
            return;
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
        
        console.log('Configuracion final:', this.config);
        
        this.applyTheme(this.config.theme);
        this.configManager.saveConfig(this.config);
        this.initSlots();
        
        this.app.stage.removeChildren();
        this.ui = new CombinaUI(this);
        this.ui.createUI();
        
        this.updateResultDisplay();
        this.showMessage(this.config.combinaName + ' cargado!');
    }

    async dataURLToImage(dataURL) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                console.log('Imagen cargada: ' + img.width + 'x' + img.height);
                resolve(img);
            };
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
        
        console.log('Slots inicializados:', this.slots.length);
    }

    updateResultDisplay() {
        if (!this.resultContainer) return;
        
        const hasValidCombination = this.currentCombination.some(part => part !== null);
        
        if (this.resultSprite) {
            this.resultSprite.destroy();
            this.resultSprite = null;
        }
        
        if (this.resultContainer && this.resultContainer.children) {
            for (let i = this.resultContainer.children.length - 1; i >= 3; i--) {
                const child = this.resultContainer.children[i];
                if (child !== this.resultContainer.children[0] && 
                    child !== this.resultContainer.children[1] && 
                    child !== this.resultContainer.children[2]) {
                    child.destroy();
                }
            }
        }
        
        if (!hasValidCombination) {
            const emptyMsg = new PIXI.Text('GIRA\nPARA COMENZAR', {
                fontFamily: 'Arial', 
                fontSize: 12, 
                fill: this.config?.theme === 'light' ? 0x333333 : 0xffffff, 
                align: 'center', 
                fontWeight: 'bold'
            });
            emptyMsg.x = (this.resultContainer.width - emptyMsg.width) / 2;
            emptyMsg.y = (this.resultContainer.height - emptyMsg.height) / 2;
            this.resultContainer.addChild(emptyMsg);
            this.resultSprite = emptyMsg;
            return;
        }
        
        const canvas = this.assembleResult(this.currentCombination);
        const texture = PIXI.Texture.from(canvas);
        const sprite = new PIXI.Sprite(texture);
        sprite.x = (this.resultContainer.width - sprite.width) / 2;
        sprite.y = (this.resultContainer.height - sprite.height) / 2;
        sprite.scale.set(1);
        this.resultContainer.addChild(sprite);
        this.resultSprite = sprite;
    }

    assembleResult(parts) {
        const validParts = [];
        for (let i = 0; i < parts.length; i++) {
            const partIndex = parts[i];
            if (partIndex !== null && typeof partIndex === 'number') {
                validParts.push({
                    slotIndex: i,
                    variantIndex: partIndex
                });
            }
        }
        
        if (validParts.length === 0) {
            const canvas = document.createElement('canvas');
            canvas.width = 180;
            canvas.height = 130;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#888888';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GIRA', canvas.width / 2, canvas.height / 2 - 10);
            ctx.fillText('PARA COMENZAR', canvas.width / 2, canvas.height / 2 + 10);
            return canvas;
        }
        
        const adjustments = this.config.adjustments || { parts: [] };
        const orientation = this.config.orientation;
        
        const canvasWidth = 180;
        const canvasHeight = 130;
        
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = this.config.theme === 'light' ? '#f5f5f5' : '#1a1a2e';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        const savedAdjustments = adjustments.parts || [];
        const AVATAR_BASE_SCALE = 0.05;
        
        if (orientation === 'horizontal') {
            const startX = 100;
            const spacing = 2;
            const centerY = 75;
            
            for (let i = 0; i < validParts.length; i++) {
                const slotIndex = validParts[i].slotIndex;
                const variantIndex = validParts[i].variantIndex;
                
                const configPart = this.config.parts[slotIndex];
                if (!configPart) continue;
                
                const variant = configPart.loadedVariants ? configPart.loadedVariants[variantIndex] : null;
                if (!variant) continue;
                
                let adj = savedAdjustments.find(a => a.index === slotIndex);
                if (!adj) {
                    adj = { 
                        index: slotIndex,
                        x: startX + i * spacing, 
                        y: centerY, 
                        scale: AVATAR_BASE_SCALE
                    };
                }
                
                const img = variant.originalImageElement;
                if (img && img.complete && img.naturalWidth > 0) {
                    const scale = adj.scale || AVATAR_BASE_SCALE;
                    const width = img.width * scale;
                    const height = img.height * scale;
                    const x = adj.x - (width / 2);
                    const y = adj.y - (height / 2);
                    
                    ctx.drawImage(img, x, y, width, height);
                }
            }
        } else {
            const centerX = 90;
            const startY = 15;
            const spacing = 30;
            
            for (let i = 0; i < validParts.length; i++) {
                const slotIndex = validParts[i].slotIndex;
                const variantIndex = validParts[i].variantIndex;
                
                const configPart = this.config.parts[slotIndex];
                if (!configPart) continue;
                
                const variant = configPart.loadedVariants ? configPart.loadedVariants[variantIndex] : null;
                if (!variant) continue;
                
                let adj = savedAdjustments.find(a => a.index === slotIndex);
                if (!adj) {
                    adj = { 
                        index: slotIndex,
                        x: centerX, 
                        y: startY + i * spacing, 
                        scale: AVATAR_BASE_SCALE
                    };
                }
                
                const img = variant.originalImageElement;
                if (img && img.complete && img.naturalWidth > 0) {
                    const scale = adj.scale || AVATAR_BASE_SCALE;
                    const width = img.width * scale;
                    const height = img.height * scale;
                    const x = adj.x - (width / 2);
                    const y = adj.y - (height / 2);
                    
                    ctx.drawImage(img, x, y, width, height);
                }
            }
        }
        
        return canvas;
    }

    async spin() {
        if (this.spinModule) await this.spinModule.spin();
    }

    updateCurrentCombination() {
        if (this.spinModule) this.spinModule.updateCurrentCombination();
    }

    exportResult() {
        if (this.exportModule) this.exportModule.exportResult();
    }

    async exportCombinaPackage() {
        if (this.exportModule) await this.exportModule.exportCombinaPackage();
    }

    resetToImport() {
        console.log('Recargando pagina para volver a importar...');
        window.location.reload();
    }

    async openAvatarAdjuster() {
        const hasValid = this.currentCombination.some(p => p !== null);
        if (!hasValid) {
            this.showMessage('Gira primero para generar un avatar antes de ajustar');
            return;
        }
        
        const { AvatarAdjuster } = await import('../views/AvatarAdjuster.js');
        
        const mainUI = this.app.stage.children.filter(child => 
            child !== this.resultContainer && child !== this.lever);
        mainUI.forEach(child => child.visible = false);
        
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.7);
        overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        overlay.endFill();
        overlay.eventMode = 'static';
        overlay.interactiveChildren = false;
        this.app.stage.addChild(overlay);
        
        const panel = new PIXI.Graphics();
        panel.beginFill(0xffffff);
        panel.drawRoundedRect(0, 0, 900, 600, 20);
        panel.endFill();
        panel.lineStyle(1, 0xdddddd);
        panel.drawRoundedRect(0, 0, 900, 600, 20);
        panel.x = this.app.screen.width / 2 - 450;
        panel.y = this.app.screen.height / 2 - 300;
        this.app.stage.addChild(panel);
        
        const title = new PIXI.Text('AJUSTAR POSICION DEL AVATAR', {
            fontFamily: 'Arial', fontSize: 20, fill: 0x333333, fontWeight: 'bold'
        });
        title.x = panel.x + 450 - title.width / 2;
        title.y = panel.y + 15;
        this.app.stage.addChild(title);
        
        const adjuster = new AvatarAdjuster(
            this.app, panel.x + 50, panel.y + 80, 500, 450,
            this.currentCombination,
            this.config,
            (adjustments) => {
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
                this.updateResultDisplay();
                
                overlay.destroy();
                panel.destroy();
                title.destroy();
                if (adjuster.container) adjuster.container.destroy();
                if (this.saveBtn) this.saveBtn.destroy();
                if (this.cancelBtn) this.cancelBtn.destroy();
                
                mainUI.forEach(child => child.visible = true);
                
                this.showMessage('Ajustes guardados!');
            },
            () => {
                overlay.destroy();
                panel.destroy();
                title.destroy();
                if (adjuster.container) adjuster.container.destroy();
                if (this.saveBtn) this.saveBtn.destroy();
                if (this.cancelBtn) this.cancelBtn.destroy();
                mainUI.forEach(child => child.visible = true);
            }
        );
        
        this.app.stage.addChild(adjuster.container);
        adjuster.loadParts();
        
        this.saveBtn = this.createSimpleButton(panel.x + 750, panel.y + 490, 100, 40, 'GUARDAR', 0x4a4a4a);
        this.saveBtn.on('pointerdown', () => adjuster.save());
        this.app.stage.addChild(this.saveBtn);
        
        this.cancelBtn = this.createSimpleButton(panel.x + 750, panel.y + 540, 100, 40, 'CANCELAR', 0x999999);
        this.cancelBtn.on('pointerdown', () => adjuster.cancel());
        this.app.stage.addChild(this.cancelBtn);
    }

    createSimpleButton(x, y, width, height, text, color) {
        const button = new PIXI.Graphics();
        button.beginFill(color);
        button.drawRoundedRect(0, 0, width, height, 8);
        button.endFill();
        button.x = x;
        button.y = y;
        button.eventMode = 'static';
        button.cursor = 'pointer';
        
        const label = new PIXI.Text(text, {
            fontFamily: 'Arial', fontSize: 12, fill: 0xffffff, fontWeight: 'bold'
        });
        label.x = width / 2 - label.width / 2;
        label.y = height / 2 - label.height / 2;
        button.addChild(label);
        
        return button;
    }

    showMessage(text) {
        const msg = new PIXI.Text(text, {
            fontFamily: 'Arial', fontSize: 18, fill: 0xffd93d,
            fontWeight: 'bold', dropShadow: true, dropShadowColor: '#000000'
        });
        msg.x = this.app.screen.width / 2 - msg.width / 2;
        msg.y = this.app.screen.height - 70;
        this.app.stage.addChild(msg);
        setTimeout(() => msg.destroy(), 2500);
    }

    celebrate() {
        if (this.resultSprite) {
            this.resultSprite.alpha = 0.8;
            setTimeout(() => {
                if (this.resultSprite) this.resultSprite.alpha = 1;
            }, 200);
        }
    }

    getCurrentPartPositions() {
        return null;
    }
}