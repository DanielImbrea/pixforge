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
});

export const upscaleParamsSchema = z.object({
  scale: z.union([z.literal(2), z.literal(4)]).default(2),
});
