import sharp from 'sharp';

function buildWatermarkSvg(tileWidth: number, tileHeight: number): string {
  return `
<svg width="${tileWidth}" height="${tileHeight}" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="50%"
    font-family="Arial, sans-serif"
    font-size="20"
    fill="rgba(255,255,255,0.35)"
    stroke="rgba(0,0,0,0.25)"
    stroke-width="0.5"
    text-anchor="middle"
    dominant-baseline="middle"
    transform="rotate(-30 ${tileWidth / 2} ${tileHeight / 2})"
  >PixiqueAi</text>
</svg>`.trim();
}

export async function applyWatermark(buffer: Buffer, mimeType: string): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  const tileWidth = Math.max(160, Math.floor(width / 3));
  const tileHeight = Math.max(100, Math.floor(height / 4));
  const watermarkSvg = buildWatermarkSvg(tileWidth, tileHeight);
  const watermarkBuffer = Buffer.from(watermarkSvg);

  const composited = await image
    .composite([
      {
        input: watermarkBuffer,
        tile: true,
        blend: 'over',
      },
    ])
    .toBuffer();

  if (mimeType === 'image/png') {
    return sharp(composited).png().toBuffer();
  }
  if (mimeType === 'image/webp') {
    return sharp(composited).webp({ quality: 85 }).toBuffer();
  }
  return sharp(composited).jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
}
