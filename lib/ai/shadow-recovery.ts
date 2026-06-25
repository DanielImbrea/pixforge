import sharp from 'sharp';

function sampleCornerBrightness(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  cornerSize: number
): number {
  const samples: number[] = [];
  const regions = [
    { x0: 0, y0: 0 },
    { x0: Math.max(0, width - cornerSize), y0: 0 },
    { x0: 0, y0: Math.max(0, height - cornerSize) },
    { x0: Math.max(0, width - cornerSize), y0: Math.max(0, height - cornerSize) },
  ];

  for (const { x0, y0 } of regions) {
    for (let y = y0; y < Math.min(height, y0 + cornerSize); y++) {
      for (let x = x0; x < Math.min(width, x0 + cornerSize); x++) {
        const i = (y * width + x) * channels;
        const r = data[i] ?? 0;
        const g = data[i + 1] ?? 0;
        const b = data[i + 2] ?? 0;
        samples.push((r + g + b) / 3);
      }
    }
  }

  if (samples.length === 0) return 240;
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)] ?? 240;
}

function isNearSubject(
  alphaGrid: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  radius: number
): boolean {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (alphaGrid[ny * width + nx] > 128) return true;
    }
  }
  return false;
}

/**
 * Re-composites soft drop shadows from the original photo onto a transparent cutout.
 * Best for product shots on white/light backgrounds.
 */
export async function applyShadowRecovery(
  originalBuffer: Buffer,
  cutoutBuffer: Buffer
): Promise<Buffer> {
  const cutoutMeta = await sharp(cutoutBuffer).metadata();
  const width = cutoutMeta.width ?? 0;
  const height = cutoutMeta.height ?? 0;
  if (width === 0 || height === 0) {
    return cutoutBuffer;
  }

  const originalRgb = await sharp(originalBuffer)
    .resize(width, height, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer();

  const { data: cutoutData, info } = await sharp(cutoutBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  if (channels < 4) {
    return cutoutBuffer;
  }

  const output = Buffer.from(cutoutData);
  const alphaGrid = new Uint8Array(width * height);
  const cornerSize = Math.max(8, Math.round(Math.min(width, height) * 0.06));
  const bgBrightness = sampleCornerBrightness(originalRgb, width, height, 3, cornerSize);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = output[(y * width + x) * channels + 3] ?? 0;
      alphaGrid[y * width + x] = alpha;
      if (alpha > 128) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return cutoutBuffer;
  }

  const padX = Math.round(width * 0.1);
  const padBelow = Math.round(height * 0.18);
  const proximityRadius = Math.max(3, Math.round(Math.min(width, height) * 0.015));
  const zoneMinX = Math.max(0, minX - padX);
  const zoneMaxX = Math.min(width - 1, maxX + padX);
  const zoneMinY = Math.max(0, minY);
  const zoneMaxY = Math.min(height - 1, maxY + padBelow);

  for (let y = zoneMinY; y <= zoneMaxY; y++) {
    for (let x = zoneMinX; x <= zoneMaxX; x++) {
      const i = (y * width + x) * channels;
      const existingAlpha = output[i + 3] ?? 0;
      if (existingAlpha > 40) continue;
      if (!isNearSubject(alphaGrid, width, height, x, y, proximityRadius)) continue;

      const oi = (y * width + x) * 3;
      const r = originalRgb[oi] ?? 0;
      const g = originalRgb[oi + 1] ?? 0;
      const b = originalRgb[oi + 2] ?? 0;
      const brightness = (r + g + b) / 3;
      const shadowDelta = bgBrightness - brightness;

      if (shadowDelta < 10 || shadowDelta > 130) continue;

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;
      if (saturation > 0.4) continue;

      let weight = y > maxY ? Math.max(0.35, 1 - (y - maxY) / padBelow) : 0.45;

      const shadowAlpha = Math.round(Math.min(165, shadowDelta * 1.6 * weight));
      if (shadowAlpha < 18) continue;

      const gray = Math.round(brightness * 0.9);
      output[i] = gray;
      output[i + 1] = gray;
      output[i + 2] = gray;
      output[i + 3] = Math.max(existingAlpha, shadowAlpha);
    }
  }

  return sharp(output, {
    raw: { width, height, channels },
  })
    .png({ compressionLevel: 8, adaptiveFiltering: true })
    .toBuffer();
}
