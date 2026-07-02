/** Map pointer position to image pixels when the image uses object-contain inside a container. */
export function getImageFitRect(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  if (containerWidth <= 0 || containerHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight };
  }

  const containerAspect = containerWidth / containerHeight;
  const imageAspect = imageWidth / imageHeight;

  if (imageAspect > containerAspect) {
    const width = containerWidth;
    const height = containerWidth / imageAspect;
    return { x: 0, y: (containerHeight - height) / 2, width, height };
  }

  const height = containerHeight;
  const width = containerHeight * imageAspect;
  return { x: (containerWidth - width) / 2, y: 0, width, height };
}

export function pointerToImageCoords(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  const fit = getImageFitRect(containerRect.width, containerRect.height, imageWidth, imageHeight);
  const localX = clientX - containerRect.left - fit.x;
  const localY = clientY - containerRect.top - fit.y;

  if (fit.width <= 0 || fit.height <= 0) {
    return { x: 0, y: 0 };
  }

  const scaleX = imageWidth / fit.width;
  const scaleY = imageHeight / fit.height;

  return {
    x: Math.max(0, Math.min(imageWidth - 1, localX * scaleX)),
    y: Math.max(0, Math.min(imageHeight - 1, localY * scaleY)),
  };
}

export function imageToDisplayCoords(
  imageX: number,
  imageY: number,
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  const fit = getImageFitRect(containerWidth, containerHeight, imageWidth, imageHeight);
  return {
    x: fit.x + (imageX / imageWidth) * fit.width,
    y: fit.y + (imageY / imageHeight) * fit.height,
  };
}
