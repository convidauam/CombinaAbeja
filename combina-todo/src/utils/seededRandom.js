export class SeededRandom {
    constructor(seed = null) {
        this.seed = seed || Date.now();
    }

    random() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    randomColor(baseColor, variation = 0.3) {
        const r = parseInt(baseColor.substr(1,2), 16);
        const g = parseInt(baseColor.substr(3,2), 16);
        const b = parseInt(baseColor.substr(5,2), 16);
        
        const newR = Math.min(255, Math.max(0, r + (this.random() - 0.5) * 255 * variation));
        const newG = Math.min(255, Math.max(0, g + (this.random() - 0.5) * 255 * variation));
        const newB = Math.min(255, Math.max(0, b + (this.random() - 0.5) * 255 * variation));
        
        return `#${Math.floor(newR).toString(16).padStart(2,'0')}${Math.floor(newG).toString(16).padStart(2,'0')}${Math.floor(newB).toString(16).padStart(2,'0')}`;
    }
}