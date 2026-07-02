export type ObjectRemoveEditMode = 'remove' | 'replace';

/** Flux Fill tuning — remove mode favors faithful background continuation over creativity. */
export interface ObjectRemoveInpaintSettings {
  prompt: string;
  guidance: number;
  numInferenceSteps: number;
  megapixels: 'match_input' | '1';
  outputFormat: 'jpg' | 'png' | 'webp';
}

/**
 * Erase: reconstruct only surrounding scene — no object, no deformation.
 * Lower guidance reduces "melting" artifacts on masked objects.
 */
export const OBJECT_REMOVE_ERASE_PROMPT =
  'seamless natural continuation of the surrounding floor wall and background only, same lighting shadows and textures as the area around the mask, empty scene, no objects no people no products, photorealistic clean fill';

export const OBJECT_REMOVE_REPLACE_FALLBACK_PROMPT =
  'natural seamless fill matching the scene lighting and perspective';

export function resolveObjectRemoveInpaintPrompt(
  editMode: ObjectRemoveEditMode,
  userPrompt?: string
): string {
  if (editMode === 'replace') {
    const trimmed = userPrompt?.trim();
    if (trimmed) return trimmed;
    return OBJECT_REMOVE_REPLACE_FALLBACK_PROMPT;
  }
  return OBJECT_REMOVE_ERASE_PROMPT;
}

export function resolveObjectRemoveInpaintSettings(
  editMode: ObjectRemoveEditMode,
  userPrompt?: string
): ObjectRemoveInpaintSettings {
  if (editMode === 'replace') {
    return {
      prompt: resolveObjectRemoveInpaintPrompt('replace', userPrompt),
      guidance: 28,
      numInferenceSteps: 32,
      megapixels: 'match_input',
      outputFormat: 'jpg',
    };
  }

  return {
    prompt: resolveObjectRemoveInpaintPrompt('remove', userPrompt),
    guidance: 18,
    numInferenceSteps: 36,
    megapixels: 'match_input',
    outputFormat: 'jpg',
  };
}

/** Inpaint mask expansion at full image resolution (before Flux downscale). */
export const OBJECT_REMOVE_INPAINT_MASK_DILATE_PX = 6;

/** Soft edge on inpaint mask to avoid seams (box blur radius). */
export const OBJECT_REMOVE_INPAINT_MASK_FEATHER_PX = 2;
