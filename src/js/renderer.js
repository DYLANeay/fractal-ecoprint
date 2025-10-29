import { calculateMandelbrot } from './fractals/mandelbrot.js';
import { calculateJulia } from './fractals/julia.js';
import { calculateBurningShip } from './fractals/burning-ship.js';
import { calculateTricorn } from './fractals/tricorn.js';
import { calculateNewton } from './fractals/newton.js';

export class FractalRenderer {
    constructor(canvas, colorPalette) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
        this.colorPalette = colorPalette;
        
        // Default view
        this.centerX = -0.5;
        this.centerY = 0;
        this.range = 3.5;
        this.maxIterations = 100;
        
        // Fractal settings
        this.fractalType = 'mandelbrot';
        this.juliaC = { real: -0.7, imag: 0.27015 };
        
        // Fractal parameters
        this.mandelbrotParams = { power: 2, bailout: 2 };
        this.burningShipParams = { power: 2, rotation: 0 };
        this.tricornParams = { power: 2, bailout: 2 };
        this.newtonParams = { degree: 3, relaxation: 1.0 };
    }

    setView(centerX, centerY, range) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.range = range;
    }

    setMaxIterations(iterations) {
        this.maxIterations = iterations;
    }

    setFractalType(type) {
        this.fractalType = type;
    }

    setJuliaC(real, imag) {
        this.juliaC = { real, imag };
    }

    setMandelbrotParams(power, bailout) {
        this.mandelbrotParams = { power, bailout };
    }

    setBurningShipParams(power, rotation) {
        this.burningShipParams = { power, rotation };
    }

    setTricornParams(power, bailout) {
        this.tricornParams = { power, bailout };
    }

    setNewtonParams(degree, relaxation) {
        this.newtonParams = { degree, relaxation };
    }

    // Map pixel coordinates to complex plane
    pixelToComplex(px, py, width, height) {
        const aspectRatio = width / height;
        const x = this.centerX + (px - width / 2) * (this.range / width);
        const y = this.centerY + (py - height / 2) * (this.range / height);
        return { x, y };
    }

    calculatePoint(cx, cy) {
        switch (this.fractalType) {
            case 'mandelbrot':
                return calculateMandelbrot(
                    cx, cy, this.maxIterations,
                    this.mandelbrotParams.power,
                    this.mandelbrotParams.bailout
                );
            case 'julia':
                return calculateJulia(cx, cy, this.juliaC.real, this.juliaC.imag, this.maxIterations);
            case 'burning-ship':
                return calculateBurningShip(
                    cx, cy, this.maxIterations,
                    this.burningShipParams.power,
                    this.burningShipParams.rotation
                );
            case 'tricorn':
                return calculateTricorn(
                    cx, cy, this.maxIterations,
                    this.tricornParams.power,
                    this.tricornParams.bailout
                );
            case 'newton':
                return calculateNewton(
                    cx, cy, this.maxIterations,
                    this.newtonParams.degree,
                    this.newtonParams.relaxation
                );
            default:
                return calculateMandelbrot(cx, cy, this.maxIterations);
        }
    }

    render(width = this.canvas.width, height = this.canvas.height, progressCallback = null) {
        // Set canvas size if different
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }

        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;

        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const { x: cx, y: cy } = this.pixelToComplex(px, py, width, height);
                const { iteration, smoothValue } = this.calculatePoint(cx, cy);

                const color = this.colorPalette.getSmoothColor(iteration, this.maxIterations, smoothValue);

                const index = (py * width + px) * 4;
                data[index] = color.r;
                data[index + 1] = color.g;
                data[index + 2] = color.b;
                data[index + 3] = 255; // Alpha
            }

            // Report progress
            if (progressCallback && py % 10 === 0) {
                progressCallback((py / height) * 100);
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
        
        if (progressCallback) {
            progressCallback(100);
        }
    }

    async renderAsync(width = this.canvas.width, height = this.canvas.height, progressCallback = null) {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.render(width, height, progressCallback);
                resolve();
            }, 10);
        });
    }
}
