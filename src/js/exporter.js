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

    // Track which pixels should be transparent (background/outside the fractal)
    const alphaData = transparentBackground
      ? new Uint8Array(width * height)
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
              let isInsideSet = false;

              if (
                this.renderer.antialiasing &&
                this.renderer.supersampleLevel > 1
              ) {
                // Supersampling for anti-aliasing
                const VisualEffects = this.renderer.effects.constructor;

                // For transparency, we need to check the center point
                if (transparentBackground) {
                  const { x: cx, y: cy } = this.renderer.pixelToComplex(
                    px,
                    py,
                    width,
                    height,
                  );
                  const { iteration } = this.renderer.calculatePoint(cx, cy);
                  isInsideSet = iteration >= this.renderer.maxIterations;
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
                const { iteration, smoothValue } = this.renderer.calculatePoint(
                  cx,
                  cy,
                );
                isInsideSet = iteration >= this.renderer.maxIterations;
                color = this.renderer.colorPalette.getSmoothColor(
                  iteration,
                  this.renderer.maxIterations,
                  smoothValue,
                );
              }

              const index = (py * width + px) * 4;
              data[index] = color.r;
              data[index + 1] = color.g;
              data[index + 2] = color.b;
              data[index + 3] = 255; // Set opaque initially

              // Track transparency: the fractal SET (inside, black) should be OPAQUE
              // The background (outside, colored) should be TRANSPARENT for PNG
              if (transparentBackground) {
                // isInsideSet = true means we're inside the fractal (the black part)
                // We want to keep the fractal visible, make background transparent
                alphaData[py * width + px] = isInsideSet ? 255 : 0;
              }
            }
          }
          resolve();
        });
      });

      // Report progress
      if (progressCallback) {
        const progress = ((chunk + 1) / totalChunks) * 100;
        progressCallback(progress);
      }

      // Small delay to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Apply post-processing effects (this may modify colors but we preserve alpha separately)
    this.renderer.effects.applyEffects(
      imageData,
      width,
      height,
      transparentBackground,
    );

    // Apply transparency after effects if needed
    if (transparentBackground && alphaData) {
      for (let i = 0; i < alphaData.length; i++) {
        data[i * 4 + 3] = alphaData[i];
      }
    }

    this.renderer.ctx.putImageData(imageData, 0, 0);
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
