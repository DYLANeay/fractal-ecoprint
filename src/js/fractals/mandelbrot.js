// Mandelbrot Set: z(n+1) = z(n)^2 + c

export function calculateMandelbrot(cx, cy, maxIterations) {
    let zx = 0;
    let zy = 0;
    let iteration = 0;

    while (iteration < maxIterations) {
        const zx2 = zx * zx;
        const zy2 = zy * zy;

        // Check if point has escaped (|z| > 2)
        if (zx2 + zy2 > 4) {
            // Calculate smooth coloring value
            const smoothValue = Math.log2(Math.log2(zx2 + zy2));
            return { iteration, smoothValue };
        }

        // z = z^2 + c
        const xtemp = zx2 - zy2 + cx;
        zy = 2 * zx * zy + cy;
        zx = xtemp;

        iteration++;
    }

    return { iteration: maxIterations, smoothValue: 0 };
}

export const mandelbrotConfig = {
    name: 'Mandelbrot Set',
    defaultView: {
        centerX: -0.5,
        centerY: 0,
        range: 3.5
    }
};
