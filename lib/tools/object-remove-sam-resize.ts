/** Resize a miniSAM mask (often 256×256) to the editor/image resolution. */
export function resizeSamMaskToImage(
  samMask: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  if (samMask.width === targetWidth && samMask.height === targetHeight) {
    return samMask;
  }

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = samMask.width;
  sourceCanvas.height = samMask.height;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return samMask;
  sourceCtx.putImageData(samMask, 0, 0);

  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetWidth;
  targetCanvas.height = targetHeight;
  const targetCtx = targetCanvas.getContext('2d');
  if (!targetCtx) return samMask;

  targetCtx.imageSmoothingEnabled = false;
  targetCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
  return targetCtx.getImageData(0, 0, targetWidth, targetHeight);
}
