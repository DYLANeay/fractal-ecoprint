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

  // Apply transparency: keep fractal boundary + glow, remove outer background
  applyTransparencyWithGlow(data, iterationData, width, height) {
    const maxIter = this.renderer.maxIterations;
    const glowRadius = this.renderer.effects.settings.glowRadius || 3;
    const hasGlow = this.renderer.effects.settings.glow;

    // First pass: create a mask of "interesting" pixels (fractal boundary region)
    // The fractal boundary is where iterations are NOT at max (inside set)
    // and NOT escaping very quickly (far from the fractal)
    const mask = new Float32Array(width * height);

    // Find the iteration threshold - pixels that escape quickly are "background"
    // We want to keep pixels near the fractal boundary
    for (let i = 0; i < iterationData.length; i++) {
      const iteration = iterationData[i];

      if (iteration >= maxIter) {
        // Inside the set (black area) - this IS the fractal, keep it
        mask[i] = 1.0;
      } else {
        // Outside the set - use iteration count to determine if near boundary
        // Low iterations = escaped quickly = far from fractal = background
        // Higher iterations (but not max) = near boundary = keep
        const normalizedIter = iteration / maxIter;
        // Keep pixels that took longer to escape (they're near the boundary)
        // Fade out pixels that escaped quickly
        mask[i] = Math.min(1.0, normalizedIter * 3.0);
      }
    }

    // Second pass: expand the mask to include glow area
    // This ensures glow from the fractal bleeds outward properly
    if (hasGlow) {
      const expandedMask = new Float32Array(mask);
      const expandRadius = Math.max(glowRadius * 2, 5);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (mask[idx] < 0.5) {
            // Check if any nearby pixel is part of the fractal
            let maxNearby = 0;
            for (let dy = -expandRadius; dy <= expandRadius; dy++) {
              for (let dx = -expandRadius; dx <= expandRadius; dx++) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                  const nidx = ny * width + nx;
                  if (mask[nidx] > maxNearby) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const falloff = Math.max(0, 1 - dist / expandRadius);
                    maxNearby = Math.max(maxNearby, mask[nidx] * falloff);
                  }
                }
              }
            }
            expandedMask[idx] = Math.max(mask[idx], maxNearby);
          }
        }
      }

      // Use expanded mask
      for (let i = 0; i < mask.length; i++) {
        mask[i] = expandedMask[i];
      }
    }

    // Third pass: apply alpha based on mask and pixel brightness
    for (let i = 0; i < iterationData.length; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Calculate pixel brightness
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

      // Combine mask with brightness for final alpha
      // This ensures glowing areas (bright pixels near fractal) stay visible
      let alpha = mask[i];

      // Boost alpha for bright pixels (glow effect)
      if (brightness > 0.1) {
        alpha = Math.max(alpha, brightness * mask[i] * 2);
      }

      // For pixels inside the set, use brightness to show glow bleeding in
      if (iterationData[i] >= maxIter) {
        alpha = Math.max(alpha, brightness * 2);
      }

      data[idx + 3] = Math.min(255, Math.round(alpha * 255));
    }

    // Smooth the alpha edges
    this.smoothAlphaEdges(data, width, height, 2);
  }

  // Smooth alpha channel edges for cleaner transparency
  smoothAlphaEdges(data, width, height, radius = 1) {
    const alphaBuffer = new Uint8Array(width * height);

    // Extract alpha channel
    for (let i = 0; i < width * height; i++) {
      alphaBuffer[i] = data[i * 4 + 3];
    }

    // Apply blur to alpha channel for smooth edges
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = y * width + x;
        const currentAlpha = alphaBuffer[idx];

        // Smooth all edge pixels for better blending
        if (currentAlpha > 5 && currentAlpha < 250) {
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
