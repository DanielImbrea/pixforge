import type { ToolDefinition } from '@/types';
import { getToolById } from '@/lib/tools/registry';

/** Display order on the home page — AI tools first. */
export const LANDING_TOOL_IDS = [
  'tool_background_removal',
  'tool_background_replace',
  'tool_object_remove',
  'tool_portrait_enhance',
  'tool_upscale_ai',
  'tool_blur_faces',
  'tool_crop',
  'tool_resize',
  'tool_compress',
  'tool_convert',
] as const;

export type LandingHeroToolKey =
  | 'upscale'
  | 'background'
  | 'portrait'
  | 'blur_faces'
  | 'crop'
  | 'resize'
  | 'compress'
  | 'convert_optimizer'
  | 'convert';

export const LANDING_HERO_TOOLS: { id: (typeof LANDING_TOOL_IDS)[number] | 'tool_convert'; key: LandingHeroToolKey }[] = [
  { id: 'tool_upscale_ai', key: 'upscale' },
  { id: 'tool_background_removal', key: 'background' },
  { id: 'tool_portrait_enhance', key: 'portrait' },
  { id: 'tool_blur_faces', key: 'blur_faces' },
  { id: 'tool_crop', key: 'crop' },
  { id: 'tool_resize', key: 'resize' },
  { id: 'tool_compress', key: 'compress' },
  { id: 'tool_convert', key: 'convert_optimizer' },
  { id: 'tool_convert', key: 'convert' },
];

export function getLandingToolsOrdered(): ToolDefinition[] {
  return LANDING_TOOL_IDS.map((id) => getToolById(id)).filter(
    (tool): tool is ToolDefinition => Boolean(tool)
  );
}
