export class FractalExporter {
  constructor(renderer) {
    this.renderer = renderer;
  }

  async exportImage(width, height, options = {}) {
    const {
      format = "jpeg",
      quality = 0.95,
      filename = null,
      transparentBackground = false,
      progressCallback = null,
    } = options;

    // Create an off-screen canvas for high-resolution rendering
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = width;
    exportCanvas.height = height;

    // Temporarily switch the renderer's canvas
    const originalCanvas = this.renderer.canvas;
    const originalCtx = this.renderer.ctx;

    this.renderer.canvas = exportCanvas;
    this.renderer.ctx = exportCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    // Render at high resolution using chunked rendering for better performance
    console.log(`Rendering at ${width}x${height}...`);
    await this.renderChunked(
      width,
      height,
      transparentBackground,
      progressCallback,
    );

    // Determine MIME type
    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const ext = format === "png" ? "png" : "jpg";

    // Generate filename if not provided
    const finalFilename = filename || this.generateFilename(ext);

    // Convert to blob
    const blob = await new Promise((resolve) => {
      if (format === "png") {
        exportCanvas.toBlob(resolve, mimeType);
      } else {
        exportCanvas.toBlob(resolve, mimeType, quality);
      }
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = finalFilename;
    link.click();

    // Clean up
    URL.revokeObjectURL(url);

    // Restore original canvas
    this.renderer.canvas = originalCanvas;
    this.renderer.ctx = originalCtx;

    console.log("Export complete!");
    return blob;
  }

  async renderChunked(
    width,
    height,
    transparentBackground = false,
    progressCallback = null,
  ) {
    // Use chunked rendering to prevent UI blocking
    const chunkHeight = 100; // Render 100 rows at a time
    const totalChunks = Math.ceil(height / chunkHeight);

    const imageData = this.renderer.ctx.createImageData(width, height);
    const data = imageData.data;

    // Track alpha based on color brightness for transparent export
    // We'll compute this after effects are applied for glow-aware transparency
    const iterationData = transparentBackground
      ? new Float32Array(width * height)
      : null;

    for (let chunk = 0; chunk < totalChunks; chunk++) {
      const startY = chunk * chunkHeight;
      const endY = Math.min(startY + chunkHeight, height);

      // Render this chunk
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          for (let py = startY; py < endY; py++) {
            for (let px = 0; px < width; px++) {
              let color;
              let iteration = 0;

              if (
                this.renderer.antialiasing &&
                this.renderer.supersampleLevel > 1
              ) {
                // Supersampling for anti-aliasing
                const VisualEffects = this.renderer.effects.constructor;

                // Get center point iteration for transparency tracking
                if (transparentBackground) {
                  const { x: cx, y: cy } = this.renderer.pixelToComplex(
                    px,
                    py,
                    width,
                    height,
                  );
                  const result = this.renderer.calculatePoint(cx, cy);
                  iteration = result.iteration;
                }

                color = VisualEffects.supersample(
                  (x, y) => {
                    const { x: cx, y: cy } = this.renderer.pixelToComplex(
                      x,
                      y,
                      width,
                      height,
                    );
                    const { iteration, smoothValue } =
                      this.renderer.calculatePoint(cx, cy);
                    return this.renderer.colorPalette.getSmoothColor(
                      iteration,
                      this.renderer.maxIterations,
                      smoothValue,
                    );
                  },
                  px,
                  py,
                  width,
                  height,
                  this.renderer.supersampleLevel,
                );
              } else {
                // Regular rendering
                const { x: cx, y: cy } = this.renderer.pixelToComplex(
                  px,
                  py,
                  width,
                  height,
                );
                const result = this.renderer.calculatePoint(cx, cy);
                iteration = result.iteration;
                color = this.renderer.colorPalette.getSmoothColor(
                  result.iteration,
                  this.renderer.maxIterations,
                  result.smoothValue,
                );
              }

              const index = (py * width + px) * 4;
              data[index] = color.r;
              data[index + 1] = color.g;
              data[index + 2] = color.b;
              data[index + 3] = 255; // Set opaque initially

              // Store iteration for transparency calculation
              if (transparentBackground) {
                iterationData[py * width + px] = iteration;
              }
            }
          }
          resolve();
        });
      });

      // Report progress
      if (progressCallback) {
        const progress = ((chunk + 1) / totalChunks) * 80; // 80% for rendering
        progressCallback(progress);
      }

      // Small delay to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Apply post-processing effects (glow, vignette, etc.)
    this.renderer.effects.applyEffects(imageData, width, height, false);

    if (progressCallback) {
      progressCallback(90);
    }

    // Apply transparency after effects - this way glow bleeds into transparent areas nicely
    if (transparentBackground) {
      this.applyTransparencyWithGlow(data, iterationData, width, height);
    }

    if (progressCallback) {
      progressCallback(100);
    }

    this.renderer.ctx.putImageData(imageData, 0, 0);
  }

  // Apply transparency based on pixel brightness, preserving glow effect
  applyTransparencyWithGlow(data, iterationData, width, height) {
    const maxIter = this.renderer.maxIterations;

    for (let i = 0; i < iterationData.length; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Calculate pixel brightness (luminance)
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

      // Check if this pixel is inside the set (would be black without glow)
      const isInsideSet = iterationData[i] >= maxIter;

      if (isInsideSet) {
        // Inside the set - use brightness to determine alpha
        // This allows glow from nearby colored pixels to show
        // but pure black areas become transparent
        const alpha = Math.min(255, Math.round(brightness * 255 * 3));
        data[idx + 3] = alpha;
      } else {
        // Outside the set - keep opaque (this is the colorful fractal)
        data[idx + 3] = 255;
      }
    }

    // Optional: Smooth the alpha channel edges for better blending
    this.smoothAlphaEdges(data, width, height);
  }

  // Smooth alpha channel edges for cleaner transparency
  smoothAlphaEdges(data, width, height) {
    const alphaBuffer = new Uint8Array(width * height);

    // Extract alpha channel
    for (let i = 0; i < width * height; i++) {
      alphaBuffer[i] = data[i * 4 + 3];
    }

    // Apply a small blur to alpha edges only
    const radius = 1;
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = y * width + x;
        const currentAlpha = alphaBuffer[idx];

        // Only smooth edge pixels (not fully opaque or fully transparent)
        if (currentAlpha > 0 && currentAlpha < 255) {
          let sum = 0;
          let count = 0;

          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nidx = (y + dy) * width + (x + dx);
              sum += alphaBuffer[nidx];
              count++;
            }
          }

          data[idx * 4 + 3] = Math.round(sum / count);
        }
      }
    }
  }

  async exportJPEG(width, height, quality = 0.95, filename = null) {
    return this.exportImage(width, height, {
      format: "jpeg",
      quality,
      filename,
      transparentBackground: false,
    });
  }

  async exportPNG(
    width,
    height,
    transparentBackground = false,
    filename = null,
    progressCallback = null,
  ) {
    return this.exportImage(width, height, {
      format: "png",
      transparentBackground,
      filename,
      progressCallback,
    });
  }

  generateFilename(extension = "jpg") {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const fractalType = this.renderer.fractalType;
    const palette = this.renderer.colorPalette.paletteName;
    return `fractal_${fractalType}_${palette}_${timestamp}.${extension}`;
  }
}
