/** Sharp tools (resize, compress, convert) — runs on our CPU, ~€0 cost */
export const SHARP_CREDIT_COST = 1;

/** AI tools (upscale, background removal) — Replicate budget ~€0.02/job */
export const AI_CREDIT_COST = 5;

export function creditCostLabel(type: 'sharp' | 'ai'): number {
  return type === 'ai' ? AI_CREDIT_COST : SHARP_CREDIT_COST;
}
