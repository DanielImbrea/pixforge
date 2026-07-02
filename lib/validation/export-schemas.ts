import { z } from 'zod';

export const exportAssetRequestSchema = z.object({
  format: z.enum(['png', 'jpeg', 'webp']),
  scalePercent: z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(100)]).default(100),
  compress: z.boolean().default(false),
  compressLevel: z.enum(['high', 'balanced', 'smallest']).default('balanced'),
  limitFileSize: z.boolean().default(false),
  maxFileSizeKb: z.number().int().min(100).max(10240).default(1024),
  transparentBackground: z.boolean().default(true),
  stripMetadata: z.boolean().default(true),
  fileName: z.string().max(120).optional(),
});

export type ExportAssetRequest = z.infer<typeof exportAssetRequestSchema>;
