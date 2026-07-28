import * as PIXI from 'pixi.js';

export class AvatarAdjuster {
    constructor(app, x, y, width, height, currentCombination, config, onSave, onCancel) {
        this.app = app;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.currentCombination = currentCombination;
        this.config = config;
        this.onSave = onSave;
        this.onCancel = onCancel;
        
        this.container = new PIXI.Container();
        this.container.x = x;
        this.container.y = y;
        
        this.partSprites = [];
        this.selectedPart = null;
        this.dragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.startPosition = { x: 0, y: 0 };
        this.partNames = [];
        this.partSelectorBg = null;
        this.partSelectorText = null;
        this.selectedInfo = null;
        
        this.adjustments = this.config.adjustments || { parts: [] };
        this.orientation = this.config.orientation || 'horizontal';
        this.theme = this.config.theme || 'dark';
        
        // Tamaño del avatar original (coincide con assembleResult)
        this.AVATAR_WIDTH = 180;
        this.AVATAR_HEIGHT = 130;
        
        // Mismos valores que usa assembleResult
        this.AVATAR_BASE_SCALE = 0.05;
        this.START_X_AVATAR = 100;
        this.SPACING_AVATAR = 2;
        this.CENTER_Y_AVATAR = 75;
        this.START_Y_VERTICAL_AVATAR = 15;
        this.SPACING_Y_VERTICAL_AVATAR = 30;
        this.CENTER_X_VERTICAL_AVATAR = 90;
        
        this.createFrame();
        this.loadParts();
    }

    getColors() {
        if (this.theme === 'light') {
            return {
                background: 0xf5f5f5,
                panel: 0xffffff,
                card: 0xfafafa,
                border: 0xdddddd,
                text: 0x333333,
                textSecondary: 0x666666,
                accent: 0xffd93d,
                buttonBg: 0xeeeeee,
                buttonText: 0x333333,
                grid: 0xcccccc,
                selectorBg: 0xffffff,
                selectorBorder: 0xdddddd
            };
        } else {
            return {
                background: 0x1e2b38,
                panel: 0x2c3e50,
                card: 0x1e2b38,
                border: 0x4a5b6b,
                text: 0xffffff,
                textSecondary: 0xcccccc,
                accent: 0xffd93d,
                buttonBg: 0x4a5b6b,
                buttonText: 0xffffff,
                grid: 0x4a5b6b,
                selectorBg: 0x0a0f14,
                selectorBorder: 0x4a5b6b
            };
        }
    }

    createFrame() {
        const colors = this.getColors();
        
        const bg = new PIXI.Graphics();
        bg.beginFill(colors.background);
        bg.drawRoundedRect(0, 0, this.width, this.height, 10);
        bg.endFill();
        this.container.addChild(bg);
        
        const grid = new PIXI.Graphics();
        grid.lineStyle(1, colors.grid, 0.3);
        
        for (let i = 0; i <= 4; i++) {
            const x = (this.width / 4) * i;
            grid.moveTo(x, 0);
            grid.lineTo(x, this.height);
            
            const y = (this.height / 4) * i;
            grid.moveTo(0, y);
            grid.lineTo(this.width, y);
        }
        this.container.addChild(grid);
        
        const guide = new PIXI.Graphics();
        guide.lineStyle(2, colors.accent);
        guide.drawRect(10, 10, this.width - 20, this.height - 20);
        this.container.addChild(guide);
        
        const title = new PIXI.Text('AJUSTE DEL AVATAR', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: colors.accent,
            fontWeight: 'bold'
        });
        title.x = this.width / 2 - title.width / 2;
        title.y = 5;
        this.container.addChild(title);
        
        const orientationText = this.orientation === 'horizontal' ? '← HORIZONTAL →' : '↑ VERTICAL ↓';
        const orientationLabel = new PIXI.Text(orientationText, {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: colors.textSecondary,
            fontStyle: 'italic'
        });
        orientationLabel.x = this.width / 2 - orientationLabel.width / 2;
        orientationLabel.y = 22;
        this.container.addChild(orientationLabel);
        
        const instructions = new PIXI.Text('Arrastra cada parte para moverla | Click derecho o botones para ajustar tamaño', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: colors.textSecondary
        });
        instructions.x = this.width / 2 - instructions.width / 2;
        instructions.y = this.height - 18;
        this.container.addChild(instructions);
        
        this.createControlPanel(colors);
    }

    createControlPanel(colors) {
        const panel = new PIXI.Graphics();
        panel.beginFill(colors.panel, 0.95);
        panel.drawRoundedRect(0, 0, 200, 240, 8);
        panel.endFill();
        panel.lineStyle(1, colors.border);
        panel.drawRoundedRect(0, 0, 200, 240, 8);
        panel.x = this.width + 10;
        panel.y = 10;
        this.container.addChild(panel);
        
        const panelTitle = new PIXI.Text('CONTROLES', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: colors.accent,
            fontWeight: 'bold'
        });
        panelTitle.x = 100 - panelTitle.width / 2;
        panelTitle.y = 8;
        panel.addChild(panelTitle);
        
        this.partSelectorBg = new PIXI.Graphics();
        this.partSelectorBg.beginFill(colors.selectorBg);
        this.partSelectorBg.drawRoundedRect(10, 35, 180, 30, 5);
        this.partSelectorBg.endFill();
        this.partSelectorBg.lineStyle(1, colors.selectorBorder);
        this.partSelectorBg.drawRoundedRect(10, 35, 180, 30, 5);
        panel.addChild(this.partSelectorBg);
        
        this.partSelectorText = new PIXI.Text('Seleccionar parte...', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: colors.text
        });
        this.partSelectorText.x = 15;
        this.partSelectorText.y = 42;
        panel.addChild(this.partSelectorText);
        
        const arrow = new PIXI.Text('▼', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: colors.text
        });
        arrow.x = 175;
        arrow.y = 42;
        panel.addChild(arrow);
        
        const sizeUpBtn = this.createSmallButton(10, 75, 85, 30, '+ TAMAÑO', colors.buttonBg, colors.buttonText);
        sizeUpBtn.on('pointerdown', () => this.adjustSelectedSize(0.02));
        panel.addChild(sizeUpBtn);
        
        const sizeDownBtn = this.createSmallButton(105, 75, 85, 30, '- TAMAÑO', colors.buttonBg, colors.buttonText);
        sizeDownBtn.on('pointerdown', () => this.adjustSelectedSize(-0.02));
        panel.addChild(sizeDownBtn);
        
        const leftBtn = this.createSmallButton(10, 115, 40, 35, '←', colors.buttonBg, colors.buttonText);
        leftBtn.on('pointerdown', () => this.moveSelected(-10, 0));
        panel.addChild(leftBtn);
        
        const rightBtn = this.createSmallButton(55, 115, 40, 35, '→', colors.buttonBg, colors.buttonText);
        rightBtn.on('pointerdown', () => this.moveSelected(10, 0));
        panel.addChild(rightBtn);
        
        const upBtn = this.createSmallButton(100, 115, 40, 35, '↑', colors.buttonBg, colors.buttonText);
        upBtn.on('pointerdown', () => this.moveSelected(0, -10));
        panel.addChild(upBtn);
        
        const downBtn = this.createSmallButton(145, 115, 40, 35, '↓', colors.buttonBg, colors.buttonText);
        downBtn.on('pointerdown', () => this.moveSelected(0, 10));
        panel.addChild(downBtn);
        
        const resetBtn = this.createSmallButton(10, 160, 85, 30, 'RESET PARTE', 0xff9800, 0xffffff);
        resetBtn.on('pointerdown', () => this.resetSelected());
        panel.addChild(resetBtn);
        
        const resetAllBtn = this.createSmallButton(105, 160, 85, 30, 'RESET TODO', 0xff5722, 0xffffff);
        resetAllBtn.on('pointerdown', () => this.resetAll());
        panel.addChild(resetAllBtn);
        
        this.selectedInfo = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 9,
            fill: colors.textSecondary
        });
        this.selectedInfo.x = 10;
        this.selectedInfo.y = 200;
        panel.addChild(this.selectedInfo);
        
        this.partSelectorBg.eventMode = 'static';
        this.partSelectorBg.cursor = 'pointer';
        this.partSelectorBg.on('pointerdown', () => this.showPartMenu());
    }

    createSmallButton(x, y, width, height, text, color, textColor) {
        const button = new PIXI.Graphics();
        button.beginFill(color);
        button.drawRoundedRect(0, 0, width, height, 5);
        button.endFill();
        button.x = x;
        button.y = y;
        button.eventMode = 'static';
        button.cursor = 'pointer';
        button.zIndex = 100;
        button.interactive = true;
        
        const label = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: textColor,
            fontWeight: 'bold'
        });
        label.x = width / 2 - label.width / 2;
        label.y = height / 2 - label.height / 2;
        button.addChild(label);
        
        return button;
    }

    loadParts() {
        if (this.partSprites) {
            this.partSprites.forEach(sprite => {
                if (sprite && !sprite.destroyed) sprite.destroy();
            });
        }
        this.partSprites = [];
        
        const validParts = [];
        for (let i = 0; i < this.currentCombination.length; i++) {
            const part = this.currentCombination[i];
            if (part !== null) {
                let variantIndex = 0;
                if (typeof part === 'object' && part.id !== undefined) {
                    variantIndex = part.id;
                } else if (typeof part === 'number') {
                    variantIndex = part;
                }
                
                const slotData = this.config.parts[i];
                if (slotData && slotData.loadedVariants && slotData.loadedVariants[variantIndex]) {
                    const variant = slotData.loadedVariants[variantIndex];
                    validParts.push({
                        index: i,
                        name: slotData.name || `Parte ${i + 1}`,
                        variant: variant,
                        variantIndex: variantIndex
                    });
                }
            }
        }
        
        if (validParts.length === 0) {
            const colors = this.getColors();
            const noPartsMsg = new PIXI.Text('No hay partes cargadas', {
                fontFamily: 'Arial', fontSize: 12, fill: 0xff6666
            });
            noPartsMsg.x = this.width / 2 - noPartsMsg.width / 2;
            noPartsMsg.y = this.height / 2;
            this.container.addChild(noPartsMsg);
            return;
        }
        
        // Factores de escala entre el avatar (180x130) y el ajustador
        const scaleX = this.width / this.AVATAR_WIDTH;
        const scaleY = this.height / this.AVATAR_HEIGHT;
        
        // Convertir coordenadas del avatar a coordenadas del ajustador
        const startX = this.START_X_AVATAR * scaleX;
        const spacing = this.SPACING_AVATAR * scaleX;
        const centerY = this.CENTER_Y_AVATAR * scaleY;
        const startYVertical = this.START_Y_VERTICAL_AVATAR * scaleY;
        const spacingY = this.SPACING_Y_VERTICAL_AVATAR * scaleY;
        const centerXVertical = this.CENTER_X_VERTICAL_AVATAR * scaleX;
        
        console.log('Ajustador - scaleX:', scaleX, 'scaleY:', scaleY);
        console.log('Ajustador - startX:', startX, 'spacing:', spacing, 'centerY:', centerY);
        
        for (let i = 0; i < validParts.length; i++) {
            const item = validParts[i];
            const variant = item.variant;
            
            let existingAdj = this.adjustments.parts.find(a => a.index === item.index);
            
            const texture = PIXI.Texture.from(variant.originalImageElement);
            const sprite = new PIXI.Sprite(texture);
            
            let defaultX, defaultY, defaultScale;
            
            if (existingAdj && existingAdj.x !== undefined && existingAdj.y !== undefined) {
                // Convertir coordenadas guardadas (en espacio avatar) a espacio ajustador
                defaultX = existingAdj.x * scaleX;
                defaultY = existingAdj.y * scaleY;
                defaultScale = existingAdj.scale * scaleX;
            } else if (this.orientation === 'horizontal') {
                defaultX = startX + i * spacing;
                defaultY = centerY;
                defaultScale = this.AVATAR_BASE_SCALE * scaleX;
            } else {
                // Vertical
                defaultX = centerXVertical;
                defaultY = startYVertical + i * spacingY;
                defaultScale = this.AVATAR_BASE_SCALE * scaleX;
            }
            
            sprite.x = defaultX;
            sprite.y = defaultY;
            sprite.scale.set(defaultScale);
            sprite.anchor.set(0.5);
            sprite.eventMode = 'static';
            sprite.cursor = 'move';
            sprite.zIndex = 50;
            sprite.interactive = true;
            
            sprite.partData = {
                index: item.index,
                name: item.name,
                originalX: defaultX,
                originalY: defaultY,
                originalScale: defaultScale,
                x: defaultX,
                y: defaultY,
                scale: defaultScale,
                variant: variant
            };
            
            sprite.on('pointerdown', (e) => this.onDragStart(sprite, e));
            sprite.on('pointerup', () => this.onDragEnd());
            sprite.on('pointerupoutside', () => this.onDragEnd());
            sprite.on('rightclick', (e) => {
                if (e.data && e.data.originalEvent) {
                    e.data.originalEvent.preventDefault();
                }
                this.selectedPart = sprite;
                this.adjustSelectedSize(0.02);
            });
            
            this.container.addChild(sprite);
            this.partSprites.push(sprite);
        }
        
        this.partNames = validParts.map(p => p.name);
        if (this.partNames.length > 0 && this.partSelectorText) {
            this.partSelectorText.text = this.partNames[0];
        }
        
        if (this.partSprites.length > 0) {
            this.selectPart(0);
        }
    }

    showPartMenu() {
        const colors = this.getColors();
        const menu = new PIXI.Graphics();
        menu.beginFill(colors.panel);
        menu.drawRoundedRect(0, 0, 150, this.partNames.length * 30 + 10, 5);
        menu.endFill();
        menu.lineStyle(1, colors.border);
        menu.drawRoundedRect(0, 0, 150, this.partNames.length * 30 + 10, 5);
        menu.x = this.container.x + this.width + 10;
        menu.y = this.container.y + 45;
        menu.zIndex = 200;
        menu.interactive = true;
        menu.eventMode = 'static';
        
        for (let i = 0; i < this.partNames.length; i++) {
            const item = new PIXI.Text(this.partNames[i], {
                fontFamily: 'Arial',
                fontSize: 11,
                fill: colors.text
            });
            item.x = 10;
            item.y = 5 + i * 30;
            item.eventMode = 'static';
            item.cursor = 'pointer';
            item.interactive = true;
            
            item.on('pointerdown', () => {
                this.selectPart(i);
                menu.destroy();
            });
            
            menu.addChild(item);
        }
        
        this.container.addChild(menu);
        
        const closeMenu = () => {
            if (!menu.destroyed) menu.destroy();
            document.removeEventListener('click', closeMenu);
        };
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    selectPart(index) {
        if (this.selectedPart) {
            this.selectedPart.tint = 0xffffff;
        }
        
        this.selectedPart = this.partSprites[index];
        this.selectedPart.tint = 0xffd93d;
        
        if (this.partSelectorText) {
            this.partSelectorText.text = this.selectedPart.partData.name;
        }
        
        const data = this.selectedPart.partData;
        if (this.selectedInfo) {
            this.selectedInfo.text = `${data.name}\nPos: ${Math.round(data.x)},${Math.round(data.y)}\nEscala: ${data.scale.toFixed(2)}`;
        }
    }

    onDragStart(sprite, event) {
        this.selectedPart = sprite;
        this.dragging = true;
        this.dragStart = {
            x: event.data.global.x - sprite.x,
            y: event.data.global.y - sprite.y
        };
        this.startPosition = { x: sprite.x, y: sprite.y };
        sprite.tint = 0xffd93d;
        
        if (this.partSelectorText) {
            this.partSelectorText.text = sprite.partData.name;
        }
        
        const data = sprite.partData;
        if (this.selectedInfo) {
            this.selectedInfo.text = `${data.name}\nPos: ${Math.round(data.x)},${Math.round(data.y)}\nEscala: ${data.scale.toFixed(2)}`;
        }
        
        this.container.on('pointermove', this.onDragMove.bind(this));
    }

    onDragMove(event) {
        if (!this.dragging || !this.selectedPart) return;
        
        const newX = event.data.global.x - this.dragStart.x;
        const newY = event.data.global.y - this.dragStart.y;
        
        const minX = 20;
        const maxX = this.width - 20;
        const minY = 20;
        const maxY = this.height - 20;
        
        const finalX = Math.min(maxX, Math.max(minX, newX));
        const finalY = Math.min(maxY, Math.max(minY, newY));
        
        this.selectedPart.x = finalX;
        this.selectedPart.y = finalY;
        
        this.selectedPart.partData.x = finalX;
        this.selectedPart.partData.y = finalY;
        
        const data = this.selectedPart.partData;
        if (this.selectedInfo) {
            this.selectedInfo.text = `${data.name}\nPos: ${Math.round(data.x)},${Math.round(data.y)}\nEscala: ${data.scale.toFixed(2)}`;
        }
    }

    onDragEnd() {
        this.dragging = false;
        this.container.off('pointermove');
    }

    adjustSelectedSize(delta) {
        if (!this.selectedPart) return;
        
        const scaleX = this.width / this.AVATAR_WIDTH;
        const minScale = 0.02 * scaleX;
        const maxScale = 0.4 * scaleX;
        
        const newScale = Math.max(minScale, Math.min(maxScale, this.selectedPart.scale.x + delta));
        this.selectedPart.scale.set(newScale);
        this.selectedPart.partData.scale = newScale;
        
        const data = this.selectedPart.partData;
        if (this.selectedInfo) {
            this.selectedInfo.text = `${data.name}\nPos: ${Math.round(data.x)},${Math.round(data.y)}\nEscala: ${data.scale.toFixed(2)}`;
        }
    }

    moveSelected(dx, dy) {
        if (!this.selectedPart) return;
        
        const newX = this.selectedPart.x + dx;
        const newY = this.selectedPart.y + dy;
        
        const minX = 20;
        const maxX = this.width - 20;
        const minY = 20;
        const maxY = this.height - 20;
        
        const finalX = Math.min(maxX, Math.max(minX, newX));
        const finalY = Math.min(maxY, Math.max(minY, newY));
        
        this.selectedPart.x = finalX;
        this.selectedPart.y = finalY;
        
        this.selectedPart.partData.x = finalX;
        this.selectedPart.partData.y = finalY;
        
        const data = this.selectedPart.partData;
        if (this.selectedInfo) {
            this.selectedInfo.text = `${data.name}\nPos: ${Math.round(data.x)},${Math.round(data.y)}\nEscala: ${data.scale.toFixed(2)}`;
        }
    }

    resetSelected() {
        if (!this.selectedPart) return;
        
        const original = this.selectedPart.partData;
        this.selectedPart.x = original.originalX;
        this.selectedPart.y = original.originalY;
        this.selectedPart.scale.set(original.originalScale);
        
        original.x = original.originalX;
        original.y = original.originalY;
        original.scale = original.originalScale;
        
        if (this.selectedInfo) {
            this.selectedInfo.text = `${original.name}\nPos: ${Math.round(original.x)},${Math.round(original.y)}\nEscala: ${original.scale.toFixed(2)}`;
        }
    }

    resetAll() {
        this.partSprites.forEach(sprite => {
            const original = sprite.partData;
            sprite.x = original.originalX;
            sprite.y = original.originalY;
            sprite.scale.set(original.originalScale);
            
            original.x = original.originalX;
            original.y = original.originalY;
            original.scale = original.originalScale;
        });
        
        if (this.selectedPart) {
            const data = this.selectedPart.partData;
            if (this.selectedInfo) {
                this.selectedInfo.text = `${data.name}\nPos: ${Math.round(data.x)},${Math.round(data.y)}\nEscala: ${data.scale.toFixed(2)}`;
            }
        }
    }

    getAdjustments() {
        const parts = [];
        
        const scaleXInv = this.AVATAR_WIDTH / this.width;
        const scaleYInv = this.AVATAR_HEIGHT / this.height;
        const SCALE_FACTOR_INV = this.AVATAR_WIDTH / this.width;
        
        for (const sprite of this.partSprites) {
            if (sprite && sprite.partData) {
                parts.push({
                    index: sprite.partData.index,
                    name: sprite.partData.name,
                    x: sprite.x * scaleXInv,
                    y: sprite.y * scaleYInv,
                    scale: sprite.scale.x * SCALE_FACTOR_INV
                });
            }
        }
        
        console.log('Ajustes obtenidos (convertidos a avatar):', parts);
        return { parts };
    }

    save() {
        console.log('Guardando ajustes...');
        const adjustments = this.getAdjustments();
        console.log('Ajustes a guardar:', JSON.stringify(adjustments, null, 2));
        
        if (this.onSave) {
            this.onSave(adjustments);
        } else {
            console.error('onSave no está definido');
        }
    }

    cancel() {
        console.log('Cancelando ajustes');
        if (this.onCancel) {
            this.onCancel();
        }
    }
}