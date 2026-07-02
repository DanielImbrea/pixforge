/** Sharp tools (resize, compress, convert) — runs on our CPU, ~€0 cost */
export const SHARP_CREDIT_COST = 1;

export const AI_CREDIT_COST = 5;

/** Background replace: cutout + AI/solid plate composite */
export const BG_REPLACE_CREDIT_COST = 12;

/** Object remove: brush mask + AI inpainting */
export const OBJECT_REMOVE_CREDIT_COST = 8;

/** Portrait enhance: face restoration / retouch */
export const PORTRAIT_ENHANCE_CREDIT_COST = 10;

export function creditCostLabel(type: 'sharp' | 'ai'): number {
  return type === 'ai' ? AI_CREDIT_COST : SHARP_CREDIT_COST;
}
