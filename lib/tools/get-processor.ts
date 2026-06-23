import type { ToolDefinition } from '@/types';
import type { ToolProcessor } from './processor';
import { sharpProcessor } from './processors/sharp-processor';
import { aiProcessor } from './processors/ai-processor';

export function getProcessor(tool: ToolDefinition): ToolProcessor {
  return tool.type === 'sharp' ? sharpProcessor : aiProcessor;
}
