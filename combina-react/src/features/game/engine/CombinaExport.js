import JSZip from 'jszip';

export class CombinaExport {
    constructor(generator) {
        this.generator = generator;
        this.app = generator.app;
        this.config = generator.config;
    }

    exportResult() {
        if (!this.generator.currentCombination || this.generator.currentCombination.every(p => p === null)) {
            this.generator.showMessage('Gira primero para generar un avatar');
            return;
        }

        try {
            const canvas = this.captureAvatarCanvas();
            
            if (!canvas) {
                this.generator.showMessage('Error al capturar el avatar');
                return;
            }

            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            link.download = `${this.config.combinaName}_${timestamp}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            this.generator.showMessage('Avatar guardado como imagen!');
        } catch (error) {
            console.error('Error exportando resultado:', error);
            this.generator.showMessage('Error al guardar la imagen');
        }
    }

    captureAvatarCanvas() {
        if (!this.generator.currentCombination || this.generator.currentCombination.every(p => p === null)) {
            return null;
        }
        
        const canvas = this.generator.assembleResult(this.generator.currentCombination);
        return canvas;
    }

    exportConfig() {
        if (!this.config) {
            this.generator.showMessage('No hay configuración para exportar');
            return;
        }

        const exportData = this.prepareExportConfig();
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `${this.config.combinaName}_config_${timestamp}.json`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        this.generator.showMessage('Configuración exportada!');
    }

    prepareExportConfig() {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            combinaName: this.config.combinaName,
            orientation: this.config.orientation,
            theme: this.config.theme,
            createdAt: this.config.createdAt,
            lastModified: this.config.lastModified,
            adjustments: this.config.adjustments || { parts: [] },
            parts: []
        };

        for (let i = 0; i < this.config.parts.length; i++) {
            const part = this.config.parts[i];
            const imagesData = [];
            
            for (const variant of (part.loadedVariants || [])) {
                let imageData = null;
                
                if (variant.originalImageData) {
                    imageData = variant.originalImageData;
                } else if (variant.originalImageElement && variant.originalImageElement.src) {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = variant.originalImageElement.width;
                        canvas.height = variant.originalImageElement.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(variant.originalImageElement, 0, 0);
                        imageData = canvas.toDataURL('image/png');
                    } catch (e) {
                        console.error('Error convirtiendo imagen:', e);
                    }
                }
                
                imagesData.push({
                    name: variant.name || `variante_${imagesData.length + 1}`,
                    dataURL: imageData,
                    width: variant.originalWidth,
                    height: variant.originalHeight
                });
            }
            
            exportData.parts.push({
                id: part.id,
                name: part.name,
                variants: imagesData
            });
        }
        
        return exportData;
    }

    async importConfig() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) {
                    reject('No se seleccionó archivo');
                    return;
                }
                
                try {
                    const text = await file.text();
                    const imported = JSON.parse(text);
                    await this.importConfigData(imported);
                    resolve(imported);
                } catch (error) {
                    console.error('Error importando:', error);
                    this.generator.showMessage('Error al importar configuración');
                    reject(error);
                }
            };
            
            input.click();
        });
    }

    async importConfigData(imported) {
        if (!imported.parts || !imported.combinaName) {
            throw new Error('Formato de configuración inválido');
        }
        
        this.generator.showMessage('Importando configuración...');
        
        const loadingMsg = new PIXI.Text('Cargando...', {
            fontFamily: 'Arial', fontSize: 20, fill: 0x333333, fontWeight: 'bold'
        });
        loadingMsg.x = this.app.screen.width / 2 - loadingMsg.width / 2;
        loadingMsg.y = this.app.screen.height / 2;
        this.app.stage.addChild(loadingMsg);
        
        const partsData = [];
        
        for (let i = 0; i < imported.parts.length; i++) {
            const partConfig = imported.parts[i];
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
        
        loadingMsg.destroy();
        
        if (partsData.length === 0) {
            throw new Error('No se pudieron cargar las imágenes');
        }
        
        this.config = {
            combinaName: imported.combinaName,
            orientation: imported.orientation || 'horizontal',
            parts: partsData,
            adjustments: imported.adjustments || { parts: [] },
            theme: imported.theme || 'dark',
            createdAt: imported.createdAt || new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        this.generator.config = this.config;
        this.generator.applyTheme(this.config.theme);
        this.generator.configManager.saveConfig(this.config);
        this.generator.initSlots();
        
        this.app.stage.removeChildren();
        if (this.generator.ui) {
            this.generator.ui.updateTheme(this.config.theme);
        } else {
            const { CombinaUI } = await import('./CombinaUI.js');
            this.generator.ui = new CombinaUI(this.generator);
            this.generator.ui.createUI();
        }
        
        this.generator.updateResultDisplay();
        this.generator.showMessage(`${this.config.combinaName} importado!`);
    }

    dataURLToImage(dataURL) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = dataURL;
        });
    }

    async exportCombinaPackage() {
        if (!this.config) {
            this.generator.showMessage('No hay Combina para exportar');
            return;
        }

        this.generator.showMessage('Generando paquete...');
        
        const zip = new JSZip();
        const combinaName = this.config.combinaName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        const imagesFolder = zip.folder('images');
        for (let i = 0; i < this.config.parts.length; i++) {
            const part = this.config.parts[i];
            const partFolder = imagesFolder.folder(`parte_${i}_${part.name.replace(/[^a-z0-9]/gi, '_')}`);
            
            for (let v = 0; v < (part.loadedVariants || []).length; v++) {
                const variant = part.loadedVariants[v];
                const imageBlob = await this.getImageBlob(variant);
                if (imageBlob) {
                    const ext = imageBlob.type === 'image/png' ? 'png' : 
                               imageBlob.type === 'image/jpeg' ? 'jpg' : 'png';
                    partFolder.file(`variante_${v + 1}.${ext}`, imageBlob);
                }
            }
        }
        
        const configData = this.prepareExportConfig();
        zip.file('config.json', JSON.stringify(configData, null, 2));
        
        const htmlContent = this.generateStandaloneHTML(configData);
        zip.file('index.html', htmlContent);
        
        const cssContent = this.generateStandaloneCSS();
        zip.file('style.css', cssContent);
        
        const jsContent = this.generateStandaloneJS(configData);
        zip.file('game.js', jsContent);
        
        const readme = this.generateReadme();
        zip.file('README.txt', readme);
        
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `${combinaName}_${timestamp}.zip`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        this.generator.showMessage('Paquete exportado!');
    }

    async getImageBlob(variant) {
        if (variant.originalFile instanceof File) {
            return variant.originalFile;
        }
        
        if (variant.originalImageData && variant.originalImageData.startsWith('data:')) {
            return this.dataURLToBlob(variant.originalImageData);
        }
        
        if (variant.originalImageElement && variant.originalImageElement.src) {
            try {
                const response = await fetch(variant.originalImageElement.src);
                if (response.ok) {
                    return await response.blob();
                }
            } catch (e) {
                console.error('Error fetching image:', e);
            }
        }
        
        return null;
    }

    dataURLToBlob(dataURL) {
        const parts = dataURL.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const binary = atob(parts[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: mime });
    }

    generateStandaloneHTML(configData) {
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>${this.config.combinaName} - CombinaCosas</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #020503;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Arial', sans-serif;
            padding: 10px;
            overflow-x: hidden;
        }
        #game-wrapper {
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
        }
        #game-container {
            background: transparent;
            border-radius: 20px;
            padding: 10px;
            overflow: hidden;
        }
        canvas { 
            display: block; 
            border-radius: 12px; 
            cursor: pointer;
        }
        .loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ffffff;
            font-family: Arial;
            font-size: 20px;
            text-align: center;
            z-index: 1000;
            background: rgba(0,0,0,0.7);
            padding: 20px;
            border-radius: 10px;
        }
        @media (max-width: 768px) {
            body { padding: 5px; }
            #game-container { padding: 5px; border-radius: 10px; }
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.2/pixi.min.js"></script>
</head>
<body>
    <div id="game-wrapper">
        <div id="game-container">
            <canvas id="game-canvas"></canvas>
        </div>
    </div>
    <div class="loading" id="loading">Cargando ${this.config.combinaName}...</div>
    <script>
        const CONFIG_DATA = ${JSON.stringify(configData, null, 2)};
        
        let app, slots = [], slotViews = [], currentCombination = [], isSpinning = false;
        let resultSprite = null, resultContainer = null, config = null;
        let isMobile = false;
        let animationInProgress = false;
        let loadingBar = null;
        let loadingBarTarget = 160;
        let winEffects = [];
        let sparkles = [];
        const AVATAR_WIDTH = 180, AVATAR_HEIGHT = 130;
        const SPIN_CONFIG = {
            spinTime: 2800,
            maxSpeed: 95,
            spacing: 80,
            spinDelay: [],
            decelerationCurve: 0.28,
            initialAcceleration: 0.22,
            winEffectDuration: 1400
        };
        
        function checkMobile() {
            return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
        
        async function loadImagesFromConfig() {
            config = {
                combinaName: CONFIG_DATA.combinaName,
                orientation: CONFIG_DATA.orientation,
                theme: CONFIG_DATA.theme,
                adjustments: CONFIG_DATA.adjustments || { parts: [] },
                parts: []
            };
            
            for (let i = 0; i < CONFIG_DATA.parts.length; i++) {
                const partConfig = CONFIG_DATA.parts[i];
                const loadedVariants = [];
                for (let v = 0; v < partConfig.variants.length; v++) {
                    const variantData = partConfig.variants[v];
                    if (variantData.dataURL) {
                        const img = await new Promise((resolve) => {
                            const image = new Image();
                            image.onload = () => resolve(image);
                            image.onerror = () => resolve(null);
                            image.src = variantData.dataURL;
                        });
                        if (img) {
                            loadedVariants.push({
                                id: v, name: variantData.name,
                                originalImageElement: img,
                                originalImageData: variantData.dataURL,
                                originalWidth: img.width, originalHeight: img.height
                            });
                        }
                    }
                }
                if (loadedVariants.length > 0) {
                    config.parts.push({ id: i, name: partConfig.name, loadedVariants });
                }
            }
            
            slots = config.parts.map((part, index) => ({
                index, type: part.name, parts: part.loadedVariants || [],
                spinning: false, position: 0, finalIndex: null, spinSpeed: 0,
                currentIndex: 0, targetPosition: 0, startPosition: 0
            }));
            
            slots.forEach((_, idx) => {
                SPIN_CONFIG.spinDelay[idx] = idx * 180;
            });
            
            currentCombination = slots.map(() => null);
        }
        
        function createGradientBackground(width, height) {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#0a2f1d');
            gradient.addColorStop(0.4, '#06170f');
            gradient.addColorStop(1, '#020503');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1, height);
            return PIXI.Texture.from(canvas);
        }
        
        function createUI() {
            const width = app.screen.width;
            const height = app.screen.height;
            
            app.stage.removeChildren();
            winEffects = [];
            sparkles = [];
            loadingBar = null;
            
            const bgTexture = createGradientBackground(width, height);
            const bgSprite = new PIXI.Sprite(bgTexture);
            bgSprite.width = width;
            bgSprite.height = height;
            app.stage.addChild(bgSprite);
            
            const tableLine = new PIXI.Graphics();
            tableLine.lineStyle(1, 0xffffff, 0.03);
            tableLine.moveTo(0, height * 0.15);
            tableLine.lineTo(width, height * 0.15);
            tableLine.moveTo(0, height * 0.85);
            tableLine.lineTo(width, height * 0.85);
            app.stage.addChild(tableLine);
            
            if (isMobile) {
                createUIMobile(width, height);
            } else {
                createUIDesktop(width, height);
            }
        }
        
        function createUIMobile(width, height) {
            const slotCount = config.parts.length;
            
            // Calcular tamanos: slots con proporcion 1:2 como en escritorio
            const maxTotalWidth = Math.min(width - 16, 390);
            const slotSpacing = 4;
            const paddingH = 10;
            const paddingV = 8;
            
            const availableWidth = maxTotalWidth - paddingH * 2 - (slotCount - 1) * slotSpacing;
            const slotWidth = Math.floor(availableWidth / slotCount);
            const slotHeight = slotWidth * 2;
            
            const totalSlotsWidth = slotCount * slotWidth + (slotCount - 1) * slotSpacing;
            const cylinderWidth = totalSlotsWidth + paddingH * 2;
            const cylinderHeight = slotHeight + paddingV * 2;
            
            // Titulo - posicion Y: 4, altura: 30, termina en Y: 34
            const titleY = 4;
            const titleHeight = 30;
            
            const titleBg = new PIXI.Graphics();
            titleBg.beginFill(0x000000, 0.4);
            titleBg.drawRoundedRect(width / 2 - 140, titleY, 280, titleHeight, 8);
            titleBg.endFill();
            titleBg.lineStyle(1, 0xffffff, 0.1);
            titleBg.drawRoundedRect(width / 2 - 140, titleY, 280, titleHeight, 8);
            app.stage.addChild(titleBg);
            
            const title = new PIXI.Text(' ' + config.combinaName + ' ', {
                fontFamily: 'Arial', fontSize: 14, fill: 0xffd93d, fontWeight: 'bold',
                dropShadow: true, dropShadowColor: '#000000',
                dropShadowBlur: 4, dropShadowDistance: 2
            });
            title.x = width / 2 - title.width / 2;
            title.y = titleY + 6;
            app.stage.addChild(title);
            
            // Avatar - separado 12px del titulo (doble de ~6px)
            const resultWidth = 100;
            const resultHeight = 85;
            const avatarY = titleY + titleHeight + 12;
            
            resultContainer = new PIXI.Container();
            resultContainer.x = 8;
            resultContainer.y = avatarY;
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0x1e252b);
            bg.drawRoundedRect(0, 0, resultWidth, resultHeight, 6);
            bg.endFill();
            bg.lineStyle(1.5, 0x4f5d65, 1);
            bg.drawRoundedRect(0, 0, resultWidth, resultHeight, 6);
            resultContainer.addChild(bg);
            
            const resultTitle = new PIXI.Text('RESULTADO', {
                fontFamily: 'Arial', fontSize: 7, fill: 0xdfe6e9, fontWeight: 'bold'
            });
            resultTitle.x = (resultWidth / 2) - (resultTitle.width / 2);
            resultTitle.y = 3;
            resultContainer.addChild(resultTitle);
            
            const resultBg = new PIXI.Graphics();
            resultBg.beginFill(0xffffff);
            resultBg.drawRoundedRect(4, 13, resultWidth - 8, resultHeight - 18, 3);
            resultBg.endFill();
            resultContainer.addChild(resultBg);
            
            app.stage.addChild(resultContainer);
            
            // Chasis unificado de slots - separado 16px del avatar (doble de 8px)
            const startX = (width - cylinderWidth) / 2;
            const startY = avatarY + resultHeight + 16;
            
            const cylinderContainer = new PIXI.Container();
            cylinderContainer.x = startX;
            cylinderContainer.y = startY;
            
            const chassisBg = new PIXI.Graphics();
            chassisBg.beginFill(0x353b48);
            chassisBg.drawRoundedRect(0, 0, cylinderWidth, cylinderHeight, 8);
            chassisBg.endFill();
            chassisBg.lineStyle(2, 0x718093, 1);
            chassisBg.drawRoundedRect(1, 1, cylinderWidth - 2, cylinderHeight - 2, 7);
            chassisBg.lineStyle(1, 0x2f3640, 1);
            chassisBg.drawRoundedRect(2, 2, cylinderWidth - 4, cylinderHeight - 4, 6);
            cylinderContainer.addChild(chassisBg);
            
            const windowInner = new PIXI.Graphics();
            windowInner.beginFill(0xffffff);
            windowInner.drawRect(paddingH, paddingV, totalSlotsWidth, slotHeight);
            windowInner.endFill();
            cylinderContainer.addChild(windowInner);
            
            const dividers = new PIXI.Graphics();
            for (let i = 1; i < slotCount; i++) {
                const divX = paddingH + i * slotWidth + (i - 1) * slotSpacing + (slotSpacing / 2);
                dividers.beginFill(0x2f3640);
                dividers.drawRect(divX - 1.5, paddingV, 3, slotHeight);
                dividers.endFill();
                dividers.lineStyle(0.5, 0x718093, 0.7);
                dividers.moveTo(divX + 1.5, paddingV);
                dividers.lineTo(divX + 1.5, paddingV + slotHeight);
            }
            cylinderContainer.addChild(dividers);
            
            app.stage.addChild(cylinderContainer);
            
            slotViews = [];
            
            const mobileSpacing = Math.floor(slotHeight * 0.20);
            SPIN_CONFIG.spacing = mobileSpacing;
            
            for (let i = 0; i < slotCount; i++) {
                const x = paddingH + i * (slotWidth + slotSpacing);
                const y = paddingV;
                
                const container = new PIXI.Container();
                container.x = x;
                container.y = y;
                
                const sprites = [];
                const cachedTextures = [];
                
                const slotBgLocal = new PIXI.Graphics();
                slotBgLocal.beginFill(0xffffff);
                slotBgLocal.drawRect(0, 0, slotWidth, slotHeight);
                slotBgLocal.endFill();
                container.addChild(slotBgLocal);
                
                const overlay3D = new PIXI.Graphics();
                const steps = 20;
                for (let s = 0; s < steps; s++) {
                    const pct = s / steps;
                    const shadowAlpha = Math.pow(1 - pct, 2.3) * 0.85;
                    const segmentHeight = (slotHeight * 0.25) / steps;
                    overlay3D.beginFill(0x000000, shadowAlpha);
                    overlay3D.drawRect(-1, s * segmentHeight, slotWidth + 2, segmentHeight);
                    overlay3D.drawRect(-1, slotHeight - (s * segmentHeight) - segmentHeight, slotWidth + 2, segmentHeight);
                    overlay3D.endFill();
                }
                overlay3D.beginFill(0x000000, 0.02);
                overlay3D.drawRect(-1, slotHeight * 0.25, slotWidth + 2, slotHeight * 0.08);
                overlay3D.drawRect(-1, slotHeight * 0.67, slotWidth + 2, slotHeight * 0.08);
                overlay3D.endFill();
                overlay3D.beginFill(0xffffff, 0.07);
                overlay3D.drawRect(-1, slotHeight * 0.45, slotWidth + 2, 3);
                overlay3D.endFill();
                overlay3D.lineStyle(0.5, 0x000000, 0.03);
                overlay3D.moveTo(-1, slotHeight / 2);
                overlay3D.lineTo(slotWidth + 1, slotHeight / 2);
                container.addChild(overlay3D);
                
                const selectorY = slotHeight / 2;
                
                const updateParts = (parts, position, spinState) => {
                    sprites.forEach(s => s.destroy());
                    sprites.length = 0;
                    if (!parts || parts.length === 0) return;
                    
                    const spacing = mobileSpacing;
                    const centerIndex = Math.floor(position / spacing) % parts.length;
                    const radius = slotHeight * 0.52;
                    const offsetRange = [-3, -2, -1, 0, 1, 2, 3];
                    
                    for (let offset of offsetRange) {
                        const partIdx = (centerIndex + offset + parts.length) % parts.length;
                        const part = parts[partIdx];
                        if (!part) continue;
                        
                        let texture = cachedTextures[partIdx];
                        if (!texture && part.originalImageElement) {
                            texture = PIXI.Texture.from(part.originalImageElement);
                            cachedTextures[partIdx] = texture;
                        }
                        
                        if (texture) {
                            const yOffset = (position % spacing) - (offset * spacing);
                            const angle = (yOffset / radius);
                            
                            if (Math.abs(angle) > Math.PI / 2.2) continue;
                            
                            const spriteY = selectorY + Math.sin(angle) * radius;
                            const zScale = Math.cos(angle);
                            
                            const maxSlotSize = slotWidth * 0.62;
                            const baseScale = Math.min(
                                maxSlotSize / texture.width,
                                maxSlotSize / texture.height,
                                0.72
                            );
                            
                            let scaleY = baseScale * zScale;
                            let scaleX = baseScale * (1 - Math.abs(angle) * 0.08);
                            let alpha = Math.pow(zScale, 1.5);
                            
                            if (offset === 0 && Math.abs(yOffset) < spacing * 0.15) {
                                alpha = 1.0;
                                scaleX = baseScale;
                                scaleY = baseScale;
                            }
                            
                            const sprite = new PIXI.Sprite(texture);
                            sprite.x = slotWidth / 2;
                            sprite.y = spriteY;
                            sprite.scale.set(scaleX, scaleY);
                            sprite.anchor.set(0.5);
                            sprite.alpha = Math.max(0, Math.min(1, alpha));
                            
                            container.addChild(sprite);
                            sprites.push(sprite);
                        }
                    }
                };
                
                cylinderContainer.addChild(container);
                slotViews.push({ container, updateParts, width: slotWidth, height: slotHeight });
                const slot = slots[i];
                if (slot && slot.parts) updateParts(slot.parts, 0, { spinning: false, spinSpeed: 0, finalIndex: null });
            }
            
            // Botones - separados 20px de los slots (doble de 10px)
            const btnSectionY = startY + cylinderHeight + 20;
            
            const btnWidth = 105;
            const btnHeight = 34;
            const totalBtnsWidth = btnWidth * 2 + 10;
            const btnsStartX = (width - totalBtnsWidth) / 2;
            
            const spinBtn = new PIXI.Container();
            spinBtn.x = btnsStartX;
            spinBtn.y = btnSectionY;
            spinBtn.eventMode = 'static';
            spinBtn.cursor = 'pointer';
            
            const spinBg = new PIXI.Graphics();
            spinBg.beginFill(0xffd93d);
            spinBg.drawRoundedRect(0, 0, btnWidth, btnHeight, 8);
            spinBg.endFill();
            spinBtn.addChild(spinBg);
            
            const spinText = new PIXI.Text('GIRAR', {
                fontFamily: 'Arial', fontSize: 13, fill: 0x1a1a2e, fontWeight: 'bold'
            });
            spinText.x = (btnWidth / 2) - (spinText.width / 2);
            spinText.y = (btnHeight / 2) - (spinText.height / 2);
            spinBtn.addChild(spinText);
            
            spinBtn.on('pointerdown', spin);
            spinBtn.on('pointerover', () => { spinBg.tint = 0xffed4a; });
            spinBtn.on('pointerout', () => { spinBg.tint = 0xffffff; });
            app.stage.addChild(spinBtn);
            
            const saveBtn = new PIXI.Container();
            saveBtn.x = btnsStartX + btnWidth + 10;
            saveBtn.y = btnSectionY;
            saveBtn.eventMode = 'static';
            saveBtn.cursor = 'pointer';
            
            const saveBg = new PIXI.Graphics();
            saveBg.beginFill(0x2ed573);
            saveBg.drawRoundedRect(0, 0, btnWidth, btnHeight, 8);
            saveBg.endFill();
            saveBtn.addChild(saveBg);
            
            const saveText = new PIXI.Text('GUARDAR', {
                fontFamily: 'Arial', fontSize: 12, fill: 0xffffff, fontWeight: 'bold'
            });
            saveText.x = (btnWidth / 2) - (saveText.width / 2);
            saveText.y = (btnHeight / 2) - (saveText.height / 2);
            saveBtn.addChild(saveText);
            
            saveBtn.on('pointerdown', exportResult);
            saveBtn.on('pointerover', () => { saveBg.tint = 0x66cc66; });
            saveBtn.on('pointerout', () => { saveBg.tint = 0xffffff; });
            app.stage.addChild(saveBtn);
            
            updateResultDisplay();
        }
        
        function createUIDesktop(width, height) {
            const titleBg = new PIXI.Graphics();
            titleBg.beginFill(0x000000, 0.4);
            titleBg.drawRoundedRect(width / 2 - 180, 8, 360, 45, 8);
            titleBg.endFill();
            titleBg.lineStyle(1, 0xffffff, 0.1);
            titleBg.drawRoundedRect(width / 2 - 180, 8, 360, 45, 8);
            app.stage.addChild(titleBg);
            
            const title = new PIXI.Text(' ' + config.combinaName + ' ', {
                fontFamily: 'Arial', fontSize: 26, fill: 0xffd93d, fontWeight: 'bold',
                dropShadow: true, dropShadowColor: '#000000',
                dropShadowBlur: 6, dropShadowDistance: 3,
                dropShadowAngle: Math.PI / 6
            });
            title.x = width / 2 - title.width / 2;
            title.y = 16;
            app.stage.addChild(title);
            
            const resultWidth = 220;
            const resultHeight = 200;
            
            resultContainer = new PIXI.Container();
            resultContainer.x = 20;
            resultContainer.y = 60;
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0x1e252b);
            bg.drawRoundedRect(0, 0, resultWidth, resultHeight, 8);
            bg.endFill();
            bg.lineStyle(2, 0x4f5d65, 1);
            bg.drawRoundedRect(0, 0, resultWidth, resultHeight, 8);
            resultContainer.addChild(bg);
            
            const resultTitle = new PIXI.Text('RESULTADO', {
                fontFamily: 'Arial', fontSize: 11, fill: 0xdfe6e9, fontWeight: 'bold'
            });
            resultTitle.x = resultWidth / 2 - resultTitle.width / 2;
            resultTitle.y = 8;
            resultContainer.addChild(resultTitle);
            
            const resultBg = new PIXI.Graphics();
            resultBg.beginFill(0xffffff);
            resultBg.drawRoundedRect(8, 28, resultWidth - 16, resultHeight - 38, 4);
            resultBg.endFill();
            resultContainer.addChild(resultBg);
            
            app.stage.addChild(resultContainer);
            
            const slotCount = config.parts.length;
            const slotWidth = 200;
            const slotHeight = 400;
            const slotSpacing = 6;
            const paddingH = 20;
            const paddingV = 12;
            const totalSlotsWidth = slotCount * slotWidth + (slotCount - 1) * slotSpacing;
            const cylinderWidth = totalSlotsWidth + paddingH * 2;
            const cylinderHeight = slotHeight + paddingV * 2;
            const startX = (width - cylinderWidth) / 2;
            const startY = 300 - paddingV;
            
            SPIN_CONFIG.spacing = 80;
            
            const cylinderContainer = new PIXI.Container();
            cylinderContainer.x = startX;
            cylinderContainer.y = startY;
            
            const chassisBg = new PIXI.Graphics();
            chassisBg.beginFill(0x353b48);
            chassisBg.drawRoundedRect(0, 0, cylinderWidth, cylinderHeight, 12);
            chassisBg.endFill();
            chassisBg.lineStyle(3, 0x718093, 1);
            chassisBg.drawRoundedRect(1, 1, cylinderWidth - 2, cylinderHeight - 2, 11);
            chassisBg.lineStyle(1, 0x2f3640, 1);
            chassisBg.drawRoundedRect(3, 3, cylinderWidth - 6, cylinderHeight - 6, 9);
            cylinderContainer.addChild(chassisBg);
            
            const windowInner = new PIXI.Graphics();
            windowInner.beginFill(0xffffff);
            windowInner.drawRect(paddingH, paddingV, totalSlotsWidth, slotHeight);
            windowInner.endFill();
            cylinderContainer.addChild(windowInner);
            
            const dividers = new PIXI.Graphics();
            for (let i = 1; i < slotCount; i++) {
                const divX = paddingH + i * slotWidth + (i - 1) * slotSpacing + (slotSpacing / 2);
                dividers.beginFill(0x2f3640);
                dividers.drawRect(divX - 2, paddingV, 4, slotHeight);
                dividers.endFill();
                dividers.lineStyle(1, 0x718093, 0.7);
                dividers.moveTo(divX + 2, paddingV);
                dividers.lineTo(divX + 2, paddingV + slotHeight);
            }
            cylinderContainer.addChild(dividers);
            
            app.stage.addChild(cylinderContainer);
            
            slotViews = [];
            
            for (let i = 0; i < slotCount; i++) {
                const x = paddingH + i * (slotWidth + slotSpacing);
                const y = paddingV;
                
                const container = new PIXI.Container();
                container.x = x;
                container.y = y;
                
                const sprites = [];
                const cachedTextures = [];
                
                const slotBgLocal = new PIXI.Graphics();
                slotBgLocal.beginFill(0xffffff);
                slotBgLocal.drawRect(0, 0, slotWidth, slotHeight);
                slotBgLocal.endFill();
                container.addChild(slotBgLocal);
                
                const overlay3D = new PIXI.Graphics();
                const steps = 24;
                for (let s = 0; s < steps; s++) {
                    const pct = s / steps;
                    const shadowAlpha = Math.pow(1 - pct, 2.3) * 0.88;
                    const segmentHeight = (slotHeight * 0.25) / steps;
                    overlay3D.beginFill(0x000000, shadowAlpha);
                    overlay3D.drawRect(-1, s * segmentHeight, slotWidth + 2, segmentHeight);
                    overlay3D.drawRect(-1, slotHeight - (s * segmentHeight) - segmentHeight, slotWidth + 2, segmentHeight);
                    overlay3D.endFill();
                }
                overlay3D.beginFill(0x000000, 0.02);
                overlay3D.drawRect(-1, slotHeight * 0.25, slotWidth + 2, slotHeight * 0.08);
                overlay3D.drawRect(-1, slotHeight * 0.67, slotWidth + 2, slotHeight * 0.08);
                overlay3D.endFill();
                overlay3D.beginFill(0xffffff, 0.08);
                overlay3D.drawRect(-1, slotHeight * 0.45, slotWidth + 2, 4);
                overlay3D.endFill();
                overlay3D.lineStyle(1, 0x000000, 0.03);
                overlay3D.moveTo(-1, slotHeight / 2);
                overlay3D.lineTo(slotWidth + 1, slotHeight / 2);
                container.addChild(overlay3D);
                
                const selectorY = slotHeight / 2;
                
                const updateParts = (parts, position, spinState) => {
                    sprites.forEach(s => s.destroy());
                    sprites.length = 0;
                    if (!parts || parts.length === 0) return;
                    
                    const spacing = SPIN_CONFIG.spacing;
                    const centerIndex = Math.floor(position / spacing) % parts.length;
                    const radius = slotHeight * 0.52;
                    const offsetRange = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
                    
                    for (let offset of offsetRange) {
                        const partIdx = (centerIndex + offset + parts.length) % parts.length;
                        const part = parts[partIdx];
                        if (!part) continue;
                        
                        let texture = cachedTextures[partIdx];
                        if (!texture && part.originalImageElement) {
                            texture = PIXI.Texture.from(part.originalImageElement);
                            cachedTextures[partIdx] = texture;
                        }
                        
                        if (texture) {
                            const yOffset = (position % spacing) - (offset * spacing);
                            const angle = (yOffset / radius);
                            if (Math.abs(angle) > Math.PI / 2) continue;
                            
                            const spriteY = selectorY + Math.sin(angle) * radius;
                            const zScale = Math.cos(angle);
                            
                            const maxSlotSize = 195;
                            const baseScale = Math.min(
                                maxSlotSize / texture.width,
                                maxSlotSize / texture.height,
                                1.25
                            );
                            
                            let scaleY = baseScale * zScale;
                            let scaleX = baseScale * (1 - Math.abs(angle) * 0.08);
                            let alpha = Math.pow(zScale, 1.5);
                            
                            if (offset === 0 && Math.abs(yOffset) < 15) {
                                alpha = 1.0;
                                scaleX = baseScale;
                                scaleY = baseScale;
                            }
                            
                            const sprite = new PIXI.Sprite(texture);
                            sprite.x = slotWidth / 2;
                            sprite.y = spriteY;
                            sprite.scale.set(scaleX, scaleY);
                            sprite.anchor.set(0.5);
                            sprite.alpha = Math.max(0, Math.min(1, alpha));
                            
                            container.addChild(sprite);
                            sprites.push(sprite);
                        }
                    }
                };
                
                cylinderContainer.addChild(container);
                slotViews.push({ container, updateParts, width: slotWidth, height: slotHeight });
                const slot = slots[i];
                if (slot && slot.parts) updateParts(slot.parts, 0, { spinning: false, spinSpeed: 0, finalIndex: null });
            }
            
            // Palanca premium
            const leverX = width - 85;
            const leverY = height / 2 + 15;
            const leverScale = 1.4;
            
            const leverContainer = new PIXI.Container();
            leverContainer.x = leverX;
            leverContainer.y = leverY;
            leverContainer.scale.set(leverScale);
            
            const baseG = new PIXI.Graphics();
            baseG.beginFill(0x000000, 0.45);
            baseG.drawRect(-22, -20, 48, 50);
            baseG.endFill();
            baseG.beginFill(0x4e545c);
            baseG.drawRoundedRect(-18, -16, 40, 44, 6);
            baseG.endFill();
            baseG.lineStyle(2, 0x95a5a6, 0.85);
            baseG.drawRoundedRect(-15, -13, 34, 38, 4);
            baseG.lineStyle(0);
            baseG.beginFill(0x1a1a1a);
            baseG.drawCircle(2, 6, 14);
            baseG.endFill();
            leverContainer.addChild(baseG);
            
            const movingPart = new PIXI.Container();
            movingPart.x = 2;
            movingPart.y = 6;
            leverContainer.addChild(movingPart);
            
            const shaft = new PIXI.Graphics();
            shaft.beginFill(0x000000, 0.3);
            shaft.drawRect(-7, -75, 12, 75);
            shaft.endFill();
            shaft.beginFill(0xbdc3c7);
            shaft.drawRect(-6, -75, 12, 75);
            shaft.endFill();
            shaft.beginFill(0xffffff, 0.75);
            shaft.drawRect(-2, -75, 3, 75);
            shaft.endFill();
            shaft.beginFill(0x7f8c8d, 0.4);
            shaft.drawRect(-6, -75, 2, 75);
            shaft.drawRect(4, -75, 2, 75);
            shaft.endFill();
            movingPart.addChild(shaft);
            
            const knob = new PIXI.Graphics();
            knob.beginFill(0x000000, 0.35);
            knob.drawCircle(0, -75, 21);
            knob.endFill();
            knob.beginFill(0xc0392b);
            knob.drawCircle(0, -75, 20);
            knob.endFill();
            knob.beginFill(0xff7675, 0.85);
            knob.drawCircle(-6, -81, 8);
            knob.endFill();
            knob.beginFill(0xffffff, 0.95);
            knob.drawCircle(-8, -84, 3.5);
            knob.endFill();
            movingPart.addChild(knob);
            
            leverContainer.eventMode = 'static';
            leverContainer.cursor = 'pointer';
            
            let isPulling = false;
            let pullProgress = 0;
            
            function updateLeverTransform() {
                const maxScaleY = -0.3;
                const currentScaleY = 1.0 - (pullProgress * (1.0 - maxScaleY));
                movingPart.scale.y = currentScaleY;
                knob.y = pullProgress * 110;
                shaft.alpha = 1.0 - (pullProgress * 0.25);
            }
            
            leverContainer.on('pointerdown', () => {
                if (isPulling) return;
                isPulling = true;
                spin();
                
                const startTime = Date.now();
                const durationDown = 250;
                const durationUp = 350;
                
                const tick = () => {
                    const now = Date.now();
                    const elapsed = now - startTime;
                    
                    if (elapsed < durationDown) {
                        const t = elapsed / durationDown;
                        pullProgress = Math.sin(t * Math.PI / 2);
                        updateLeverTransform();
                        requestAnimationFrame(tick);
                    } else if (elapsed < durationDown + durationUp) {
                        const t = (elapsed - durationDown) / durationUp;
                        const bounce = Math.exp(-t * 5) * Math.cos(t * Math.PI * 2.5);
                        pullProgress = Math.max(0, bounce);
                        updateLeverTransform();
                        requestAnimationFrame(tick);
                    } else {
                        isPulling = false;
                        pullProgress = 0;
                        updateLeverTransform();
                    }
                };
                requestAnimationFrame(tick);
            });
            
            app.stage.addChild(leverContainer);
            
            const buttonY = height - 55;
            
            const saveBtnW = 120;
            const saveBtnH = 38;
            const saveButton = new PIXI.Container();
            saveButton.x = width - 140;
            saveButton.y = buttonY;
            saveButton.eventMode = 'static';
            saveButton.cursor = 'pointer';
            
            const saveBtnBg = new PIXI.Graphics();
            saveBtnBg.beginFill(0x2ed573);
            saveBtnBg.drawRoundedRect(0, 0, saveBtnW, saveBtnH, 6);
            saveBtnBg.endFill();
            saveButton.addChild(saveBtnBg);
            
            const saveBtnLabel = new PIXI.Text('GUARDAR', {
                fontFamily: 'Arial', fontSize: 12, fill: 0xffffff, fontWeight: 'bold'
            });
            saveBtnLabel.x = saveBtnW / 2 - saveBtnLabel.width / 2;
            saveBtnLabel.y = saveBtnH / 2 - saveBtnLabel.height / 2;
            saveButton.addChild(saveBtnLabel);
            saveButton.on('pointerdown', exportResult);
            app.stage.addChild(saveButton);
            
            updateResultDisplay();
        }
        
        // ========== SISTEMA DE GIRO ==========
        
        function showSpinningMessage() {
            if (resultSprite) {
                resultSprite.destroy();
                resultSprite = null;
            }
            
            if (resultContainer && resultContainer.children) {
                for (let i = resultContainer.children.length - 1; i >= 3; i--) {
                    const child = resultContainer.children[i];
                    if (child !== resultContainer.children[0] && 
                        child !== resultContainer.children[1] && 
                        child !== resultContainer.children[2]) {
                        child.destroy();
                    }
                }
            }
            
            const container = new PIXI.Container();
            const fontSize = isMobile ? 9 : 16;
            const spinningMsg = new PIXI.Text('GIRANDO...', {
                fontFamily: 'Arial', fontSize: fontSize, fill: 0xffd93d, fontWeight: 'bold'
            });
            spinningMsg.x = (resultContainer.width - spinningMsg.width) / 2;
            spinningMsg.y = (resultContainer.height - spinningMsg.height) / 2 - (isMobile ? 6 : 10);
            container.addChild(spinningMsg);
            
            const barWidth = isMobile ? (resultContainer.width - 16) : 160;
            const barY = isMobile ? (resultContainer.height / 2 + 4) : 55;
            const barBg = new PIXI.Graphics();
            barBg.beginFill(0x22222b);
            barBg.drawRoundedRect((resultContainer.width - barWidth) / 2, barY, barWidth, 4, 2);
            barBg.endFill();
            container.addChild(barBg);
            
            const bar = new PIXI.Graphics();
            bar.beginFill(0xffd93d);
            bar.drawRoundedRect((resultContainer.width - barWidth) / 2, barY, 0, 4, 2);
            bar.endFill();
            container.addChild(bar);
            
            loadingBar = bar;
            loadingBarTarget = barWidth;
            resultContainer.addChild(container);
            resultSprite = container;
        }
        
        function createSparkles() {
            sparkles.forEach(s => { if (s.sprite.parent) s.sprite.parent.removeChild(s.sprite); s.sprite.destroy(); });
            sparkles = [];
            for (let i = 0; i < 10; i++) {
                const sparkle = new PIXI.Graphics();
                sparkle.beginFill(0xffd93d, 0.5);
                sparkle.drawCircle(0, 0, 2);
                sparkle.endFill();
                sparkle.x = Math.random() * app.screen.width;
                sparkle.y = Math.random() * app.screen.height;
                sparkle.alpha = 0;
                app.stage.addChild(sparkle);
                sparkles.push({ sprite: sparkle, life: 0, maxLife: 60 + Math.random() * 60 });
            }
        }
        
        function updateSparkles() {
            sparkles.forEach(s => {
                s.life++;
                const progress = s.life / s.maxLife;
                if (progress < 1) {
                    s.sprite.alpha = Math.sin(progress * Math.PI) * 0.5;
                } else {
                    s.life = 0;
                    s.sprite.x = Math.random() * app.screen.width;
                    s.sprite.y = Math.random() * app.screen.height;
                }
            });
        }
        
        function createWinEffects() {
            winEffects.forEach(e => { if (e.sprite.parent) e.sprite.parent.removeChild(e.sprite); e.sprite.destroy(); });
            winEffects = [];
            const colors = [0xffd93d, 0xff6b6b, 0x4ecdc4, 0x00e676];
            for (let i = 0; i < 40; i++) {
                const particle = new PIXI.Graphics();
                particle.beginFill(colors[i % colors.length]);
                particle.drawRect(-3, -3, 6, 4);
                particle.endFill();
                particle.alpha = 0;
                particle.x = app.screen.width / 2;
                particle.y = app.screen.height / 2 - 80;
                app.stage.addChild(particle);
                winEffects.push({
                    sprite: particle, vx: (Math.random() - 0.5) * 10,
                    vy: -Math.random() * 12 - 4, life: 0, maxLife: 90, gravity: 0.16
                });
            }
        }
        
        function showWinEffects() {
            winEffects.forEach(e => { e.life = e.maxLife; e.sprite.alpha = 0.9; });
            animateWinEffects();
        }
        
        function animateWinEffects() {
            const animate = () => {
                let alive = false;
                winEffects.forEach(e => {
                    if (e.life > 0) {
                        alive = true;
                        e.life--;
                        e.sprite.x += e.vx;
                        e.sprite.y += e.vy;
                        e.vy += e.gravity;
                        e.sprite.alpha = e.life / e.maxLife;
                    } else {
                        e.sprite.alpha = 0;
                    }
                });
                if (alive) requestAnimationFrame(animate);
            };
            animate();
        }
        
        function triggerWinCelebration() {
            const flash = new PIXI.Graphics();
            flash.beginFill(0xffd93d, 0.12);
            flash.drawRect(0, 0, app.screen.width, app.screen.height);
            flash.endFill();
            app.stage.addChild(flash);
            
            let alpha = 0.12;
            const fadeOut = () => {
                alpha -= 0.015;
                flash.alpha = alpha;
                if (alpha > 0) {
                    requestAnimationFrame(fadeOut);
                } else {
                    if (flash.parent) flash.parent.removeChild(flash);
                    flash.destroy();
                }
            };
            setTimeout(fadeOut, 80);
        }
        
        function createStopGlow(index) {
            const slotView = slotViews[index];
            if (!slotView) return;
            
            const glow = new PIXI.Graphics();
            glow.beginFill(0xffd93d, 0.25);
            glow.drawRect(0, 0, slotView.width, slotView.height);
            glow.endFill();
            slotView.container.addChild(glow);
            
            let alpha = 0.25;
            const fade = () => {
                alpha -= 0.02;
                glow.alpha = alpha;
                if (alpha > 0) {
                    requestAnimationFrame(fade);
                } else {
                    if (glow.parent) glow.parent.removeChild(glow);
                    glow.destroy();
                }
            };
            fade();
        }
        
        function createSparkleBurst(index) {
            const slotView = slotViews[index];
            if (!slotView) return;
            const cx = slotView.width / 2;
            const cy = slotView.height / 2;
            
            const sparkSize = isMobile ? 1.5 : 2;
            const sparkSpeed = isMobile ? 2 : 3;
            
            for (let i = 0; i < 6; i++) {
                const spark = new PIXI.Graphics();
                spark.beginFill(0xffd93d, 0.8);
                spark.drawCircle(0, 0, sparkSize);
                spark.endFill();
                spark.x = cx;
                spark.y = cy;
                slotView.container.addChild(spark);
                
                const angle = (i / 6) * Math.PI * 2;
                let life = 20;
                const anim = () => {
                    life--;
                    spark.x += Math.cos(angle) * sparkSpeed;
                    spark.y += Math.sin(angle) * sparkSpeed;
                    spark.alpha = life / 20;
                    if (life > 0) {
                        requestAnimationFrame(anim);
                    } else {
                        if (spark.parent) spark.parent.removeChild(spark);
                        spark.destroy();
                    }
                };
                anim();
            }
        }
        
        async function spin() {
            if (isSpinning) return;
            
            isSpinning = true;
            
            showSpinningMessage();
            createWinEffects();
            createSparkles();
            
            slots.forEach((slot, index) => {
                if (slot.parts.length === 0) return;
                
                slot.spinning = true;
                slot.finalIndex = Math.floor(Math.random() * slot.parts.length);
                slot.spinSpeed = SPIN_CONFIG.maxSpeed;
                slot.targetPosition = slot.finalIndex * SPIN_CONFIG.spacing;
                slot.startPosition = slot.position || 0;
            });
            
            await animateSpin();
            
            isSpinning = false;
            updateCurrentCombination();
            updateResultDisplay();
            showWinEffects();
            triggerWinCelebration();
        }
        
        function animateSpin() {
            const startTime = Date.now();
            const baseDuration = SPIN_CONFIG.spinTime;
            
            return new Promise((resolve) => {
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    let allFinished = true;
                    
                    slots.forEach((slot, index) => {
                        const slotDelay = SPIN_CONFIG.spinDelay[index] || 0;
                        const totalSlotDuration = baseDuration;
                        
                        if (!slot.spinning) return;
                        
                        allFinished = false;
                        const slotElapsed = Math.max(0, elapsed - slotDelay);
                        const slotProgress = Math.min(1, slotElapsed / totalSlotDuration);
                        
                        if (slotProgress <= 0) {
                            slot.spinSpeed = 0;
                        } else if (slotProgress < 0.15) {
                            const t = slotProgress / 0.15;
                            slot.spinSpeed = SPIN_CONFIG.maxSpeed * (t * t);
                        } else if (slotProgress < 0.65) {
                            slot.spinSpeed = SPIN_CONFIG.maxSpeed;
                        } else {
                            const t = (slotProgress - 0.65) / 0.35;
                            const easeOut = 1 - Math.pow(1 - t, 3);
                            slot.spinSpeed = SPIN_CONFIG.maxSpeed * (1 - easeOut);
                        }
                        
                        const maxPosition = slot.parts.length * SPIN_CONFIG.spacing;
                        slot.position += Math.max(0.5, slot.spinSpeed);
                        slot.position %= maxPosition;
                        
                        if (slotProgress > 0.88) {
                            const remaining = (slot.targetPosition - slot.position + maxPosition) % maxPosition;
                            if (remaining < slot.spinSpeed * 1.5 || slotElapsed >= totalSlotDuration) {
                                slot.spinning = false;
                                slot.position = slot.targetPosition;
                                slot.spinSpeed = 0;
                                createStopGlow(index);
                                createSparkleBurst(index);
                            }
                        }
                        
                        if (slotViews[index]) {
                            const intensity = slot.spinning ? Math.min(1, slot.spinSpeed / SPIN_CONFIG.maxSpeed) : 0;
                            slotViews[index].updateParts(
                                slot.parts,
                                slot.position,
                                { spinning: slot.spinning, spinSpeed: slot.spinSpeed, finalIndex: slot.finalIndex, glowIntensity: intensity }
                            );
                        }
                    });
                    
                    if (loadingBar && elapsed < baseDuration) {
                        const progress = Math.min(1, elapsed / baseDuration);
                        loadingBar.clear();
                        loadingBar.beginFill(0xffd93d);
                        const barX = (resultContainer.width - loadingBarTarget) / 2;
                        const barY = isMobile ? (resultContainer.height / 2 + 4) : 55;
                        loadingBar.drawRoundedRect(barX, barY, progress * loadingBarTarget, 4, 2);
                        loadingBar.endFill();
                    }
                    
                    updateSparkles();
                    
                    if (allFinished) {
                        slots.forEach((slot, index) => {
                            if (slotViews[index]) {
                                slotViews[index].updateParts(
                                    slot.parts,
                                    slot.finalIndex * SPIN_CONFIG.spacing,
                                    { spinning: false, spinSpeed: 0, finalIndex: slot.finalIndex, glowIntensity: 0 }
                                );
                            }
                        });
                        resolve();
                    } else {
                        requestAnimationFrame(animate);
                    }
                };
                requestAnimationFrame(animate);
            });
        }
        
        function updateCurrentCombination() {
            currentCombination = [];
            slots.forEach((slot, index) => {
                if (slot.parts.length > 0 && slot.finalIndex !== null) {
                    const finalIdx = Math.min(slot.finalIndex, slot.parts.length - 1);
                    currentCombination[index] = finalIdx;
                } else {
                    currentCombination[index] = null;
                }
            });
        }
        
        function exportResult() {
            if (!currentCombination.some(p => p !== null)) {
                showMessage('Gira primero para generar un avatar');
                return;
            }
            try {
                const canvas = assembleResult();
                if (canvas) {
                    const link = document.createElement('a');
                    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                    link.download = config.combinaName.replace(/[^a-z0-9]/gi, '_') + '_' + timestamp + '.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    showMessage('Avatar guardado!');
                } else {
                    showMessage('Error al generar la imagen');
                }
            } catch (error) { 
                console.error(error);
                showMessage('Error al guardar'); 
            }
        }
        
        function updateResultDisplay() {
            if (resultSprite) { resultSprite.destroy(); resultSprite = null; }
            if (!resultContainer) return;
            while (resultContainer.children.length > 3) resultContainer.removeChildAt(resultContainer.children.length - 1);
            
            const hasValid = currentCombination.some(part => part !== null);
            if (!hasValid) {
                const emptyMsg = new PIXI.Text('GIRA\\nPARA COMENZAR', {
                    fontFamily: 'Arial', fontSize: isMobile ? 7 : 12, fill: 0x333333,
                    align: 'center', fontWeight: 'bold'
                });
                emptyMsg.x = (resultContainer.width - emptyMsg.width) / 2;
                emptyMsg.y = (resultContainer.height - emptyMsg.height) / 2;
                resultContainer.addChild(emptyMsg);
                resultSprite = emptyMsg;
                return;
            }
            
            const canvas = assembleResult();
            const texture = PIXI.Texture.from(canvas);
            const sprite = new PIXI.Sprite(texture);
            let scale = 1;
            if (isMobile) {
                scale = Math.min(0.65, (resultContainer.width - 10) / canvas.width);
            }
            sprite.scale.set(scale);
            sprite.x = (resultContainer.width - sprite.width) / 2;
            sprite.y = (resultContainer.height - sprite.height) / 2;
            resultContainer.addChild(sprite);
            resultSprite = sprite;
        }
        
        function assembleResult() {
            const validParts = [];
            for (let i = 0; i < currentCombination.length; i++) {
                if (currentCombination[i] !== null && typeof currentCombination[i] === 'number') {
                    validParts.push({ slotIndex: i, variantIndex: currentCombination[i] });
                }
            }
            
            if (validParts.length === 0) {
                const canvas = document.createElement('canvas');
                canvas.width = AVATAR_WIDTH; canvas.height = AVATAR_HEIGHT;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, AVATAR_WIDTH, AVATAR_HEIGHT);
                ctx.fillStyle = '#888888'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
                ctx.fillText('GIRA', AVATAR_WIDTH / 2, AVATAR_HEIGHT / 2 - 10);
                ctx.fillText('PARA COMENZAR', AVATAR_WIDTH / 2, AVATAR_HEIGHT / 2 + 10);
                return canvas;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = AVATAR_WIDTH; canvas.height = AVATAR_HEIGHT;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, AVATAR_WIDTH, AVATAR_HEIGHT);
            
            const adjustments = config.adjustments || { parts: [] };
            const orientation = config.orientation;
            const BASE_SCALE = 0.05;
            
            if (orientation === 'horizontal') {
                const startX = 100, spacing = 2, centerY = 75;
                for (let i = 0; i < validParts.length; i++) {
                    const configPart = config.parts[validParts[i].slotIndex];
                    if (!configPart) continue;
                    const variant = configPart.loadedVariants?.[validParts[i].variantIndex];
                    if (!variant) continue;
                    let adj = adjustments.parts.find(a => a.index === validParts[i].slotIndex);
                    if (!adj) adj = { index: validParts[i].slotIndex, x: startX + i * spacing, y: centerY, scale: BASE_SCALE };
                    const img = variant.originalImageElement;
                    if (img && img.complete && img.naturalWidth > 0) {
                        const scale = adj.scale || BASE_SCALE;
                        const width = img.width * scale, height = img.height * scale;
                        ctx.drawImage(img, adj.x - width/2, adj.y - height/2, width, height);
                    }
                }
            } else {
                const centerX = 90, startY = 15, spacing = 30;
                for (let i = 0; i < validParts.length; i++) {
                    const configPart = config.parts[validParts[i].slotIndex];
                    if (!configPart) continue;
                    const variant = configPart.loadedVariants?.[validParts[i].variantIndex];
                    if (!variant) continue;
                    let adj = adjustments.parts.find(a => a.index === validParts[i].slotIndex);
                    if (!adj) adj = { index: validParts[i].slotIndex, x: centerX, y: startY + i * spacing, scale: BASE_SCALE };
                    const img = variant.originalImageElement;
                    if (img && img.complete && img.naturalWidth > 0) {
                        const scale = adj.scale || BASE_SCALE;
                        const width = img.width * scale, height = img.height * scale;
                        ctx.drawImage(img, adj.x - width/2, adj.y - height/2, width, height);
                    }
                }
            }
            return canvas;
        }
        
        function showMessage(text) {
            const msg = new PIXI.Text(text, {
                fontFamily: 'Arial', fontSize: isMobile ? 10 : 16, fill: 0xffd93d,
                fontWeight: 'bold', dropShadow: true, dropShadowColor: '#000000'
            });
            msg.x = app.screen.width / 2 - msg.width / 2;
            msg.y = app.screen.height - 45;
            app.stage.addChild(msg);
            setTimeout(() => msg.destroy(), 2000);
        }
        
        function handleResize() {
            setTimeout(() => {
                let screenWidth, screenHeight;
                if (isMobile) {
                    screenWidth = Math.min(window.innerWidth - 20, 420);
                    screenHeight = Math.min(window.innerHeight - 20, 780);
                } else {
                    screenWidth = Math.min(window.innerWidth - 40, 1400);
                    screenHeight = Math.min(window.innerHeight - 40, 900);
                }
                app.renderer.resize(screenWidth, screenHeight);
                createUI();
            }, 100);
        }
        
        async function initGame() {
            const canvas = document.getElementById('game-canvas');
            const loadingDiv = document.getElementById('loading');
            
            isMobile = checkMobile();
            
            await loadImagesFromConfig();
            
            let screenWidth, screenHeight;
            if (isMobile) {
                screenWidth = Math.min(window.innerWidth - 20, 420);
                screenHeight = Math.min(window.innerHeight - 20, 780);
            } else {
                screenWidth = Math.min(window.innerWidth - 40, 1400);
                screenHeight = Math.min(window.innerHeight - 40, 900);
            }
            
            canvas.width = screenWidth;
            canvas.height = screenHeight;
            
            app = new PIXI.Application({
                view: canvas,
                width: screenWidth,
                height: screenHeight,
                backgroundColor: 0x061c12,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });
            
            createUI();
            loadingDiv.style.display = 'none';
            
            window.addEventListener('resize', handleResize);
            window.addEventListener('orientationchange', handleResize);
        }
        
        window.addEventListener('DOMContentLoaded', initGame);
    <\/script>
</body>
</html>`;
    }

    generateStandaloneCSS() {
        return `body {
    margin: 0;
    padding: 20px;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Arial', sans-serif;
    background: #020503;
}

#game-container {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 20px;
    padding: 10px;
    overflow: hidden;
}

canvas {
    display: block;
    border-radius: 12px;
    cursor: pointer;
}

@media (max-width: 768px) {
    body { padding: 10px; }
    #game-container { padding: 5px; border-radius: 10px; }
}`;
    }

    generateStandaloneJS(configData) {
        return `// Juego standalone de ${this.config.combinaName}
console.log('CombinaCosas - ${this.config.combinaName}');`;
    }

    generateReadme() {
        return `========================================
${this.config.combinaName.toUpperCase()} - COMBINACOSAS
========================================

INSTRUCCIONES:
1. Abre el archivo index.html en tu navegador web
2. Tira de la palanca para generar combinaciones aleatorias
3. Cada combinacion crea un avatar unico
4. Usa el boton GUARDAR para descargar la imagen

CONTROLES:
- Palanca: Tira para girar los rodillos
- Boton GUARDAR: Descarga la imagen del avatar actual

SOBRE ESTE COMBINA:
- Nombre: ${this.config.combinaName}
- Orientacion: ${this.config.orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
- Numero de partes: ${this.config.parts.length}
- Partes: ${this.config.parts.map(p => p.name).join(', ')}

ESTRUCTURA DEL PAQUETE:
- index.html - Pagina principal
- style.css - Estilos visuales
- game.js - Archivo de compatibilidad
- images/ - Todas las imagenes originales
- config.json - Configuracion del Combina

REQUISITOS TECNICOS:
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Soporte para JavaScript y canvas

Disfruta de tu Combina personalizado!

Generado el: ${new Date().toLocaleString()}`;
    }
}