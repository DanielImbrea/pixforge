import type { Locale } from '@/i18n';
import type { ToolCategory, ToolDefinition } from '@/types';
import { resizeTool } from './resize';
import { compressTool } from './compress';
import { convertTool } from './convert';
import { upscaleTool } from './upscale';
import { backgroundRemovalTool } from './background-removal';

import { cropTool } from './crop';
import { blurFacesTool } from './blur-faces';

export const TOOL_REGISTRY: ToolDefinition[] = [
  cropTool,
  resizeTool,
  compressTool,
  convertTool,
  upscaleTool,
  backgroundRemovalTool,
  blurFacesTool,
];

export function getEnabledTools(): ToolDefinition[] {
  return TOOL_REGISTRY.filter((tool) => tool.enabled).sort((a, b) => a.order - b.order);
}

export function getToolBySlug(locale: Locale, slug: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((tool) => tool.enabled && tool.slug[locale] === slug);
}

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return getEnabledTools().filter((tool) => tool.category === category);
}

export function getAllToolStaticParams(locales: readonly Locale[]) {
  return TOOL_REGISTRY.filter((t) => t.enabled).flatMap((tool) =>
    locales.map((locale) => ({
      locale,
      toolSlug: tool.slug[locale],
    }))
  );
}
