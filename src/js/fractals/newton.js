// Newton Fractal: z(n+1) = z(n) - f(z)/f'(z)
// Using f(z) = z^3 - 1

export function calculateNewton(zx, zy, maxIterations) {
    let iteration = 0;
    const tolerance = 0.0001;

    while (iteration < maxIterations) {
        // f(z) = z^3 - 1
        const zx2 = zx * zx;
        const zy2 = zy * zy;
        const zx3 = zx * (zx2 - 3 * zy2);
        const zy3 = zy * (3 * zx2 - zy2);

        // f'(z) = 3z^2
        const dx = 3 * (zx2 - zy2);
        const dy = 6 * zx * zy;

        // Avoid division by zero
        const denominator = dx * dx + dy * dy;
        if (denominator < tolerance) {
            return { iteration, smoothValue: 0 };
        }

        // Newton iteration: z = z - f(z)/f'(z)
        const fx = zx3 - zx;
        const fy = zy3 - zy;

        const newZx = zx - (fx * dx + fy * dy) / denominator;
        const newZy = zy - (fy * dx - fx * dy) / denominator;

        // Check convergence
        const diffx = newZx - zx;
        const diffy = newZy - zy;
        const diff = Math.sqrt(diffx * diffx + diffy * diffy);

        if (diff < tolerance) {
            // Color based on which root we converged to
            const angle = Math.atan2(newZy, newZx);
            const smoothValue = (angle + Math.PI) / (2 * Math.PI);
            return { iteration, smoothValue };
        }

        zx = newZx;
        zy = newZy;
        iteration++;
    }

    return { iteration: maxIterations, smoothValue: 0 };
}

export const newtonConfig = {
    name: 'Newton Fractal',
    defaultView: {
        centerX: 0,
        centerY: 0,
        range: 3
    }
};
