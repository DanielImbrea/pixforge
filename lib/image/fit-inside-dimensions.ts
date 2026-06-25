export function computeFitInsideDimensions(
  inputWidth: number,
  inputHeight: number,
  targetWidth?: number,
  targetHeight?: number
): { width: number; height: number } {
  if (!targetWidth && !targetHeight) {
    return { width: inputWidth, height: inputHeight };
  }

  const ratio = inputWidth / inputHeight;

  if (targetWidth && targetHeight) {
    const widthScale = targetWidth / inputWidth;
    const heightScale = targetHeight / inputHeight;
    const scale = Math.min(widthScale, heightScale);
    return {
      width: Math.max(1, Math.round(inputWidth * scale)),
      height: Math.max(1, Math.round(inputHeight * scale)),
    };
  }

  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: Math.max(1, Math.round(targetWidth / ratio)),
    };
  }

  if (!targetWidth && targetHeight) {
    return {
      width: Math.max(1, Math.round(targetHeight * ratio)),
      height: targetHeight,
    };
  }

  return { width: inputWidth, height: inputHeight };
}
