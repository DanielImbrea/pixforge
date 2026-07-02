/** Stack-based flood fill — selects a connected region from a click point. */
export function floodFillRegion(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  tolerance: number
): Uint8Array {
  const selected = new Uint8Array(width * height);
  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return selected;

  const idx = (x: number, y: number) => (y * width + x) * 4;
  const seed = idx(sx, sy);
  const sr = pixels[seed];
  const sg = pixels[seed + 1];
  const sb = pixels[seed + 2];
  const toleranceSq = tolerance * tolerance;

  const matches = (x: number, y: number) => {
    const i = idx(x, y);
    const dr = pixels[i] - sr;
    const dg = pixels[i + 1] - sg;
    const db = pixels[i + 2] - sb;
    return dr * dr + dg * dg + db * db <= toleranceSq;
  };

  const visited = new Uint8Array(width * height);
  const stack: [number, number][] = [[sx, sy]];

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const vi = y * width + x;
    if (visited[vi] || !matches(x, y)) continue;
    visited[vi] = 1;
    selected[vi] = 1;
    if (x > 0) stack.push([x - 1, y]);
    if (x < width - 1) stack.push([x + 1, y]);
    if (y > 0) stack.push([x, y - 1]);
    if (y < height - 1) stack.push([x, y + 1]);
  }

  return selected;
}

export { applyRegionToMask as applyFloodFillToCanvas } from '@/lib/tools/object-remove-mask';
