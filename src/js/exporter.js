export class FractalExporter {
    constructor(renderer) {
        this.renderer = renderer;
    }

    async exportJPEG(width, height, quality = 0.95, filename = 'fractal.jpg') {
        // Create an off-screen canvas for high-resolution rendering
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;

        // Temporarily switch the renderer's canvas
        const originalCanvas = this.renderer.canvas;
        const originalCtx = this.renderer.ctx;
        
        this.renderer.canvas = exportCanvas;
        this.renderer.ctx = exportCanvas.getContext('2d', { willReadFrequently: true });

        // Render at high resolution
        console.log(`Rendering at ${width}x${height}...`);
        await this.renderer.renderAsync(width, height, (progress) => {
            console.log(`Progress: ${progress.toFixed(1)}%`);
        });

        // Convert to JPEG blob
        const blob = await new Promise((resolve) => {
            exportCanvas.toBlob(resolve, 'image/jpeg', quality);
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        // Clean up
        URL.revokeObjectURL(url);
        
        // Restore original canvas
        this.renderer.canvas = originalCanvas;
        this.renderer.ctx = originalCtx;

        console.log('Export complete!');
        return blob;
    }

    generateFilename() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const fractalType = this.renderer.fractalType;
        const palette = this.renderer.colorPalette.paletteName;
        return `fractal_${fractalType}_${palette}_${timestamp}.jpg`;
    }
}
