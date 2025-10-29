// Burning Ship Fractal: z(n+1) = (|Re(z)| + i|Im(z)|)^power + c

export function calculateBurningShip(
  cx,
  cy,
  maxIterations,
  power = 2,
  rotation = 0
) {
  let zx = 0;
  let zy = 0;
  let iteration = 0;

  // Convert rotation to radians
  const rotRad = (rotation * Math.PI) / 180;
  const cosRot = Math.cos(rotRad);
  const sinRot = Math.sin(rotRad);

  while (iteration < maxIterations) {
    const zx2 = zx * zx;
    const zy2 = zy * zy;

    // Check if point has escaped (|z| > 2)
    if (zx2 + zy2 > 4) {
      // Calculate smooth coloring value
      const smoothValue = Math.log2(Math.log2(zx2 + zy2));
      return { iteration, smoothValue };
    }

    if (power === 2) {
      // Standard Burning Ship: z = (|Re(z)| + i|Im(z)|)^2 + c
      const absZx = Math.abs(zx);
      const absZy = Math.abs(zy);
      const xtemp = absZx * absZx - absZy * absZy + cx;
      zy = 2 * absZx * absZy + cy;
      zx = xtemp;
    } else {
      // Generalized with power
      const absZx = Math.abs(zx);
      const absZy = Math.abs(zy);
      const r = Math.sqrt(absZx * absZx + absZy * absZy);
      const theta = Math.atan2(absZy, absZx);
      const newR = Math.pow(r, power);
      const newTheta = theta * power;
      zx = newR * Math.cos(newTheta) + cx;
      zy = newR * Math.sin(newTheta) + cy;
    }

    // Apply rotation
    if (rotation !== 0) {
      const tempX = zx * cosRot - zy * sinRot;
      const tempY = zx * sinRot + zy * cosRot;
      zx = tempX;
      zy = tempY;
    }

    iteration++;
  }

  return { iteration: maxIterations, smoothValue: 0 };
}

export const burningShipConfig = {
  name: 'Burning Ship',
  defaultView: {
    centerX: -0.5,
    centerY: -0.5,
    range: 3,
  },
};
