// Visual effects and post-processing for fractal rendering

export class VisualEffects {
  constructor() {
    this.settings = {
      glow: false,
      glowIntensity: 0.3,
      glowRadius: 3,
      vignette: false,
      vignetteStrength: 0.4,
      grain: false,
      grainAmount: 0.02,
      vibrance: 1.2,
      contrast: 1.1,
      saturation: 1.3,
    };
  }

  applyEffects(imageData, width, height, preserveAlpha = false) {
    let data = new Uint8ClampedArray(imageData.data);

    // Store original alpha values if we need to preserve them
    let originalAlpha = null;
    if (preserveAlpha) {
      originalAlpha = new Uint8Array(width * height);
      for (let i = 0; i < width * height; i++) {
        originalAlpha[i] = imageData.data[i * 4 + 3];
      }
    }

    // Apply effects in order
    if (this.settings.vibrance > 1.0 || this.settings.saturation !== 1.0) {
      data = this.applyColorEnhancement(data, width, height);
    }

    if (this.settings.glow) {
      data = this.applyGlow(data, width, height);
    }

    if (this.settings.vignette) {
      data = this.applyVignette(data, width, height);
    }

    if (this.settings.grain) {
      data = this.applyGrain(data, width, height);
    }

    // Copy back to imageData
    for (let i = 0; i < imageData.data.length; i++) {
      imageData.data[i] = data[i];
    }

    // Restore original alpha values if preserved
    if (preserveAlpha && originalAlpha) {
      for (let i = 0; i < originalAlpha.length; i++) {
        imageData.data[i * 4 + 3] = originalAlpha[i];
      }
    }

    return imageData;
  }

  applyColorEnhancement(data, width, height) {
    const result = new Uint8ClampedArray(data);

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Calculate luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Apply vibrance (affects less saturated colors more)
      const max = Math.max(r, g, b);
      const avg = (r + g + b) / 3;
      const amt = ((Math.abs(max - avg) * 2.0) / 255.0) * (1.0 / 3.0);
      const sat = 1.0 - amt;

      const vibranceAmount = (1.0 - this.settings.vibrance) * sat;

      r = r + (lum - r) * vibranceAmount;
      g = g + (lum - g) * vibranceAmount;
      b = b + (lum - b) * vibranceAmount;

      // Apply saturation
      r = lum + (r - lum) * this.settings.saturation;
      g = lum + (g - lum) * this.settings.saturation;
      b = lum + (b - lum) * this.settings.saturation;

      // Apply contrast
      r = ((r / 255.0 - 0.5) * this.settings.contrast + 0.5) * 255.0;
      g = ((g / 255.0 - 0.5) * this.settings.contrast + 0.5) * 255.0;
      b = ((b / 255.0 - 0.5) * this.settings.contrast + 0.5) * 255.0;

      result[i] = Math.max(0, Math.min(255, r));
      result[i + 1] = Math.max(0, Math.min(255, g));
      result[i + 2] = Math.max(0, Math.min(255, b));
    }

    return result;
  }

  applyGlow(data, width, height) {
    const result = new Uint8ClampedArray(data);
    const temp = new Uint8ClampedArray(data);

    // Simple box blur for glow effect
    const radius = this.settings.glowRadius;
    const intensity = this.settings.glowIntensity;

    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;
        let count = 0;

        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < width) {
            const idx = (y * width + nx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }

        const idx = (y * width + x) * 4;
        temp[idx] = r / count;
        temp[idx + 1] = g / count;
        temp[idx + 2] = b / count;
        temp[idx + 3] = data[idx + 3];
      }
    }

    // Vertical pass and blend
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;
        let count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny >= 0 && ny < height) {
            const idx = (ny * width + x) * 4;
            r += temp[idx];
            g += temp[idx + 1];
            b += temp[idx + 2];
            count++;
          }
        }

        const idx = (y * width + x) * 4;
        const blurR = r / count;
        const blurG = g / count;
        const blurB = b / count;

        // Blend original with glow
        result[idx] = Math.min(255, data[idx] + blurR * intensity);
        result[idx + 1] = Math.min(255, data[idx + 1] + blurG * intensity);
        result[idx + 2] = Math.min(255, data[idx + 2] + blurB * intensity);
      }
    }

    return result;
  }

  applyVignette(data, width, height) {
    const result = new Uint8ClampedArray(data);
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const vignette =
          1.0 - (dist / maxDist) * this.settings.vignetteStrength;

        const idx = (y * width + x) * 4;
        result[idx] = data[idx] * vignette;
        result[idx + 1] = data[idx + 1] * vignette;
        result[idx + 2] = data[idx + 2] * vignette;
        result[idx + 3] = data[idx + 3];
      }
    }

    return result;
  }

  applyGrain(data, width, height) {
    const result = new Uint8ClampedArray(data);

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * this.settings.grainAmount * 255;

      result[i] = Math.max(0, Math.min(255, data[i] + noise));
      result[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      result[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      result[i + 3] = data[i + 3];
    }

    return result;
  }

  // Supersampling anti-aliasing
  static supersample(calculatePixelColor, x, y, width, height, samples = 2) {
    let r = 0,
      g = 0,
      b = 0;
    const step = 1.0 / samples;

    for (let sy = 0; sy < samples; sy++) {
      for (let sx = 0; sx < samples; sx++) {
        const offsetX = (sx + 0.5) * step - 0.5;
        const offsetY = (sy + 0.5) * step - 0.5;

        const color = calculatePixelColor(x + offsetX, y + offsetY);
        r += color.r;
        g += color.g;
        b += color.b;
      }
    }

    const totalSamples = samples * samples;
    return {
      r: Math.round(r / totalSamples),
      g: Math.round(g / totalSamples),
      b: Math.round(b / totalSamples),
    };
  }

  setGlow(enabled, intensity = 0.3, radius = 3) {
    this.settings.glow = enabled;
    this.settings.glowIntensity = intensity;
    this.settings.glowRadius = radius;
  }

  setVignette(enabled, strength = 0.4) {
    this.settings.vignette = enabled;
    this.settings.vignetteStrength = strength;
  }

  setGrain(enabled, amount = 0.02) {
    this.settings.grain = enabled;
    this.settings.grainAmount = amount;
  }

  setColorEnhancement(vibrance = 1.2, saturation = 1.3, contrast = 1.1) {
    this.settings.vibrance = vibrance;
    this.settings.saturation = saturation;
    this.settings.contrast = contrast;
  }
}
