// Newton Fractal: z(n+1) = z(n) - relaxation * f(z)/f'(z)
// Using f(z) = z^degree - 1

export function calculateNewton(
  zx,
  zy,
  maxIterations,
  degree = 3,
  relaxation = 1.0
) {
  let iteration = 0;
  const tolerance = 0.0001;

  while (iteration < maxIterations) {
    // f(z) = z^degree - 1
    // f'(z) = degree * z^(degree-1)

    const r = Math.sqrt(zx * zx + zy * zy);
    const theta = Math.atan2(zy, zx);

    // Calculate z^degree
    const rDegree = Math.pow(r, degree);
    const thetaDegree = theta * degree;
    const fx = rDegree * Math.cos(thetaDegree) - zx;
    const fy = rDegree * Math.sin(thetaDegree) - zy;

    // Calculate degree * z^(degree-1)
    const rDerivative = degree * Math.pow(r, degree - 1);
    const thetaDerivative = theta * (degree - 1);
    const dx = rDerivative * Math.cos(thetaDerivative);
    const dy = rDerivative * Math.sin(thetaDerivative);

    // Avoid division by zero
    const denominator = dx * dx + dy * dy;
    if (denominator < tolerance) {
      return { iteration, smoothValue: 0 };
    }

    // Newton iteration with relaxation: z = z - relaxation * f(z)/f'(z)
    const newZx = zx - (relaxation * (fx * dx + fy * dy)) / denominator;
    const newZy = zy - (relaxation * (fy * dx - fx * dy)) / denominator;

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
    range: 3,
  },
};
