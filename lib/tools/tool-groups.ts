import type { ToolDefinition } from '@/types';

export type ToolGroupId = 'optimize' | 'enhance';

export interface ToolGroup {
  id: ToolGroupId;
  tools: ToolDefinition[];
}

const OPTIMIZE_CATEGORIES = new Set(['crop', 'resize', 'compress', 'convert']);
const ENHANCE_CATEGORIES = new Set(['upscale', 'background', 'background_replace', 'object_remove', 'portrait_enhance', 'faces']);

export function groupToolsForLanding(tools: ToolDefinition[]): ToolGroup[] {
  const optimize = tools.filter((tool) => OPTIMIZE_CATEGORIES.has(tool.category));
  const enhance = tools.filter((tool) => ENHANCE_CATEGORIES.has(tool.category));

  return [
    { id: 'optimize' as const, tools: optimize },
    { id: 'enhance' as const, tools: enhance },
  ].filter((group) => group.tools.length > 0);
}
