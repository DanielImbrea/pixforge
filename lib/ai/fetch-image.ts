import { fileTypeFromBuffer } from 'file-type';

export async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const headerMime = res.headers.get('content-type')?.split(';')[0]?.trim();
  const mimeType = detected?.mime || headerMime || 'image/png';
  return { buffer, mimeType };
}

/** @deprecated Use fetchImageBuffer */
export async function fetchAsBuffer(url: string): Promise<Buffer> {
  const { buffer } = await fetchImageBuffer(url);
  return buffer;
}
