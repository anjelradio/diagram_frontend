export type AuroraRidgeSample = {
  x: number;
  y: number;
  depth: number;
};

const TAU = Math.PI * 2;
export const AURORA_HORIZONTAL_PHASE_SPEED = 0.9; // 60% faster than the previous 0.5625.

// Unevenly spaced crests and a soft second harmonic make narrower peaks without
// turning the silhouette into a jagged or perfectly repeating border.
export function sampleAuroraRidge(
  x: number,
  width: number,
  height: number,
  timeSeconds: number,
  seed: number,
): AuroraRidgeSample {
  const u = x / Math.max(width, 1);
  const depth = 0.5 + 0.5 * Math.sin(timeSeconds * 0.9 + seed * 0.7);
  const parallax = Math.sin(timeSeconds * 0.55 + seed + u * TAU * 0.7);
  const warpedU = u + 0.018 * Math.sin(u * TAU * 1.3 + seed + timeSeconds * 0.2);
  const phase = warpedU * TAU * 3.8 + seed * 0.65 + timeSeconds * AURORA_HORIZONTAL_PHASE_SPEED;
  const wave = Math.sin(phase) + 0.22 * Math.sin(phase * 2 - 0.75);
  const irregularity = 0.9 + 0.14 * Math.sin(u * TAU * 1.15 + seed + 2.9 - timeSeconds * 0.18);
  const smallFold = Math.sin(u * TAU * 8.2 - seed * 0.4 - timeSeconds * 0.27);

  return {
    x,
    y: height * (
      0.48 + depth * 0.08 + wave * irregularity * (0.06 + depth * 0.055) +
      smallFold * 0.01 + parallax * 0.014 + (u - 0.5) * 0.05
    ),
    depth,
  };
}

