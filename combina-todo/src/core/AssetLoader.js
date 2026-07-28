export class AssetLoader {
    constructor() {
        this.cache = new Map();
    }

    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(file.name || file, img);
                resolve(img);
            };
            img.onerror = reject;
            
            if (file instanceof File) {
                const url = URL.createObjectURL(file);
                img.src = url;
                img._blobUrl = url;
            } else {
                img.src = file;
            }
        });
    }

    async loadImagesFromFolder(files) {
        const images = [];
        const validFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );
        
        for (const file of validFiles) {
            try {
                const img = await this.loadImage(file);
                
                // Guardar la imagen original sin convertir a pixel art
                const originalCanvas = document.createElement('canvas');
                originalCanvas.width = img.width;
                originalCanvas.height = img.height;
                const originalCtx = originalCanvas.getContext('2d');
                originalCtx.drawImage(img, 0, 0);
                
                images.push({
                    id: Date.now() + Math.random(),
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    originalFile: file,
                    originalImageElement: img,
                    originalImageData: originalCanvas.toDataURL('image/png'),
                    originalWidth: img.width,
                    originalHeight: img.height,
                    // Mantener para compatibilidad
                    pixels: [],
                    baseColor: '#888888'
                });
                console.log(`Cargada imagen original: ${file.name} (${img.width}x${img.height})`);
            } catch (error) {
                console.error(`Error cargando ${file.name}:`, error);
            }
        }
        
        return images;
    }

    async getImageBlob(variant) {
        if (variant.originalFile instanceof File) {
            return variant.originalFile;
        }
        
        if (variant.originalImageData && variant.originalImageData.startsWith('data:')) {
            return this.dataURLToBlob(variant.originalImageData);
        }
        
        if (variant.originalImageElement && variant.originalImageElement.src) {
            const response = await fetch(variant.originalImageElement.src);
            return await response.blob();
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

    clearCache() {
        this.cache.clear();
    }
}