'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Paintbrush, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  applyFloodFillToCanvas,
  floodFillRegion,
} from '@/lib/tools/object-remove-flood-fill';
import {
  clampObjectRemoveBrush,
  OBJECT_REMOVE_BRUSH_MAX,
  OBJECT_REMOVE_BRUSH_MIN,
  type ObjectRemoveSelectionTool,
} from '@/lib/tools/object-remove-params';

export interface ObjectRemoveEditorHandle {
  exportMaskFile: () => Promise<File | null>;
  hasMaskContent: () => boolean;
  clearMask: () => void;
}

interface ObjectRemoveEditorProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  brushSize: number;
  selectionTool: ObjectRemoveSelectionTool;
  onBrushSizeChange: (size: number) => void;
  onSelectionToolChange: (tool: ObjectRemoveSelectionTool) => void;
  onMaskChange?: (hasMask: boolean) => void;
}

type BrushMode = 'paint' | 'erase';

const CLICK_TOLERANCE = 36;

function countMaskPixels(maskCtx: CanvasRenderingContext2D, width: number, height: number): number {
  const data = maskCtx.getImageData(0, 0, width, height).data;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 32) count += 1;
  }
  return count;
}

function toolPillClass(active: boolean) {
  return `flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
    active
      ? 'border-accent bg-accent/10 text-accent'
      : 'border-border-default text-text-secondary hover:border-accent/40'
  }`;
}

export const ObjectRemoveEditor = forwardRef<ObjectRemoveEditorHandle, ObjectRemoveEditorProps>(
  function ObjectRemoveEditor(
    {
      imageUrl,
      imageWidth,
      imageHeight,
      brushSize,
      selectionTool,
      onBrushSizeChange,
      onSelectionToolChange,
      onMaskChange,
    },
    ref
  ) {
    const t = useTranslations('tool');
    const stageRef = useRef<HTMLDivElement>(null);
    const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
    const [brushMode, setBrushMode] = useState<BrushMode>('paint');
    const [hasMask, setHasMask] = useState(false);
    const [imageReady, setImageReady] = useState(false);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
    const [cursorInside, setCursorInside] = useState(false);
    const drawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    const resetMasks = useCallback(() => {
      const maskCanvas = maskCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      if (!maskCanvas || !overlayCanvas) return;

      maskCanvas.width = imageWidth;
      maskCanvas.height = imageHeight;
      overlayCanvas.width = imageWidth;
      overlayCanvas.height = imageHeight;

      const maskCtx = maskCanvas.getContext('2d');
      const overlayCtx = overlayCanvas.getContext('2d');
      if (!maskCtx || !overlayCtx) return;

      maskCtx.fillStyle = '#000000';
      maskCtx.fillRect(0, 0, imageWidth, imageHeight);
      overlayCtx.clearRect(0, 0, imageWidth, imageHeight);
      setHasMask(false);
      onMaskChange?.(false);
    }, [imageHeight, imageWidth, onMaskChange]);

    useEffect(() => {
      resetMasks();
    }, [imageUrl, resetMasks]);

    useEffect(() => {
      const canvas = sourceCanvasRef.current;
      if (!canvas) return;

      setImageReady(false);
      const img = new Image();
      if (!imageUrl.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, imageWidth, imageHeight);
        setImageReady(true);
      };
      img.src = imageUrl;
    }, [imageUrl, imageWidth, imageHeight]);

    useEffect(() => {
      const el = stageRef.current;
      if (!el) return;

      const update = () => {
        const rect = el.getBoundingClientRect();
        setDisplaySize({ width: rect.width, height: rect.height });
      };

      update();
      const observer = new ResizeObserver(update);
      observer.observe(el);
      return () => observer.disconnect();
    }, [imageWidth, imageHeight]);

    const scale = displaySize.width > 0 ? imageWidth / displaySize.width : 1;
    const displayBrushSize = clampObjectRemoveBrush(brushSize) / scale;
    const showBrushCursor = cursorInside && selectionTool === 'brush' && displayBrushSize > 0;

    const toImageCoords = useCallback(
      (clientX: number, clientY: number) => {
        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
        return { x: x * scale, y: y * scale };
      },
      [scale]
    );

    const toDisplayCoords = useCallback((clientX: number, clientY: number) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }, []);

    const refreshMaskState = useCallback(() => {
      const maskCanvas = maskCanvasRef.current;
      const maskCtx = maskCanvas?.getContext('2d');
      if (!maskCtx || !maskCanvas) return;
      const painted = countMaskPixels(maskCtx, maskCanvas.width, maskCanvas.height) > 0;
      setHasMask(painted);
      onMaskChange?.(painted);
    }, [onMaskChange]);

    const drawStroke = useCallback(
      (from: { x: number; y: number }, to: { x: number; y: number }) => {
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const maskCtx = maskCanvas?.getContext('2d');
        const overlayCtx = overlayCanvas?.getContext('2d');
        if (!maskCtx || !overlayCtx) return;

        const radius = clampObjectRemoveBrush(brushSize) / 2;
        const paint = brushMode === 'paint';

        const drawDot = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
          ctx.save();
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };

        const stroke = (
          ctx: CanvasRenderingContext2D,
          color: string,
          composite: GlobalCompositeOperation
        ) => {
          ctx.save();
          ctx.globalCompositeOperation = composite;
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = radius * 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
          drawDot(ctx, to.x, to.y, color);
          ctx.restore();
        };

        if (paint) {
          stroke(maskCtx, '#ffffff', 'source-over');
          stroke(overlayCtx, 'rgba(239, 68, 68, 0.45)', 'source-over');
        } else {
          stroke(maskCtx, '#000000', 'source-over');
          stroke(overlayCtx, '#000000', 'destination-out');
        }
      },
      [brushMode, brushSize]
    );

    const applyClickSelection = useCallback(
      (point: { x: number; y: number }) => {
        const sourceCanvas = sourceCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const sourceCtx = sourceCanvas?.getContext('2d', { willReadFrequently: true });
        const maskCtx = maskCanvas?.getContext('2d');
        const overlayCtx = overlayCanvas?.getContext('2d');
        if (!sourceCtx || !maskCtx || !overlayCtx || !imageReady) return;

        const imageData = sourceCtx.getImageData(0, 0, imageWidth, imageHeight);
        const region = floodFillRegion(
          imageData.data,
          imageWidth,
          imageHeight,
          point.x,
          point.y,
          CLICK_TOLERANCE
        );

        let hits = 0;
        for (let i = 0; i < region.length; i++) {
          if (region[i]) hits += 1;
        }
        if (hits === 0) return;

        applyFloodFillToCanvas(
          maskCtx,
          overlayCtx,
          region,
          imageWidth,
          imageHeight,
          brushMode === 'erase'
        );
      },
      [brushMode, imageHeight, imageReady, imageWidth]
    );

    const clearMask = useCallback(() => {
      resetMasks();
    }, [resetMasks]);

    const exportMaskFile = useCallback(async (): Promise<File | null> => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas || !hasMask) return null;

      return new Promise((resolve) => {
        maskCanvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(new File([blob], 'object-remove-mask.png', { type: 'image/png' }));
        }, 'image/png');
      });
    }, [hasMask]);

    useImperativeHandle(
      ref,
      () => ({
        exportMaskFile,
        hasMaskContent: () => hasMask,
        clearMask,
      }),
      [clearMask, exportMaskFile, hasMask]
    );

    const handlePointerDown = (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const point = toImageCoords(event.clientX, event.clientY);

      if (selectionTool === 'click') {
        applyClickSelection(point);
        refreshMaskState();
        return;
      }

      drawingRef.current = true;
      lastPointRef.current = point;
      drawStroke(point, point);
      refreshMaskState();
      stageRef.current?.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent) => {
      setCursorPos(toDisplayCoords(event.clientX, event.clientY));

      if (selectionTool === 'click' || !drawingRef.current || !lastPointRef.current) return;
      const point = toImageCoords(event.clientX, event.clientY);
      drawStroke(lastPointRef.current, point);
      lastPointRef.current = point;
      refreshMaskState();
    };

    const handlePointerUp = (event: React.PointerEvent) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      lastPointRef.current = null;
      stageRef.current?.releasePointerCapture(event.pointerId);
      refreshMaskState();
    };

    const handlePointerEnter = (event: React.PointerEvent) => {
      setCursorInside(true);
      setCursorPos(toDisplayCoords(event.clientX, event.clientY));
    };

    const handlePointerLeave = (event: React.PointerEvent) => {
      setCursorInside(false);
      setCursorPos(null);
      handlePointerUp(event);
    };

    const stageCursor =
      selectionTool === 'click'
        ? brushMode === 'erase'
          ? 'crosshair'
          : 'pointer'
        : showBrushCursor
          ? 'none'
          : 'crosshair';

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-lg border border-border-default bg-background-secondary p-3">
          <p className="text-xs font-medium text-text-primary">{t('objectRemoveSelectArea')}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              className={toolPillClass(selectionTool === 'brush')}
              onClick={() => {
                onSelectionToolChange('brush');
                setBrushMode('paint');
              }}
            >
              <Paintbrush className="h-3.5 w-3.5" aria-hidden />
              {t('objectRemoveToolBrush')}
            </button>
            <button
              type="button"
              className={toolPillClass(selectionTool === 'click')}
              onClick={() => onSelectionToolChange('click')}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t('objectRemoveToolClick')}
            </button>
          </div>

          {selectionTool === 'brush' ? (
            <div className="mt-3 flex flex-col gap-2">
              <label className="text-xs font-medium text-text-secondary">
                {t('objectRemoveBrushSizeLabel')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={OBJECT_REMOVE_BRUSH_MIN}
                  max={OBJECT_REMOVE_BRUSH_MAX}
                  value={brushSize}
                  onChange={(e) => onBrushSizeChange(clampObjectRemoveBrush(Number(e.target.value)))}
                  className="min-w-0 flex-1 accent-accent"
                />
                <input
                  type="number"
                  min={OBJECT_REMOVE_BRUSH_MIN}
                  max={OBJECT_REMOVE_BRUSH_MAX}
                  value={clampObjectRemoveBrush(brushSize)}
                  onChange={(e) => onBrushSizeChange(clampObjectRemoveBrush(Number(e.target.value)))}
                  className="w-14 rounded-md border border-border-default bg-background-primary px-2 py-1 text-center text-xs text-text-primary"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-full border ${
              brushMode === 'erase'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-default text-text-tertiary'
            }`}
            onClick={() => setBrushMode((m) => (m === 'erase' ? 'paint' : 'erase'))}
          >
            {t('objectRemoveEraser')}
          </button>
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-full border border-border-default text-text-tertiary"
            onClick={clearMask}
            disabled={!hasMask}
          >
            {t('objectRemoveClearMask')}
          </button>
        </div>

        <p className="text-xs text-text-tertiary">
          {selectionTool === 'click' ? t('objectRemoveClickHint') : t('objectRemoveEditorHint')}
        </p>

        <div
          ref={stageRef}
          className="relative w-full overflow-hidden rounded-lg border border-border-default bg-background-secondary touch-none select-none"
          style={{ aspectRatio: `${imageWidth} / ${imageHeight}`, cursor: stageCursor }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
            draggable={false}
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />
          {showBrushCursor && cursorPos ? (
            <div
              className="pointer-events-none absolute rounded-full border-2 border-white"
              style={{
                width: displayBrushSize,
                height: displayBrushSize,
                left: cursorPos.x - displayBrushSize / 2,
                top: cursorPos.y - displayBrushSize / 2,
                boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.85)',
              }}
            />
          ) : null}
          <canvas ref={maskCanvasRef} className="hidden" aria-hidden />
          <canvas ref={sourceCanvasRef} className="hidden" aria-hidden />
        </div>
      </div>
    );
  }
);
