import { ColorPalette } from './colorPalette.js';
import { FractalRenderer } from './renderer.js';
import { FractalExporter } from './exporter.js';
import { mandelbrotConfig } from './fractals/mandelbrot.js';
import { juliaConfig } from './fractals/julia.js';
import { burningShipConfig } from './fractals/burning-ship.js';
import { tricornConfig } from './fractals/tricorn.js';
import { newtonConfig } from './fractals/newton.js';

class FractalApp {
    constructor() {
        this.canvas = document.getElementById('fractal-canvas');
        this.colorPalette = new ColorPalette('rainbow');
        this.renderer = new FractalRenderer(this.canvas, this.colorPalette);
        this.exporter = new FractalExporter(this.renderer);
        
        // Set initial canvas size
        this.resizeCanvas();
        
        // Initialize UI
        this.initializeUI();
        this.initializeInteraction();
        
        // Initial render
        this.renderFractal();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = container.clientWidth - 40;
        const maxHeight = 600;
        const aspectRatio = 16 / 9;
        
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }

    initializeUI() {
        // Fractal selector
        document.getElementById('fractal-select').addEventListener('change', (e) => {
            this.renderer.setFractalType(e.target.value);
            this.updateDefaultView(e.target.value);
            
            // Show/hide Julia parameters
            const juliaParams = document.getElementById('julia-params');
            juliaParams.style.display = e.target.value === 'julia' ? 'block' : 'none';
            
            this.renderFractal();
        });

        // Julia parameters
        document.getElementById('julia-real').addEventListener('change', (e) => {
            this.renderer.setJuliaC(parseFloat(e.target.value), this.renderer.juliaC.imag);
            this.renderFractal();
        });

        document.getElementById('julia-imag').addEventListener('change', (e) => {
            this.renderer.setJuliaC(this.renderer.juliaC.real, parseFloat(e.target.value));
            this.renderFractal();
        });

        // Max iterations
        document.getElementById('max-iterations').addEventListener('change', (e) => {
            this.renderer.setMaxIterations(parseInt(e.target.value));
            this.renderFractal();
        });

        // Zoom level
        document.getElementById('zoom-level').addEventListener('change', (e) => {
            const zoom = parseFloat(e.target.value);
            this.renderer.range = 3.5 / zoom;
            this.renderFractal();
        });

        // Reset view
        document.getElementById('reset-view').addEventListener('click', () => {
            this.updateDefaultView(this.renderer.fractalType);
            document.getElementById('zoom-level').value = 1;
            this.renderFractal();
        });

        // Color palettes
        document.querySelectorAll('.palette-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.palette-option').forEach(opt => 
                    opt.classList.remove('active'));
                option.classList.add('active');
                
                const paletteName = option.dataset.palette;
                this.colorPalette.setPalette(paletteName);
                this.renderFractal();
            });
        });

        // Export size selector
        document.getElementById('export-size').addEventListener('change', (e) => {
            const customSize = document.getElementById('custom-size');
            customSize.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });

        // JPEG quality slider
        const qualitySlider = document.getElementById('jpeg-quality');
        const qualityValue = document.getElementById('quality-value');
        qualitySlider.addEventListener('input', (e) => {
            qualityValue.textContent = Math.round(e.target.value * 100) + '%';
        });

        // Render button
        document.getElementById('render-btn').addEventListener('click', () => {
            this.renderFractal();
        });

        // Export button
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportFractal();
        });
    }

    initializeInteraction() {
        let isDragging = false;
        let lastX, lastY;

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;

            const pixelToComplexScale = this.renderer.range / this.canvas.width;
            this.renderer.centerX -= dx * pixelToComplexScale;
            this.renderer.centerY -= dy * pixelToComplexScale;

            lastX = e.clientX;
            lastY = e.clientY;

            this.renderFractal();
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Zoom with scroll
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
            this.renderer.range *= zoomFactor;
            
            // Update zoom level input
            const zoomLevel = 3.5 / this.renderer.range;
            document.getElementById('zoom-level').value = zoomLevel.toFixed(2);
            
            this.renderFractal();
        });
    }

    updateDefaultView(fractalType) {
        const configs = {
            mandelbrot: mandelbrotConfig,
            julia: juliaConfig,
            'burning-ship': burningShipConfig,
            tricorn: tricornConfig,
            newton: newtonConfig
        };

        const config = configs[fractalType];
        if (config) {
            this.renderer.setView(config.defaultView.centerX, config.defaultView.centerY, config.defaultView.range);
        }
    }

    async renderFractal() {
        const loading = document.getElementById('loading');
        loading.style.display = 'block';

        await this.renderer.renderAsync(this.canvas.width, this.canvas.height);

        loading.style.display = 'none';
    }

    async exportFractal() {
        const sizeSelect = document.getElementById('export-size').value;
        const quality = parseFloat(document.getElementById('jpeg-quality').value);
        
        let width, height;
        
        if (sizeSelect === 'custom') {
            width = parseInt(document.getElementById('custom-width').value);
            height = parseInt(document.getElementById('custom-height').value);
        } else {
            [width, height] = sizeSelect.split('x').map(Number);
        }

        const loading = document.getElementById('loading');
        loading.style.display = 'block';
        loading.textContent = 'Exporting high-quality image...';

        try {
            const filename = this.exporter.generateFilename();
            await this.exporter.exportJPEG(width, height, quality, filename);
            alert('Export successful! Check your downloads folder.');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            loading.style.display = 'none';
            loading.textContent = 'Rendering...';
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FractalApp();
});
