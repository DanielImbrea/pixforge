export {
  OBJECT_REMOVE_ERASE_PROMPT,
  resolveObjectRemoveInpaintPrompt,
} from '@/lib/tools/object-remove-inpaint-config';

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

export function clampObjectRemoveBrush(size: number): number {
  return Math.max(OBJECT_REMOVE_BRUSH_MIN, Math.min(OBJECT_REMOVE_BRUSH_MAX, Math.round(size)));
}
