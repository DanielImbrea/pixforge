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

export function applyFloodFillToCanvas(
  maskCtx: CanvasRenderingContext2D,
  overlayCtx: CanvasRenderingContext2D,
  region: Uint8Array,
  width: number,
  height: number,
  subtract = false
) {
  const maskData = maskCtx.getImageData(0, 0, width, height);
  const overlayData = overlayCtx.getImageData(0, 0, width, height);

  for (let i = 0; i < region.length; i++) {
    if (!region[i]) continue;
    const pi = i * 4;
    if (subtract) {
      maskData.data[pi] = 0;
      maskData.data[pi + 1] = 0;
      maskData.data[pi + 2] = 0;
      maskData.data[pi + 3] = 255;
      overlayData.data[pi + 3] = 0;
    } else {
      maskData.data[pi] = 255;
      maskData.data[pi + 1] = 255;
      maskData.data[pi + 2] = 255;
      maskData.data[pi + 3] = 255;
      overlayData.data[pi] = 239;
      overlayData.data[pi + 1] = 68;
      overlayData.data[pi + 2] = 68;
      overlayData.data[pi + 3] = 115;
    }
  }

  maskCtx.putImageData(maskData, 0, 0);
  overlayCtx.putImageData(overlayData, 0, 0);
}
