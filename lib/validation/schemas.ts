import { z } from 'zod';

export const checkoutRequestSchema = z.object({
  plan: z.enum(['basic', 'starter', 'pro']),
  locale: z.enum(['en', 'ro']).optional().default('en'),
});

export const jobCreateRequestSchema = z.object({
  toolId: z.string().min(1),
  inputAssetId: z.string().uuid(),
  params: z.record(z.unknown()).optional().default({}),
});

export const resizeParamsSchema = z.object({
  width: z.number().int().positive().max(10000).optional(),
  height: z.number().int().positive().max(10000).optional(),
  maintainAspectRatio: z.boolean().optional(),
  targetFormat: z.enum(['original', 'auto', 'avif', 'webp', 'png', 'jpeg', 'jpg']).default('original'),
  quality: z.number().int().min(70).max(100).default(85),
});

export const upscaleParamsSchema = z.object({
  scale: z.union([z.literal('smart'), z.literal(2), z.literal(4)]).default('smart'),
});

export const convertParamsSchema = z.object({
  targetFormat: z.enum(['auto', 'avif', 'webp', 'png', 'jpeg', 'jpg']).default('auto'),
  qualityIntent: z.enum(['fast', 'balanced', 'max']).default('balanced'),
  backgroundFill: z.enum(['white', 'black', 'blur', 'auto']).default('white'),
});

export const bgRemovalParamsSchema = z.object({
  subjectMode: z.enum(['auto', 'product', 'portrait', 'object']).default('auto'),
  edgeQuality: z.enum(['standard', 'high', 'studio']).default('high'),
});
