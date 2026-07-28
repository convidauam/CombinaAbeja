import * as PIXI from 'pixi.js';

export class UILever extends PIXI.Container {
    constructor(x, y, scale = 1.4, onPull) {
        super();
        this.x = x;
        this.y = y;
        this.scale.set(scale);
        this.onPull = onPull;

        this.isPulling = false;
        this.pullProgress = 0; // 0 = arriba, 1 = completamente abajo

        this.eventMode = 'static';
        this.cursor = 'pointer';

        this.createLeverGraphics();
        
        // Registrar eventos de interacción de arrastre/clic
        this.on('pointerdown', this.onPointerDown, this);
    }

    createLeverGraphics() {
            // 1. BASE MECÁNICA REFORZADA (Chasis de acero más ancho y pesado)
            this.base = new PIXI.Graphics();
            // Sombra de la base agrandada
            this.base.beginFill(0x000000, 0.45);
            this.base.drawRect(-22, -20, 48, 50);
            this.base.endFill();
            // Bloque de acero base reforzado
            this.base.beginFill(0x4e545c);
            this.base.drawRoundedRect(-18, -16, 40, 44, 6);
            this.base.endFill();
            // Bisel interno cromado industrial
            this.base.lineStyle(2, 0x95a5a6, 0.85);
            this.base.drawRoundedRect(-15, -13, 34, 38, 4);
            // Eje central de torsión negro más grueso
            this.base.lineStyle(0);
            this.base.beginFill(0x1a1a1a);
            this.base.drawCircle(2, 6, 14);
            this.base.endFill();
            this.addChild(this.base);

            // 2. CONTENEDOR DEL BRAZO MÓVIL
            this.movingPart = new PIXI.Container();
            this.movingPart.x = 2;
            this.movingPart.y = 6;
            this.addChild(this.movingPart);

            // =========================================================================
            // MÁSTIL METÁLICO MUCHO MÁS GRUESO (Antes medía 5px de ancho, ahora mide 12px)
            // =========================================================================
            this.shaft = new PIXI.Graphics();
            // Sombra proyectada del propio mástil
            this.shaft.beginFill(0x000000, 0.3);
            this.shaft.drawRect(-7, -75, 12, 75);
            this.shaft.endFill();
            // Cuerpo principal del mástil de acero grueso
            this.shaft.beginFill(0xbdc3c7);
            this.shaft.drawRect(-6, -75, 12, 75);
            this.shaft.endFill();
            // Reflejo/Brillo metálico central biselado para volumen 3D
            this.shaft.beginFill(0xffffff, 0.75);
            this.shaft.drawRect(-2, -75, 3, 75);
            this.shaft.endFill();
            // Sombra de oclusión en los bordes para redondear el tubo cilíndrico
            this.shaft.beginFill(0x7f8c8d, 0.4);
            this.shaft.drawRect(-6, -75, 2, 75);
            this.shaft.drawRect(4, -75, 2, 75);
            this.shaft.endFill();
            this.movingPart.addChild(this.shaft);

            // =========================================================================
            // Bola de la palanca
            // =========================================================================
            this.knob = new PIXI.Graphics();
            // Sombra base de la gran esfera
            this.knob.beginFill(0x000000, 0.35);
            this.knob.drawCircle(0, -75, 21);
            this.knob.endFill();
            // Esfera roja premium
            this.knob.beginFill(0xc0392b);
            this.knob.drawCircle(0, -75, 20);
            this.knob.endFill();
            // Reflejo de luz esférica superior ampliado para mantener la escala realista
            this.knob.beginFill(0xff7675, 0.85);
            this.knob.drawCircle(-6, -81, 8);
            this.knob.endFill();
            this.knob.beginFill(0xffffff, 0.95);
            this.knob.drawCircle(-8, -84, 3.5);
            this.knob.endFill();
            this.movingPart.addChild(this.knob);
        }

    onPointerDown(e) {
        if (this.isPulling) return;
        this.isPulling = true;
        this.animatePull();
        
        if (this.onPull) this.onPull();
    }

    animatePull() {
        const startTime = Date.now();
        const durationDown = 250;  // Tiempo de bajada (ms)
        const durationUp = 350;    // Tiempo de retorno amortiguado (ms)
        
        const tick = () => {
            const now = Date.now();
            const elapsed = now - startTime;

            if (elapsed < durationDown) {
                // Fase 1: Bajando (Interpolación senoidal suave)
                const t = elapsed / durationDown;
                this.pullProgress = Math.sin(t * Math.PI / 2);
                this.updateLeverTransformation();
                requestAnimationFrame(tick);
            } else if (elapsed < durationDown + durationUp) {
                // Fase 2: Retorno elástico (Efecto resorte de metal hacia arriba)
                const t = (elapsed - durationDown) / durationUp;
                // Ecuación de rebote amortiguado para realismo físico
                const bounce = Math.exp(-t * 5) * Math.cos(t * Math.PI * 2.5);
                this.pullProgress = Math.max(0, bounce);
                this.updateLeverTransformation();
                requestAnimationFrame(tick);
            } else {
                // Estado final de reposo absoluto
                this.isPulling = false;
                this.pullProgress = 0;
                this.updateLeverTransformation();
            }
        };

        requestAnimationFrame(tick);
    }

    updateLeverTransformation() {
        // =========================================================================
        // LÓGICA DE PROYECCIÓN 3D PARA GIRO VERTICAL
        // =========================================================================
        
        // Al jalar, el brazo rota sutilmente hacia abajo y se comprime en el eje Y
        // para dar la ilusión óptica de que está saliendo de la pantalla hacia el usuario.
        const maxScaleY = -0.3; // Invierte y achica el mástil al máximo recorrido hacia el frente
        const currentScaleY = 1.0 - (this.pullProgress * (1.0 - maxScaleY));
        
        this.movingPart.scale.y = currentScaleY;

        // Desplazamiento mecánico complementario de la bola roja hacia abajo
        // Esto acentúa el peso de la física de la palanca.
        this.knob.y = this.pullProgress * 110;

        // Oscurecer ligeramente el mástil cuando está abajo para simular que entra en su propia sombra
        this.shaft.alpha = 1.0 - (this.pullProgress * 0.25);
    }
}