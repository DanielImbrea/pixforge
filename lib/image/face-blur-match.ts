import type { BlurCustomAction } from '@/lib/tools/blur-faces-params';

/** face-api default: same person typically scores below ~0.55. */
export const FACE_MATCH_THRESHOLD = 0.55;

export function pickFacesToBlur<T extends { descriptor: Float32Array }>(
  faces: T[],
  referenceDescriptor: Float32Array,
  customAction: BlurCustomAction,
  distance: (a: Float32Array, b: Float32Array) => number,
  threshold = FACE_MATCH_THRESHOLD
): T[] {
  if (faces.length === 0) return [];

  const distances = faces.map((face) => distance(referenceDescriptor, face.descriptor));

  if (customAction === 'blur') {
    return faces.filter((_, index) => distances[index] < threshold);
  }

  let bestIndex = 0;
  for (let index = 1; index < distances.length; index++) {
    if (distances[index] < distances[bestIndex]) {
      bestIndex = index;
    }
  }

  if (distances[bestIndex] > threshold) {
    return [];
  }

  if (faces.length === 1) {
    return [];
  }

  return faces.filter((_, index) => index !== bestIndex);
}
