/** Binary mask morphology — shared by browser SAM post-process and server inpaint prep. */

export interface MaskMorphGrid {
  data: Uint8Array;
  width: number;
  height: number;
}

export function samAlphaToBinary(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = 96
): MaskMorphGrid {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      data[y * width + x] = rgba[si + 3] > threshold ? 1 : 0;
    }
  }
  return { data, width, height };
}

export function rgbMaskToBinary(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = 128
): MaskMorphGrid {
  const data = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    data[i] = rgba[i * 4] > threshold ? 1 : 0;
  }
  return { data, width, height };
}

export function dilateBinary(mask: MaskMorphGrid, radius: number): MaskMorphGrid {
  if (radius <= 0) return mask;
  const { width, height, data } = mask;
  const out = new Uint8Array(data.length);
  const r = Math.max(1, Math.round(radius));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let on = 0;
      for (let dy = -r; dy <= r && !on; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          if (dx * dx + dy * dy > r * r) continue;
          if (data[ny * width + nx]) {
            on = 1;
            break;
          }
        }
      }
      out[y * width + x] = on;
    }
  }
  return { data: out, width, height };
}

export function erodeBinary(mask: MaskMorphGrid, radius: number): MaskMorphGrid {
  if (radius <= 0) return mask;
  const { width, height, data } = mask;
  const out = new Uint8Array(data.length);
  const r = Math.max(1, Math.round(radius));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!data[i]) continue;
      let keep = 1;
      outer: for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) {
          keep = 0;
          break;
        }
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width || dx * dx + dy * dy > r * r) continue;
          if (!data[ny * width + nx]) {
            keep = 0;
            break outer;
          }
        }
      }
      out[i] = keep;
    }
  }
  return { data: out, width, height };
}

export function closeBinary(mask: MaskMorphGrid, radius: number): MaskMorphGrid {
  return erodeBinary(dilateBinary(mask, radius), radius);
}

/** Flood-fill background from image border; remaining background pixels are holes → fill. */
export function fillHolesBinary(mask: MaskMorphGrid): MaskMorphGrid {
  const { width, height, data } = mask;
  const outside = new Uint8Array(data.length);
  const queue: number[] = [];

  const enqueue = (x: number, y: number) => {
    const i = y * width + x;
    if (outside[i] || data[i]) return;
    outside[i] = 1;
    queue.push(i);
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const i = queue.pop()!;
    const x = i % width;
    const y = (i / width) | 0;
    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] || !outside[i] ? 1 : 0;
  }
  return { data: out, width, height };
}

export function labelComponents(mask: MaskMorphGrid): Int32Array {
  const { width, height, data } = mask;
  const labels = new Int32Array(data.length);
  let next = 1;

  for (let i = 0; i < data.length; i++) {
    if (!data[i] || labels[i] !== 0) continue;
    const stack = [i];
    labels[i] = next;
    while (stack.length > 0) {
      const ci = stack.pop()!;
      const x = ci % width;
      const y = (ci / width) | 0;
      const neighbors = [
        x > 0 ? ci - 1 : -1,
        x < width - 1 ? ci + 1 : -1,
        y > 0 ? ci - width : -1,
        y < height - 1 ? ci + width : -1,
      ];
      for (const ni of neighbors) {
        if (ni < 0 || !data[ni] || labels[ni] !== 0) continue;
        labels[ni] = next;
        stack.push(ni);
      }
    }
    next += 1;
  }
  return labels;
}

export function keepComponentAtPoint(mask: MaskMorphGrid, x: number, y: number): MaskMorphGrid {
  const { width, height, data } = mask;
  const px = Math.max(0, Math.min(width - 1, Math.round(x)));
  const py = Math.max(0, Math.min(height - 1, Math.round(y)));
  const start = py * width + px;

  if (!data[start]) {
    return { data: new Uint8Array(data.length), width, height };
  }

  const labels = labelComponents(mask);
  const target = labels[start];
  if (target === 0) {
    return { data: new Uint8Array(data.length), width, height };
  }

  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = labels[i] === target ? 1 : 0;
  }
  return { data: out, width, height };
}

export function removeSmallComponents(mask: MaskMorphGrid, minArea: number): MaskMorphGrid {
  const { width, height, data } = mask;
  const labels = labelComponents(mask);
  const counts = new Map<number, number>();

  for (let i = 0; i < data.length; i++) {
    const label = labels[i];
    if (label === 0) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const label = labels[i];
    if (label === 0) continue;
    if ((counts.get(label) ?? 0) >= minArea) out[i] = 1;
  }
  return { data: out, width, height };
}

export function countBinaryPixels(mask: MaskMorphGrid): number {
  let n = 0;
  for (let i = 0; i < mask.data.length; i++) {
    if (mask.data[i]) n += 1;
  }
  return n;
}

export function binaryToImageData(mask: MaskMorphGrid): ImageData {
  const { width, height, data } = mask;
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i++) {
    const pi = i * 4;
    const on = data[i] ? 255 : 0;
    rgba[pi] = 0;
    rgba[pi + 1] = 0;
    rgba[pi + 2] = 0;
    rgba[pi + 3] = on;
  }
  return new ImageData(rgba, width, height);
}

export function binaryToGreyRaw(mask: MaskMorphGrid): Uint8Array {
  const raw = new Uint8Array(mask.data.length);
  for (let i = 0; i < mask.data.length; i++) {
    raw[i] = mask.data[i] ? 255 : 0;
  }
  return raw;
}

/** Simple box blur on 0–255 mask values for feathering (server or client). */
export function blurGreyMask(raw: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  if (radius <= 0) return raw;
  const r = Math.max(1, Math.round(radius));
  const out = new Uint8Array(raw.length);
  const diameter = r * 2 + 1;
  const norm = 1 / (diameter * diameter);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let dy = -r; dy <= r; dy++) {
        const ny = Math.max(0, Math.min(height - 1, y + dy));
        for (let dx = -r; dx <= r; dx++) {
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          sum += raw[ny * width + nx];
        }
      }
      out[y * width + x] = Math.round(sum * norm);
    }
  }
  return out;
}
