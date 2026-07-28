// utils/imageLoader.js
export class ImageLoader {
    constructor() {
        this.cache = new Map();
        this.targetSize = 16; // Tamaño uniforme para todas las partes
    }

    async loadImage(path) {
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(path, img);
                resolve(img);
            };
            img.onerror = (error) => {
                console.error(`Error cargando imagen: ${path}`, error);
                reject(error);
            };
            img.src = path;
        });
    }

    imageToPixelData(image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // MISMO TAMAÑO para todas las partes
        canvas.width = this.targetSize;
        canvas.height = this.targetSize;
        
        // Configurar para pixel art (sin suavizado)
        ctx.imageSmoothingEnabled = false;
        
        // Dibujar imagen ocupando TODO el canvas
        ctx.drawImage(image, 0, 0, this.targetSize, this.targetSize);
        
        // Obtener datos de píxeles
        const imageData = ctx.getImageData(0, 0, this.targetSize, this.targetSize);
        const pixels = [];
        const colorMap = new Map();
        
        // Escanear todos los píxeles
        for (let y = 0; y < this.targetSize; y++) {
            for (let x = 0; x < this.targetSize; x++) {
                const index = (y * this.targetSize + x) * 4;
                const r = imageData.data[index];
                const g = imageData.data[index + 1];
                const b = imageData.data[index + 2];
                const a = imageData.data[index + 3];
                
                // Incluir píxeles no transparentes (incluyendo negro)
                if (a > 128) {
                    const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                    
                    const key = `${x},${y}`;
                    if (!colorMap.has(key)) {
                        colorMap.set(key, true);
                        pixels.push({ x, y, color });
                    }
                }
            }
        }
        
        return pixels;
    }

    async loadAllSpecies(basePath = '/especies') {
        console.log('🔄 Cargando todas las especies...');
        
        const species = [
            'StelisLouise', 'AbejaDeLaOrquídea', 'AgapostemonAngelicus',
            'ApisMellifera', 'CalliopsisAndreniformis', 'CollettesThoracicns',
            'DastpodaArgentata', 'DieunomiaHeteropoda', 'FideliaPallidula',
            'MacropisNuda', 'MegachileRotundata', 'ProtandrenaMexicanorum',
            'XeromelissaRozeni', 'XylocopaVirginica'
        ];

        const allParts = {
            heads: [],
            thoraxes: [],
            abdomens: []
        };

        for (const speciesName of species) {
            try {
                console.log(`📂 Cargando: ${speciesName}`);
                
                // Cargar las tres partes con el MISMO procesamiento
                const [headImg, thoraxImg, abdomenImg] = await Promise.allSettled([
                    this.loadImage(`${basePath}/${speciesName}/Cabeza.png`),
                    this.loadImage(`${basePath}/${speciesName}/Torax.png`),
                    this.loadImage(`${basePath}/${speciesName}/Abdomen.png`)
                ]);

                // Procesar cabeza (MISMO método que tórax)
                if (headImg.status === 'fulfilled') {
                    const pixels = this.imageToPixelData(headImg.value);
                    const baseColor = this.getDominantColor(pixels);
                    
                    allParts.heads.push({
                        type: 'head',
                        name: this.formatSpeciesName(speciesName),
                        species: speciesName,
                        baseColor: baseColor,
                        pixels: pixels,
                        imagePath: `${basePath}/${speciesName}/Cabeza.png`,
                        size: this.targetSize
                    });
                    console.log(`✅ Cabeza: ${speciesName} (${pixels.length} píxeles)`);
                }

                // Procesar tórax
                if (thoraxImg.status === 'fulfilled') {
                    const pixels = this.imageToPixelData(thoraxImg.value);
                    const baseColor = this.getDominantColor(pixels);
                    
                    allParts.thoraxes.push({
                        type: 'thorax',
                        name: this.formatSpeciesName(speciesName),
                        species: speciesName,
                        baseColor: baseColor,
                        pixels: pixels,
                        imagePath: `${basePath}/${speciesName}/Torax.png`,
                        size: this.targetSize
                    });
                    console.log(`✅ Tórax: ${speciesName} (${pixels.length} píxeles)`);
                }

                // Procesar abdomen
                if (abdomenImg.status === 'fulfilled') {
                    const pixels = this.imageToPixelData(abdomenImg.value);
                    const baseColor = this.getDominantColor(pixels);
                    
                    allParts.abdomens.push({
                        type: 'abdomen',
                        name: this.formatSpeciesName(speciesName),
                        species: speciesName,
                        baseColor: baseColor,
                        pixels: pixels,
                        imagePath: `${basePath}/${speciesName}/Abdomen.png`,
                        size: this.targetSize
                    });
                    console.log(`✅ Abdomen: ${speciesName} (${pixels.length} píxeles)`);
                }

            } catch (error) {
                console.error(`❌ Error con ${speciesName}:`, error);
            }
        }

        // Verificar que todas las partes tengan el mismo tamaño
        console.log('📊 Resumen final:', {
            cabezas: allParts.heads.length,
            torax: allParts.thoraxes.length,
            abdomens: allParts.abdomens.length,
            tamañoPíxeles: this.targetSize
        });

        return allParts;
    }

    formatSpeciesName(speciesName) {
        return speciesName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/_/g, ' ')
            .trim();
    }

    getDominantColor(pixels) {
        if (pixels.length === 0) return '#888888';
        
        const colorCount = new Map();
        pixels.forEach(pixel => {
            if (pixel.color) {
                colorCount.set(pixel.color, (colorCount.get(pixel.color) || 0) + 1);
            }
        });
        
        let maxCount = 0;
        let dominantColor = pixels[0].color || '#888888';
        
        colorCount.forEach((count, color) => {
            if (count > maxCount) {
                maxCount = count;
                dominantColor = color;
            }
        });
        
        return dominantColor;
    }
}