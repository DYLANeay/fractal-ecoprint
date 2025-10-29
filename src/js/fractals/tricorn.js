// Tricorn (Mandelbar) Fractal: z(n+1) = conj(z(n))^power + c

export function calculateTricorn(cx, cy, maxIterations, power = 2, bailout = 2) {
    let zx = 0;
    let zy = 0;
    let iteration = 0;
    const bailoutSquared = bailout * bailout;

    while (iteration < maxIterations) {
        const zx2 = zx * zx;
        const zy2 = zy * zy;
        const magnitude = zx2 + zy2;

        // Check if point has escaped
        if (magnitude > bailoutSquared) {
            // Calculate smooth coloring value
            const smoothValue = Math.log2(Math.log2(magnitude) / Math.log2(bailout));
            return { iteration, smoothValue };
        }

        if (power === 2) {
            // Standard Tricorn: z = conj(z)^2 + c (conjugate: flip imaginary part)
            const xtemp = zx2 - zy2 + cx;
            zy = -2 * zx * zy + cy;  // Note the negative sign
            zx = xtemp;
        } else {
            // Generalized: z = conj(z)^power + c
            const r = Math.sqrt(magnitude);
            const theta = Math.atan2(-zy, zx);  // Conjugate
            const newR = Math.pow(r, power);
            const newTheta = theta * power;
            zx = newR * Math.cos(newTheta) + cx;
            zy = newR * Math.sin(newTheta) + cy;
        }

        iteration++;
    }

    return { iteration: maxIterations, smoothValue: 0 };
}

export const tricornConfig = {
    name: 'Tricorn (Mandelbar)',
    defaultView: {
        centerX: -0.5,
        centerY: 0,
        range: 3.5
    }
};
