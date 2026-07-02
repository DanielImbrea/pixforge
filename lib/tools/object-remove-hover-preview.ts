/** Canva-style hover preview colors (purple fill + cyan outline). */
export const HOVER_PREVIEW_FILL = { r: 147, g: 51, b: 234, a: 110 };
export const HOVER_PREVIEW_OUTLINE = { r: 34, g: 211, b: 238, a: 255 };

export const HOVER_DEBOUNCE_MS = 100;
export const HOVER_CELL_SIZE = 28;
export const HOVER_CONFIRM_DISTANCE_PX = 48;
export const HOVER_MASK_OVERLAP_SKIP = 0.95;

export function hoverCellKey(x: number, y: number, cellSize = HOVER_CELL_SIZE): string {
  return `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
}

/** IoU-style overlap on alpha masks (0–1). */
export function maskAlphaOverlapRatio(a: ImageData, b: ImageData): number {
  if (a.width !== b.width || a.height !== b.height) return 0;
  let intersection = 0;
  let union = 0;
  for (let i = 3; i < a.data.length; i += 4) {
    const onA = a.data[i] > 128;
    const onB = b.data[i] > 128;
    if (onA && onB) intersection += 1;
    if (onA || onB) union += 1;
  }
  return union === 0 ? 1 : intersection / union;
}

export function isNearHoverPoint(
  a: { x: number; y: number },
  b: { x: number; y: number },
  maxDistance = HOVER_CONFIRM_DISTANCE_PX
): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy <= maxDistance * maxDistance;
}
