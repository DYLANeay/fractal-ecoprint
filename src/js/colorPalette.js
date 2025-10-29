// Color Palette System with smooth gradients

export const palettes = {
    sunset: [
        { r: 26, g: 26, b: 46 },
        { r: 22, g: 33, b: 62 },
        { r: 15, g: 52, b: 96 },
        { r: 83, g: 52, b: 131 },
        { r: 233, g: 69, b: 96 },
        { r: 255, g: 107, b: 107 }
    ],
    ocean: [
        { r: 0, g: 4, b: 40 },
        { r: 0, g: 78, b: 146 },
        { r: 30, g: 60, b: 114 },
        { r: 42, g: 82, b: 152 },
        { r: 116, g: 235, b: 213 },
        { r: 172, g: 182, b: 229 }
    ],
    forest: [
        { r: 10, g: 61, b: 12 },
        { r: 30, g: 95, b: 31 },
        { r: 45, g: 134, b: 48 },
        { r: 92, g: 184, b: 92 },
        { r: 139, g: 195, b: 74 },
        { r: 205, g: 220, b: 57 }
    ],
    fire: [
        { r: 0, g: 0, b: 0 },
        { r: 61, g: 0, b: 0 },
        { r: 139, g: 0, b: 0 },
        { r: 255, g: 69, b: 0 },
        { r: 255, g: 165, b: 0 },
        { r: 255, g: 255, b: 0 }
    ],
    rainbow: [
        { r: 255, g: 0, b: 0 },
        { r: 255, g: 127, b: 0 },
        { r: 255, g: 255, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 },
        { r: 75, g: 0, b: 130 },
        { r: 148, g: 0, b: 211 }
    ],
    grayscale: [
        { r: 0, g: 0, b: 0 },
        { r: 26, g: 26, b: 26 },
        { r: 77, g: 77, b: 77 },
        { r: 128, g: 128, b: 128 },
        { r: 179, g: 179, b: 179 },
        { r: 255, g: 255, b: 255 }
    ]
};

export class ColorPalette {
    constructor(paletteName = 'rainbow') {
        this.setPalette(paletteName);
    }

    setPalette(paletteName) {
        this.palette = palettes[paletteName] || palettes.rainbow;
        this.paletteName = paletteName;
    }

    // Linear interpolation between two colors
    lerp(color1, color2, t) {
        return {
            r: Math.round(color1.r + (color2.r - color1.r) * t),
            g: Math.round(color1.g + (color2.g - color1.g) * t),
            b: Math.round(color1.b + (color2.b - color1.b) * t)
        };
    }

    // Get color for a normalized value (0-1)
    getColor(value) {
        if (value <= 0) return this.palette[0];
        if (value >= 1) return this.palette[this.palette.length - 1];

        const scaledValue = value * (this.palette.length - 1);
        const index = Math.floor(scaledValue);
        const t = scaledValue - index;

        if (index >= this.palette.length - 1) {
            return this.palette[this.palette.length - 1];
        }

        return this.lerp(this.palette[index], this.palette[index + 1], t);
    }

    // Get color with smooth coloring for fractals
    getSmoothColor(iterations, maxIterations, smoothValue = 0) {
        if (iterations >= maxIterations) {
            return { r: 0, g: 0, b: 0 }; // Inside the set - black
        }

        // Smooth coloring using the smooth value
        const normalized = (iterations + 1 - smoothValue) / maxIterations;
        return this.getColor(normalized);
    }
}
