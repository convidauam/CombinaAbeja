import * as PIXI from 'pixi.js';
import { DynamicSlotView } from '../views/DynamicSlotView.js';
import { UILever } from '../views/uiLever.js';

export class CombinaUI {
    constructor(generator) {
        this.generator = generator;
        this.app = generator.app;
        this.config = generator.config;
        this.slotViews = [];
        this.currentTheme = this.config?.theme || 'dark';
        this.cylinderContainer = null;
        this.backgroundElements = [];
        
        this.updateColors();
    }

    updateColors() {
        // Paleta refinada: Chasis gris, fondos de rodillos blancos impecables
        this.colors = {
            background: 0x061c12, 
            panel: 0x2d3436, 
            card: 0x3a4143, 
            border: 0x636e72,
            text: 0xffffff, 
            textLight: 0xdfe6e9, 
            accent: 0xffd93d, 
            accentDark: 0xcca800,
            slotBg: 0xffffff, 
            slotDark: 0xf5f6fa, 
            slotBorder: 0xb2bec3, 
            windowBg: 0x1e252b,
            windowInner: 0xffffff, 
            buttonPrimary: 0x2ed573, 
            buttonSecondary: 0xffa502,
            buttonDanger: 0xff4757, 
            buttonInfo: 0x1e90ff, 
            buttonPurple: 0x9c27b0
        };
    }

    updateTheme(theme) {
        this.currentTheme = theme;
        this.updateColors();
        this.createUI();
    }
    
    createUI() {
        if (!this.config || !this.config.parts) return;
        
        const width = this.app.screen.width;
        const height = this.app.screen.height;
        
        this.app.stage.removeChildren();
        this.backgroundElements = [];
        
        this.createCasinoBackground(width, height);
        this.createTitle(width, height);
        this.createResultArea();
        this.createCylinder();
        this.createSlots();
        this.createLever();
        this.createButtons();
        
        this.generator.updateResultDisplay();
    }

    createCasinoBackground(width, height) {
        // Generación de textura de degradado lineal (Verde Oscuro -> Negro)
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

        const bgTexture = PIXI.Texture.from(canvas);
        const bgSprite = new PIXI.Sprite(bgTexture);
        bgSprite.width = width;
        bgSprite.height = height;
        
        this.app.stage.addChild(bgSprite);
        this.backgroundElements.push(bgSprite);
        
        // Líneas sutiles de corte de mesa
        const tableLine = new PIXI.Graphics();
        tableLine.lineStyle(1, 0xffffff, 0.03);
        tableLine.moveTo(0, height * 0.15);
        tableLine.lineTo(width, height * 0.15);
        tableLine.moveTo(0, height * 0.85);
        tableLine.lineTo(width, height * 0.85);
        this.app.stage.addChild(tableLine);
        this.backgroundElements.push(tableLine);
    }

    createTitle(width, height) {
            const titleBg = new PIXI.Graphics();
            titleBg.beginFill(0x000000, 0.4);
            titleBg.drawRoundedRect(width / 2 - 180, 8, 360, 45, 8);
            titleBg.endFill();
            titleBg.lineStyle(1, 0xffffff, 0.1);
            titleBg.drawRoundedRect(width / 2 - 180, 8, 360, 45, 8);
            this.app.stage.addChild(titleBg);
            
            const title = new PIXI.Text(' ' + this.config.combinaName + ' ', {
                fontFamily: 'Arial',
                fontSize: 26,
                fill: 0xffd93d, // Amarillo vibrante de la paleta
                fontWeight: 'bold',
                dropShadow: true,
                dropShadowColor: '#000000',
                dropShadowBlur: 6,
                dropShadowDistance: 3,
                dropShadowAngle: Math.PI / 6
            });
            title.x = width / 2 - title.width / 2;
            title.y = 16;
            this.app.stage.addChild(title);
        }

    createResultArea() {
        const resultContainer = new PIXI.Container();
        const resultWidth = 220;
        const resultHeight = 200;
        
        resultContainer.x = 20;
        resultContainer.y = 60;
        
        const bg = new PIXI.Graphics();
        bg.beginFill(0x1e252b);
        bg.drawRoundedRect(0, 0, resultWidth, resultHeight, 8);
        bg.endFill();
        bg.lineStyle(2, 0x4f5d65, 1);
        bg.drawRoundedRect(0, 0, resultWidth, resultHeight, 8);
        resultContainer.addChild(bg);
        
        const title = new PIXI.Text('RESULTADO', {
            fontFamily: 'Arial',
            fontSize: 11,
            fill: 0xdfe6e9,
            fontWeight: 'bold'
        });
        title.x = resultWidth / 2 - title.width / 2;
        title.y = 8;
        resultContainer.addChild(title);
        
        const resultBg = new PIXI.Graphics();
        resultBg.beginFill(0xffffff);
        resultBg.drawRoundedRect(8, 28, resultWidth - 16, resultHeight - 38, 4);
        resultBg.endFill();
        resultContainer.addChild(resultBg);
        
        this.generator.resultContainer = resultContainer;
        this.app.stage.addChild(resultContainer);
    }

    createCylinder() {
            this.cylinderContainer = new PIXI.Container();
            
            const slotCount = this.config.parts.length;
            const slotWidth = 200;
            const slotHeight = 400;
            const slotSpacing = 6;
            const totalSlotsWidth = slotCount * slotWidth + (slotCount - 1) * slotSpacing;
            
            const paddingH = 20;
            const paddingV = 12;
            
            const cylinderWidth = totalSlotsWidth + paddingH * 2;
            const cylinderHeight = slotHeight + paddingV * 2;
            
            const startX = (this.app.screen.width - cylinderWidth) / 2;
            
            const startY = 300 - paddingV; 
            
            this.cylinderContainer.x = startX;
            this.cylinderContainer.y = startY;
            
            
            
            // CHASIS EXTERIOR GRIS (Mate industrial)
            const chassisBg = new PIXI.Graphics();
            chassisBg.beginFill(0x353b48);
            chassisBg.drawRoundedRect(0, 0, cylinderWidth, cylinderHeight, 12);
            chassisBg.endFill();
            
            // Bisel metálico exterior
            chassisBg.lineStyle(3, 0x718093, 1);
            chassisBg.drawRoundedRect(1, 1, cylinderWidth - 2, cylinderHeight - 2, 11);
            chassisBg.lineStyle(1, 0x2f3640, 1);
            chassisBg.drawRoundedRect(3, 3, cylinderWidth - 6, cylinderHeight - 6, 9);
            this.cylinderContainer.addChild(chassisBg);

            // Ventana de corte interna para los rodillos
            const windowInner = new PIXI.Graphics();
            windowInner.beginFill(0xffffff);
            windowInner.drawRect(paddingH, paddingV, totalSlotsWidth, slotHeight);
            windowInner.endFill();
            this.cylinderContainer.addChild(windowInner);
            
            // Divisiones o costillas mecánicas grises entre slots
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
            this.cylinderContainer.addChild(dividers);

            this.app.stage.addChild(this.cylinderContainer);
        }

    createSlots() {
        if (!this.config.parts) return;
        
        const slotCount = this.config.parts.length;
        const slotWidth = 200;
        const slotHeight = 400;
        const slotSpacing = 6;
        const paddingH = 20;
        const paddingV = 12;
        
        this.slotViews = [];
        
        for (let i = 0; i < slotCount; i++) {
            const x = paddingH + i * (slotWidth + slotSpacing);
            const y = paddingV;
            
            const slotView = new DynamicSlotView(
                this.app, x, y,
                slotWidth, slotHeight,
                this.config.parts[i].name,
                i,
                'horizontal',
                false,
                this.colors
            );
            
            this.cylinderContainer.addChild(slotView.container);
            this.slotViews.push(slotView);
            
            const slotData = this.generator.slots[i];
            if (slotData && slotData.parts && slotData.parts.length > 0) {
                slotView.updateParts(
                    slotData.parts,
                    0,
                    { spinning: false, spinSpeed: 0, finalIndex: null, glowIntensity: 0 }
                );
            }
        }
        
        this.generator.slotViews = this.slotViews;
    }

    updateCylinderLights(spinning) {
        // Función vacía decorativa obligatoria para compatibilidad con CombinaSpin
    }

    createLever() {
        const leverX = this.app.screen.width - 85;
        const leverY = this.app.screen.height / 2 + 15;
        
        const lever = new UILever(leverX, leverY, 1.4, () => {
            this.generator.spin();
        });
        
        this.app.stage.addChild(lever);
        this.generator.lever = lever;
    }

    createButtons() {
        const buttonY = this.app.screen.height - 55;
        const buttons = [
            { text: 'GUARDAR', x: this.app.screen.width - 140, width: 120, color: this.colors.buttonPrimary },
            { text: 'AJUSTAR', x: this.app.screen.width - 275, width: 120, color: this.colors.buttonSecondary },
            { text: 'PAQUETE', x: this.app.screen.width - 415, width: 130, color: this.colors.buttonPurple },
            { text: 'NUEVO', x: 20, width: 110, color: this.colors.buttonDanger }
        ];
        
        buttons.forEach(btnData => {
            const btn = this.createPremiumButton(btnData.x, buttonY, btnData.width, 38, btnData.text, btnData.color);
            if (btnData.text.includes('GUARDAR')) {
                btn.on('pointerdown', () => this.generator.exportResult());
            } else if (btnData.text.includes('AJUSTAR')) {
                btn.on('pointerdown', () => this.generator.openAvatarAdjuster());
            } else if (btnData.text.includes('PAQUETE')) {
                btn.on('pointerdown', () => this.generator.exportCombinaPackage());
            } else if (btnData.text.includes('NUEVO')) {
                btn.on('pointerdown', () => this.generator.resetToImport());
            }
            this.app.stage.addChild(btn);
        });
    }

    createPremiumButton(x, y, width, height, text, color) {
        const container = new PIXI.Container();
        container.x = x; container.y = y;
        container.eventMode = 'static'; container.cursor = 'pointer';
        
        const button = new PIXI.Graphics();
        button.beginFill(color);
        button.drawRoundedRect(0, 0, width, height, 6);
        button.endFill();
        container.addChild(button);
        
        const label = new PIXI.Text(text, {
            fontFamily: 'Arial', fontSize: 12, fill: 0xffffff, fontWeight: 'bold'
        });
        label.x = width / 2 - label.width / 2;
        label.y = height / 2 - label.height / 2;
        container.addChild(label);
        
        return container;
    }

    updateSlots(slots, positions, spinStates) {
        this.slotViews.forEach((view, index) => {
            const slot = slots[index];
            if (slot && slot.parts) {
                view.updateParts(slot.parts, positions[index], spinStates[index]);
            }
        });
    }
}