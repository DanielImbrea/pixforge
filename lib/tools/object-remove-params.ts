export type ObjectRemoveEditMode = 'remove' | 'replace';
export type ObjectRemoveSelectionTool = 'brush' | 'click';

export interface ObjectRemoveParams {
  brushSize: number;
  editMode: ObjectRemoveEditMode;
  selectionTool: ObjectRemoveSelectionTool;
  inpaintPrompt: string;
  maskAssetId?: string;
}

export const DEFAULT_OBJECT_REMOVE_PARAMS: ObjectRemoveParams = {
  brushSize: 36,
  editMode: 'remove',
  selectionTool: 'brush',
  inpaintPrompt: '',
};

export const OBJECT_REMOVE_BRUSH_MIN = 8;
export const OBJECT_REMOVE_BRUSH_MAX = 120;

/** Fixed prompt for erase mode — continues surrounding scene instead of generating new content. */
export const OBJECT_REMOVE_ERASE_PROMPT =
  'seamless continuation of the surrounding background, same lighting texture and colors, remove the masked object, photorealistic natural fill';

export function clampObjectRemoveBrush(size: number): number {
  return Math.max(OBJECT_REMOVE_BRUSH_MIN, Math.min(OBJECT_REMOVE_BRUSH_MAX, Math.round(size)));
}

export function resolveObjectRemoveInpaintPrompt(
  editMode: ObjectRemoveEditMode,
  userPrompt?: string
): string {
  if (editMode === 'replace') {
    const trimmed = userPrompt?.trim();
    if (trimmed) return trimmed;
    return 'natural seamless fill matching the scene';
  }
  return OBJECT_REMOVE_ERASE_PROMPT;
}
