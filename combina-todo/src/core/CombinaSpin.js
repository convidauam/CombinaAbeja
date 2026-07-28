import * as PIXI from 'pixi.js';

export class CombinaSpin {
    constructor(generator) {
        this.generator = generator;
        this.spinConfig = {
            spinTime: 2800,
            maxSpeed: 95,
            spacing: 90,
            spinDelay: [],
            decelerationCurve: 0.28,
            initialAcceleration: 0.22,
            winEffectDuration: 1400
        };
        this.winEffects = [];
        this.sparkles = [];
        
        this.generator.slots.forEach((_, idx) => {
            this.spinConfig.spinDelay[idx] = idx * 180;
        });
    }

    async spin() {
        if (this.generator.isSpinning) return;
        
        this.generator.isSpinning = true;
        this.generator.spinStartTime = Date.now();
        
        this.showSpinningMessage();
        this.createWinEffects();
        this.createSparkles();
        
        this.generator.slots.forEach((slot, index) => {
            if (slot.parts.length === 0) return;
            
            slot.spinning = true;
            slot.finalIndex = Math.floor(Math.random() * slot.parts.length);
            slot.spinSpeed = this.spinConfig.maxSpeed;
            slot.targetPosition = slot.finalIndex * this.spinConfig.spacing;
            slot.startPosition = slot.position || 0;
        });
        
        if (this.generator.ui) {
            this.generator.ui.updateCylinderLights(true);
        }
        
        await this.animateSpin();
        
        this.generator.isSpinning = false;
        this.updateCurrentCombination();
        this.generator.updateResultDisplay();
        this.showWinEffects();
        this.triggerWinCelebration();
    }

    showSpinningMessage() {
        if (this.generator.resultSprite) {
            this.generator.resultSprite.destroy();
        }
        
        if (this.generator.resultContainer.children) {
            for (let i = this.generator.resultContainer.children.length - 1; i >= 3; i--) {
                const child = this.generator.resultContainer.children[i];
                if (child !== this.generator.resultContainer.children[0] && 
                    child !== this.generator.resultContainer.children[1] && 
                    child !== this.generator.resultContainer.children[2]) {
                    child.destroy();
                }
            }
        }
        
        const container = new PIXI.Container();
        const spinningMsg = new PIXI.Text('GIRANDO...', {
            fontFamily: 'Arial', fontSize: 16, fill: 0xffd93d, fontWeight: 'bold'
        });
        spinningMsg.x = (this.generator.resultContainer.width - spinningMsg.width) / 2;
        spinningMsg.y = (this.generator.resultContainer.height - spinningMsg.height) / 2 - 10;
        container.addChild(spinningMsg);
        
        const barBg = new PIXI.Graphics();
        barBg.beginFill(0x22222b);
        barBg.drawRoundedRect(20, 55, 160, 5, 2);
        barBg.endFill();
        container.addChild(barBg);
        
        const bar = new PIXI.Graphics();
        bar.beginFill(0xffd93d);
        bar.drawRoundedRect(20, 55, 0, 5, 2);
        bar.endFill();
        container.addChild(bar);
        
        this.loadingBar = bar;
        this.loadingBarTarget = 160;
        this.generator.resultContainer.addChild(container);
        this.generator.resultSprite = container;
    }

    async animateSpin() {
        const startTime = Date.now();
        const baseDuration = this.spinConfig.spinTime;
        
        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                let allFinished = true;
                
                this.generator.slots.forEach((slot, index) => {
                    const slotDelay = this.spinConfig.spinDelay[index] || 0;
                    const totalSlotDuration = baseDuration;
                    
                    if (!slot.spinning) return;
                    
                    allFinished = false;
                    const slotElapsed = Math.max(0, elapsed - slotDelay);
                    const slotProgress = Math.min(1, slotElapsed / totalSlotDuration);
                    
                    if (slotProgress <= 0) {
                        slot.spinSpeed = 0;
                    } else if (slotProgress < 0.15) {
                        const t = slotProgress / 0.15;
                        slot.spinSpeed = this.spinConfig.maxSpeed * (t * t);
                    } else if (slotProgress < 0.65) {
                        slot.spinSpeed = this.spinConfig.maxSpeed;
                    } else {
                        const t = (slotProgress - 0.65) / 0.35;
                        const easeOut = 1 - Math.pow(1 - t, 3);
                        slot.spinSpeed = this.spinConfig.maxSpeed * (1 - easeOut);
                    }
                    
                    const maxPosition = slot.parts.length * this.spinConfig.spacing;
                    slot.position += Math.max(0.5, slot.spinSpeed);
                    slot.position %= maxPosition;
                    
                    if (slotProgress > 0.88) {
                        const remaining = (slot.targetPosition - slot.position + maxPosition) % maxPosition;
                        if (remaining < slot.spinSpeed * 1.5 || slotElapsed >= totalSlotDuration) {
                            slot.spinning = false;
                            slot.position = slot.targetPosition;
                            slot.spinSpeed = 0;
                            this.createStopGlow(index);
                            this.createSparkleBurst(index);
                        }
                    }
                    
                    if (this.generator.slotViews[index]) {
                        const intensity = slot.spinning ? Math.min(1, slot.spinSpeed / this.spinConfig.maxSpeed) : 0;
                        this.generator.slotViews[index].updateParts(
                            slot.parts,
                            slot.position,
                            { spinning: slot.spinning, spinSpeed: slot.spinSpeed, finalIndex: slot.finalIndex, glowIntensity: intensity }
                        );
                    }
                });
                
                if (this.loadingBar && elapsed < baseDuration) {
                    const progress = Math.min(1, elapsed / baseDuration);
                    this.loadingBar.clear();
                    this.loadingBar.beginFill(0xffd93d);
                    this.loadingBar.drawRoundedRect(20, 55, progress * this.loadingBarTarget, 5, 2);
                    this.loadingBar.endFill();
                }
                
                this.updateSparkles();
                
                if (allFinished) {
                    this.generator.slots.forEach((slot, index) => {
                        if (this.generator.slotViews[index]) {
                            this.generator.slotViews[index].updateParts(
                                slot.parts,
                                slot.finalIndex * this.spinConfig.spacing,
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

    createSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 10; i++) {
            const sparkle = new PIXI.Graphics();
            sparkle.beginFill(0xffd93d, 0.5);
            sparkle.drawCircle(0, 0, 2);
            sparkle.endFill();
            sparkle.x = Math.random() * this.generator.app.screen.width;
            sparkle.y = Math.random() * this.generator.app.screen.height;
            sparkle.alpha = 0;
            this.generator.app.stage.addChild(sparkle);
            this.sparkles.push({ sprite: sparkle, life: 0, maxLife: 60 + Math.random() * 60 });
        }
    }

    updateSparkles() {
        this.sparkles.forEach(s => {
            s.life++;
            const progress = s.life / s.maxLife;
            if (progress < 1) {
                s.sprite.alpha = Math.sin(progress * Math.PI) * 0.5;
            } else {
                s.life = 0;
                s.sprite.x = Math.random() * this.generator.app.screen.width;
                s.sprite.y = Math.random() * this.generator.app.screen.height;
            }
        });
    }

    createWinEffects() {
        const colors = [0xffd93d, 0xff6b6b, 0x4ecdc4, 0x00e676];
        for (let i = 0; i < 40; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(colors[i % colors.length]);
            particle.drawRect(-3, -3, 6, 4);
            particle.endFill();
            particle.alpha = 0;
            particle.x = this.generator.app.screen.width / 2;
            particle.y = this.generator.app.screen.height / 2 - 80;
            this.generator.app.stage.addChild(particle);
            this.winEffects.push({
                sprite: particle, vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 12 - 4, life: 0, maxLife: 90, gravity: 0.16
            });
        }
    }

    showWinEffects() {
        this.winEffects.forEach(e => { e.life = e.maxLife; e.sprite.alpha = 0.9; });
        this.animateWinEffects();
    }

    animateWinEffects() {
        const animate = () => {
            let alive = false;
            this.winEffects.forEach(e => {
                if (e.life > 0) {
                    alive = true; e.life--;
                    e.sprite.x += e.vx; e.sprite.y += e.vy; e.vy += e.gravity;
                    e.sprite.alpha = e.life / e.maxLife;
                } else { e.sprite.alpha = 0; }
            });
            if (alive) requestAnimationFrame(animate);
        };
        animate();
    }

    triggerWinCelebration() {
        const flash = new PIXI.Graphics();
        flash.beginFill(0xffd93d, 0.12);
        flash.drawRect(0, 0, this.generator.app.screen.width, this.generator.app.screen.height);
        flash.endFill();
        this.generator.app.stage.addChild(flash);
        
        let alpha = 0.12;
        const fadeOut = () => {
            alpha -= 0.015;
            flash.alpha = alpha;
            if (alpha > 0) { requestAnimationFrame(fadeOut); }
            else { if (flash.parent) flash.parent.removeChild(flash); flash.destroy(); }
        };
        setTimeout(fadeOut, 80);
    }

    createStopGlow(index) {
        const slotView = this.generator.slotViews[index];
        if (!slotView) return;
        
        const glow = new PIXI.Graphics();
        glow.beginFill(0xffd93d, 0.25);
        glow.drawRect(0, 0, slotView.width, slotView.height);
        glow.endFill();
        slotView.container.addChild(glow);
        
        let alpha = 0.25;
        const fade = () => {
            alpha -= 0.02; glow.alpha = alpha;
            if (alpha > 0) requestAnimationFrame(fade);
            else { if (glow.parent) glow.parent.removeChild(glow); glow.destroy(); }
        };
        fade();
    }

    createSparkleBurst(index) {
        const slotView = this.generator.slotViews[index];
        if (!slotView) return;
        const cx = slotView.width / 2;
        const cy = slotView.height / 2;
        
        for (let i = 0; i < 6; i++) {
            const spark = new PIXI.Graphics();
            spark.beginFill(0xffd93d, 0.8);
            spark.drawCircle(0, 0, 2);
            spark.endFill();
            spark.x = cx; spark.y = cy;
            slotView.container.addChild(spark);
            
            const angle = (i / 6) * Math.PI * 2;
            let life = 20;
            const animate = () => {
                life--; spark.x += Math.cos(angle) * 3; spark.y += Math.sin(angle) * 3;
                spark.alpha = life / 20;
                if (life > 0) requestAnimationFrame(animate);
                else { if (spark.parent) spark.parent.removeChild(spark); spark.destroy(); }
            };
            animate();
        }
    }

    updateCurrentCombination() {
        this.generator.currentCombination = [];
        this.generator.slots.forEach((slot, index) => {
            if (slot.parts.length > 0 && slot.finalIndex !== null) {
                const finalIdx = Math.min(slot.finalIndex, slot.parts.length - 1);
                this.generator.currentCombination[index] = finalIdx;
            } else {
                this.generator.currentCombination[index] = null;
            }
        });
    }
}