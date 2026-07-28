import * as PIXI from 'pixi.js';

export class DynamicSlotView {
    constructor(app, x, y, width, height, partName, partIndex, orientation = 'horizontal', isMobile = false, colors = null) {
        this.app = app;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.partName = partName || 'Part';
        this.partIndex = partIndex;
        this.orientation = orientation;
        this.isMobile = isMobile;
        this.isSpinning = false;
        
        this.colors = colors || {
            slotBg: 0xffffff,
            text: 0x2f3640,
            accent: 0xff4757
        };
        
        this.container = new PIXI.Container();
        this.container.x = x;
        this.container.y = y;
        
        this.sprites = [];
        this.cachedTextures = [];
        
        this.blurFilter = new PIXI.BlurFilter();
        this.blurFilter.blur = 0;
        
        this.createSlotMachine();
    }

    createSlotMachine() {
            this.viewY = 0;
            this.viewHeight = this.height;
            this.selectorY = this.viewHeight / 2;

            // Máscara de recorte exacta para el rodillo
            const mask = new PIXI.Graphics();
            mask.beginFill(0xffffff);
            mask.drawRect(0, 0, this.width, this.viewHeight);
            mask.endFill();
            this.container.addChild(mask);
            
            this.contentContainer = new PIXI.Container();
            this.contentContainer.mask = mask;
            this.container.addChild(this.contentContainer);

            // RECUADRO INDIVIDUAL BLANCO
            this.backgroundGraphics = new PIXI.Graphics();
            this.backgroundGraphics.beginFill(0xffffff);
            this.backgroundGraphics.drawRect(0, 0, this.width, this.viewHeight);
            this.backgroundGraphics.endFill();
            this.contentContainer.addChild(this.backgroundGraphics);

            // CAPA DE REALISMO CILÍNDRICO CONTINUO
            this.overlay3D = new PIXI.Graphics();
            const steps = 24; 
            
            // Extendemos el ancho de la sombra un píxel a cada lado (-1 a width + 2)
            // para asegurar que las sombras de slots vecinos se fusionen perfectamente.
            for (let i = 0; i < steps; i++) {
                const pct = i / steps;
                const shadowAlpha = Math.pow(1 - pct, 2.3) * 0.88; // Sombra sutilmente más suave para fondo blanco completo
                const segmentHeight = (this.viewHeight * 0.25) / steps;
                
                // Sombra Superior
                this.overlay3D.beginFill(0x000000, shadowAlpha);
                this.overlay3D.drawRect(-1, i * segmentHeight, this.width + 2, segmentHeight);
                
                // Sombra Inferior
                this.overlay3D.drawRect(-1, this.viewHeight - (i * segmentHeight) - segmentHeight, this.width + 2, segmentHeight);
                this.overlay3D.endFill();
            }

            // Brillo sutil de cristal curvado uniforme
            this.overlay3D.beginFill(0x000000, 0.02);
            this.overlay3D.drawRect(-1, this.viewHeight * 0.25, this.width + 2, this.viewHeight * 0.08);
            this.overlay3D.drawRect(-1, this.viewHeight * 0.67, this.width + 2, this.viewHeight * 0.08);
            this.overlay3D.endFill();

            this.overlay3D.beginFill(0xffffff, 0.08);
            this.overlay3D.drawRect(-1, this.viewHeight * 0.45, this.width + 2, 4);
            this.overlay3D.endFill();

            // Línea central de guía focal muy tenue
            this.overlay3D.lineStyle(1, 0x000000, 0.03);
            this.overlay3D.moveTo(-1, this.selectorY);
            this.overlay3D.lineTo(this.width + 1, this.selectorY);

            // Añadir la oclusión sobre el contenedor
            this.container.addChild(this.overlay3D);

            const placeholderText = new PIXI.Text('Esperando datos...', {
                fontFamily: 'Arial', fontSize: 12, fill: 0x7f8c8d, align: 'center'
            });
            placeholderText.x = this.width / 2;
            placeholderText.y = this.selectorY;
            placeholderText.anchor.set(0.5);
            this.contentContainer.addChild(placeholderText);
            this.sprites.push(placeholderText);
        }

    setTextures(textures) {
        this.cachedTextures = textures || [];
    }

    updateParts(parts, position, spinState) {
        this.isSpinning = spinState ? spinState.spinning : false;
        
        this.sprites.forEach(sprite => {
            if (sprite && sprite.parent) sprite.parent.removeChild(sprite);
            if (sprite) sprite.destroy();
        });
        this.sprites = [];

        if (!parts || parts.length === 0) {
            const noPartsText = new PIXI.Text('Cargar JSON', {
                fontFamily: 'Arial', fontSize: 13, fill: this.colors.accent, align: 'center', fontWeight: 'bold'
            });
            noPartsText.x = this.width / 2;
            noPartsText.y = this.selectorY;
            noPartsText.anchor.set(0.5);
            this.contentContainer.addChild(noPartsText);
            this.sprites.push(noPartsText);
            return;
        }

        const speed = Math.abs(spinState?.spinSpeed || 0);
        this.blurFilter.blur = this.isSpinning ? Math.min(5, speed / 10) : 0;

        const spacing = 90;
        const radius = this.viewHeight * 0.52;
        const centerIndex = Math.floor(position / spacing) % parts.length;
        const offsetRange = this.isMobile ? [-3, -2, -1, 0, 1, 2, 3] : [-4, -3, -2, -1, 0, 1, 2, 3, 4];

        for (let offset of offsetRange) {
            const partIndex = (centerIndex + offset + parts.length) % parts.length;
            const part = parts[partIndex];
            
            if (!part) continue;
            
            let texture = null;
            if (this.cachedTextures && this.cachedTextures[partIndex]) {
                texture = this.cachedTextures[partIndex];
            } else if (part.originalImageElement) {
                texture = PIXI.Texture.from(part.originalImageElement);
            } else {
                texture = this.createFallbackTexture();
            }
            
            const sprite = new PIXI.Sprite(texture);
            const yOffset = (position % spacing) - (offset * spacing);
            const angle = (yOffset / radius);

            if (Math.abs(angle) > Math.PI / 2) continue;

            // Proyección matemática sobre la curvatura del rodillo
            const spriteY = this.selectorY + Math.sin(angle) * radius;
            const zScale = Math.cos(angle);
            
            // =========================================================================
            // CONTROL DE TAMAÑO DE LAS IMÁGENES
            // Incrementa estos valores para darles más presencia dentro del rodillo blanco.
            // =========================================================================
            const maxSlotSize = this.isMobile ? 85 : 195; // Máximo en píxeles (Antes: 55 / 120)
            const baseScale = Math.min(
                maxSlotSize / texture.width,
                maxSlotSize / texture.height,
                this.isMobile ? 0.70 : 1.25 // Factor multiplicador de escala base (Antes: 0.45 / 0.85)
            );
            
            // Compresión y escalamiento esférico en los extremos superiores e inferiores
            let scaleY = baseScale * zScale;
            let scaleX = baseScale * (1 - Math.abs(angle) * 0.08);
            let alpha = Math.pow(zScale, 1.5);

            if (this.isSpinning) {
                sprite.filters = [this.blurFilter];
                alpha *= 0.8;
            } else {
                sprite.filters = [];
                if (offset === 0 && Math.abs(yOffset) < 15) {
                    alpha = 1.0;
                }
            }

            sprite.x = this.width / 2;
            sprite.y = spriteY;
            sprite.scale.set(scaleX, scaleY);
            sprite.anchor.set(0.5);
            sprite.alpha = Math.max(0, Math.min(1, alpha));
            
            // Insertar detrás de la capa fija de oclusión 3D
            this.contentContainer.addChild(sprite);
            this.sprites.push(sprite);
        }
    }

    createFallbackTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#7f8c8d';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 32, 32);
        return PIXI.Texture.from(canvas);
    }
}