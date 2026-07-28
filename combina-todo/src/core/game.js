import * as PIXI from 'pixi.js';
import { CombinaGenerator } from './CombinaGenerator.js';

export class Game {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.app = null;
        this.combinaGenerator = null;
        
        this.resizeTimeout = null;
        window.addEventListener('resize', this.debouncedResize.bind(this));
        
        this.init();
    }

    debouncedResize() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => this.resize(), 200);
    }

    async init() {
        const { width, height } = this.getDimensions();
        
        this.app = new PIXI.Application({
            view: document.getElementById(this.canvasId),
            width: width,
            height: height,
            backgroundColor: 0x0f1219,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: false
        });

        this.combinaGenerator = new CombinaGenerator(this.app);
        
        await this.showImportScreen();
        
        this.start();
    }

    async showImportScreen() {
        this.app.stage.removeChildren();
        
        const colors = {
            background: 0x0f1219,
            panel: 0x2c3e50,
            text: 0xffffff,
            textLight: 0xcccccc,
            accent: 0xffd93d
        };
        
        this.app.renderer.backgroundColor = colors.background;
        
        const panel = new PIXI.Graphics();
        panel.beginFill(colors.panel);
        panel.drawRoundedRect(0, 0, 500, 350, 20);
        panel.endFill();
        panel.x = this.app.screen.width / 2 - 250;
        panel.y = this.app.screen.height / 2 - 175;
        this.app.stage.addChild(panel);
        
        const title = new PIXI.Text('COMBINATODO', {
            fontFamily: 'Arial',
            fontSize: 28,
            fill: colors.accent,
            fontWeight: 'bold'
        });
        title.x = this.app.screen.width / 2 - title.width / 2;
        title.y = panel.y + 30;
        this.app.stage.addChild(title);
        
        const subtitle = new PIXI.Text('Cargar configuracion existente', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: colors.textLight
        });
        subtitle.x = this.app.screen.width / 2 - subtitle.width / 2;
        subtitle.y = panel.y + 80;
        this.app.stage.addChild(subtitle);
        
        const importBtn = this.createCenteredButton(
            this.app.screen.width / 2 - 120,
            panel.y + 160,
            240,
            50,
            'IMPORTAR CONFIGURACION',
            colors.accent,
            0x333333
        );
        
        importBtn.on('pointerdown', async () => {
            importBtn.destroy();
            await this.combinaGenerator.importConfigFromFile();
        });
        
        this.app.stage.addChild(importBtn);
        
        const helpText = new PIXI.Text('Usa el formulario "form-standalone.html" para crear tu configuracion', {
            fontFamily: 'Arial',
            fontSize: 11,
            fill: colors.textLight,
            wordWrap: true,
            wordWrapWidth: 400,
            align: 'center'
        });
        helpText.x = this.app.screen.width / 2 - helpText.width / 2;
        helpText.y = panel.y + 260;
        this.app.stage.addChild(helpText);
        
        const bgDecor = new PIXI.Graphics();
        bgDecor.beginFill(0x1e2b38);
        bgDecor.drawCircle(this.app.screen.width - 50, 50, 80);
        bgDecor.endFill();
        bgDecor.alpha = 0.3;
        this.app.stage.addChild(bgDecor);
        
        const bgDecor2 = new PIXI.Graphics();
        bgDecor2.beginFill(0x1e2b38);
        bgDecor2.drawCircle(50, this.app.screen.height - 50, 60);
        bgDecor2.endFill();
        bgDecor2.alpha = 0.3;
        this.app.stage.addChild(bgDecor2);
    }

    createCenteredButton(x, y, width, height, text, bgColor, textColor) {
        const button = new PIXI.Graphics();
        button.beginFill(bgColor);
        button.drawRoundedRect(0, 0, width, height, 10);
        button.endFill();
        button.x = x;
        button.y = y;
        button.eventMode = 'static';
        button.cursor = 'pointer';
        
        const label = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: textColor,
            fontWeight: 'bold'
        });
        label.x = width / 2 - label.width / 2;
        label.y = height / 2 - label.height / 2;
        button.addChild(label);
        
        button.on('pointerover', () => {
            button.tint = 0xdddddd;
        });
        button.on('pointerout', () => {
            button.tint = 0xffffff;
        });
        button.on('pointerdown', () => {
            button.y += 2;
            setTimeout(() => { button.y -= 2; }, 100);
        });
        
        return button;
    }

    getDimensions() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let width = Math.min(1400, windowWidth - 40);
        let height = Math.min(900, windowHeight - 40);
        
        if (windowWidth < 768) {
            width = windowWidth - 20;
            height = windowHeight - 20;
        }
        
        return { width, height };
    }

    resize() {
        if (!this.app) return;
        
        const { width, height } = this.getDimensions();
        this.app.renderer.resize(width, height);
        
        if (this.combinaGenerator && this.combinaGenerator.config) {
            this.combinaGenerator.handleResize();
        } else {
            this.showImportScreen();
        }
    }

    start() {
        this.app.ticker.add(() => {});
    }
}