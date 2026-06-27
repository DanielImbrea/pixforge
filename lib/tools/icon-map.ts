import {
  Crop,
  Minimize2,
  RefreshCw,
  Maximize2,
  Eraser,
  Scissors,
  ScanFace,
  type LucideIcon,
} from 'lucide-react';

export const TOOL_ICONS: Record<string, LucideIcon> = {
  Crop,
  Scissors,
  ScanFace,
  Minimize2,
  RefreshCw,
  Maximize2,
  Eraser,
};

export function getToolIcon(name: string): LucideIcon {
  return TOOL_ICONS[name] || Maximize2;
}
