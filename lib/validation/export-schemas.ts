import { z } from 'zod';
import { EXPORT_SCALE_MAX, EXPORT_SCALE_MIN } from '@/lib/tools/download-export/types';

export const exportAssetRequestSchema = z.object({
  format: z.enum(['png', 'jpeg', 'webp']),
  scaleMultiplier: z
    .number()
    .min(EXPORT_SCALE_MIN)
    .max(EXPORT_SCALE_MAX)
    .default(1),
  compress: z.boolean().default(false),
  compressLevel: z.literal('balanced').default('balanced'),
  limitFileSize: z.boolean().default(false),
  maxFileSizeKb: z.number().int().min(50).max(10240).default(1024),
  transparentBackground: z.boolean().default(true),
  stripMetadata: z.boolean().default(true),
  fileName: z.string().max(120).optional(),
});

export type ExportAssetRequest = z.infer<typeof exportAssetRequestSchema>;
