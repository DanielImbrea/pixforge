import type { CropParams } from '@/lib/tools/crop-params';

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image for crop.'));
    img.src = src;
  });
}

/** Export a cropped region from a browser image URL as a JPEG File. */
export async function cropImageUrlToFile(
  imageUrl: string,
  crop: Pick<CropParams, 'left' | 'top' | 'width' | 'height'>,
  fileName: string
): Promise<File> {
  const img = await loadImageElement(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not prepare crop canvas.');
  }

  ctx.drawImage(
    img,
    crop.left,
    crop.top,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error('Crop export failed.'))),
      'image/jpeg',
      0.92
    );
  });

  return new File([blob], fileName.replace(/\.\w+$/, '') + '-portrait.jpg', {
    type: 'image/jpeg',
  });
}
