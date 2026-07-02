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
  shadowRecovery: z.boolean().default(false),
});

export const bgReplaceParamsSchema = z.object({
  subjectMode: z.enum(['auto', 'product', 'portrait', 'object']).default('auto'),
  edgeQuality: z.enum(['standard', 'high', 'studio']).default('high'),
  backgroundPreset: z
    .enum([
      'white',
      'studio_gray',
      'amazon_white',
      'studio_soft',
      'tokyo_night',
      'nature_jungle',
      'sunset_beach',
      'custom',
    ])
    .default('studio_soft'),
  backgroundPrompt: z.string().max(500).default(''),
});

export const objectRemoveParamsSchema = z.object({
  brushSize: z.number().int().min(8).max(120).default(36),
  editMode: z.enum(['remove', 'replace']).default('remove'),
  selectionTool: z.enum(['brush', 'click', 'select']).transform((v) => (v === 'select' ? 'click' : v)).default('brush'),
  inpaintPrompt: z.string().max(300).default(''),
  maskAssetId: z.string().uuid().optional(),
});

export const portraitEnhanceParamsSchema = z
  .object({
    preset: z.enum(['natural', 'glamour', 'custom']).default('natural'),
    mode: z.enum(['auto', 'enhance', 'restore']).default('auto'),
    intensity: z
      .object({
        overall: z.number().min(0).max(100).default(32),
        skin: z.number().min(0).max(100).default(22),
        eyes: z.number().min(0).max(100).default(28),
        lips: z.number().min(0).max(100).default(12),
        teeth: z.number().min(0).max(100).default(15),
        underEye: z.number().min(0).max(100).default(24),
        lighting: z.number().min(0).max(100).default(18),
      })
      .default({}),
    enhanceStyle: z.enum(['natural', 'glamour']).optional(),
  })
  .transform((data) => {
    const preset =
      data.preset ??
      (data.enhanceStyle === 'glamour' ? 'glamour' : data.enhanceStyle === 'natural' ? 'natural' : 'natural');
    return { ...data, preset };
  });

export const cropParamsSchema = z.object({
  left: z.number().int().min(0).max(10000),
  top: z.number().int().min(0).max(10000),
  width: z.number().int().positive().max(10000),
  height: z.number().int().positive().max(10000),
  aspectRatio: z
    .enum(['free', '1:1', '4:3', '3:2', '16:9', '9:16', '4:5', '3:4'])
    .default('free'),
  rotate: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).default(0),
  flipHorizontal: z.boolean().default(false),
  flipVertical: z.boolean().default(false),
  /** Image already cropped in the browser; server only stores and encodes it. */
  clientProcessed: z.boolean().optional(),
});

export const blurFacesParamsSchema = z.object({
  detectionMode: z.enum(['automatic', 'custom']).default('automatic'),
  blurStrength: z.enum(['low', 'medium', 'strong']).default('medium'),
  customAction: z.enum(['blur', 'exclude']).default('blur'),
  referenceAssetId: z.string().uuid().optional(),
  /** Image already blurred in the browser; server only stores and delivers it. */
  clientProcessed: z.boolean().optional(),
  blurFacesCount: z.number().int().min(0).optional(),
});
