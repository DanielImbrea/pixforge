'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Eraser, Loader2, Paintbrush, Sparkles, Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  prepareSamImage,
  resetSamSession,
  SamSegmentError,
  segmentSamAtClick,
  undoSamClick,
} from '@/lib/image/sam-segment-browser';
import { pointerToImageCoords } from '@/lib/tools/object-remove-coords';
import {
  applyFloodFillToCanvas,
  floodFillRegion,
} from '@/lib/tools/object-remove-flood-fill';
import {
  countMaskPixels,
  drawMaskOutline,
  mergeSamMaskIntoCanvas,
  setMaskFromSam,
} from '@/lib/tools/object-remove-mask';
import {
  clampObjectRemoveBrush,
  OBJECT_REMOVE_BRUSH_MAX,
  OBJECT_REMOVE_BRUSH_MIN,
  type ObjectRemoveSelectionTool,
} from '@/lib/tools/object-remove-params';

const FLOOD_FILL_TOLERANCE = 32;

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
  previewImageUrl?: string | null;
  isErasing?: boolean;
  onBrushSizeChange: (size: number) => void;
  onSelectionToolChange: (tool: ObjectRemoveSelectionTool) => void;
  onMaskChange?: (hasMask: boolean) => void;
  onEraseHotkey?: () => void;
}

type BrushMode = 'paint' | 'erase';

function toolPillClass(active: boolean, disabled = false) {
  return `flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
    disabled
      ? 'cursor-not-allowed border-border-default bg-background-secondary text-text-tertiary opacity-60'
      : active
        ? 'border-accent bg-accent/10 text-accent'
        : 'border-border-default text-text-secondary hover:border-accent/40'
  }`;
}

function actionButtonClass(active = false, disabled = false) {
  return `text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
    disabled
      ? 'cursor-not-allowed border-border-default bg-background-secondary text-text-tertiary opacity-50'
      : active
        ? 'border-accent bg-accent/10 text-accent'
        : 'border-border-default bg-background-primary text-text-secondary hover:border-accent/50 hover:text-text-primary'
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
      previewImageUrl = null,
      isErasing = false,
      onBrushSizeChange,
      onSelectionToolChange,
      onMaskChange,
      onEraseHotkey,
    },
    ref
  ) {
    const t = useTranslations('tool');
    const stageRef = useRef<HTMLDivElement>(null);
    const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const samPrepareStartedRef = useRef(false);
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
    const [brushMode, setBrushMode] = useState<BrushMode>('paint');
    const [hasMask, setHasMask] = useState(false);
    const [imageReady, setImageReady] = useState(false);
    const [samReady, setSamReady] = useState(false);
    const [samLoading, setSamLoading] = useState(false);
    const [samError, setSamError] = useState<string | null>(null);
    const [segmenting, setSegmenting] = useState(false);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
    const [cursorInside, setCursorInside] = useState(false);
    const drawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    const isPreviewing = Boolean(previewImageUrl);
    const isEditingDisabled = isPreviewing || isErasing;

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
      resetSamSession();
      samPrepareStartedRef.current = false;
      setSamReady(false);
      setSamError(null);
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

    const scale =
      displaySize.width > 0 && imageWidth > 0 ? imageWidth / displaySize.width : 1;
    const displayBrushSize = clampObjectRemoveBrush(brushSize) / scale;
    const showBrushCursor =
      cursorInside && selectionTool === 'brush' && displayBrushSize > 0 && !isEditingDisabled;

    const toImageCoords = useCallback(
      (clientX: number, clientY: number) => {
        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return pointerToImageCoords(clientX, clientY, rect, imageWidth, imageHeight);
      },
      [imageHeight, imageWidth]
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

    const ensureSamPrepare = useCallback(() => {
      if (samPrepareStartedRef.current || samReady || samLoading || !imageReady) return;
      const canvas = sourceCanvasRef.current;
      if (!canvas) return;

      samPrepareStartedRef.current = true;
      setSamLoading(true);
      setSamError(null);

      void (async () => {
        try {
          await prepareSamImage(canvas);
          setSamReady(true);
        } catch (err) {
          setSamError(
            err instanceof Error ? err.message : 'Smart selection failed to load.'
          );
          setSamReady(false);
        } finally {
          setSamLoading(false);
        }
      })();
    }, [imageReady, samLoading, samReady]);

    const applyFloodFillClick = useCallback(
      (point: { x: number; y: number }, subtract: boolean) => {
        const sourceCanvas = sourceCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const sourceCtx = sourceCanvas?.getContext('2d');
        const maskCtx = maskCanvas?.getContext('2d');
        const overlayCtx = overlayCanvas?.getContext('2d');
        if (!sourceCtx || !maskCtx || !overlayCtx) return;

        const imageData = sourceCtx.getImageData(0, 0, imageWidth, imageHeight);
        const region = floodFillRegion(
          imageData.data,
          imageWidth,
          imageHeight,
          point.x,
          point.y,
          FLOOD_FILL_TOLERANCE
        );
        applyFloodFillToCanvas(maskCtx, overlayCtx, region, imageWidth, imageHeight, subtract);
      },
      [imageHeight, imageWidth]
    );

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
          stroke(overlayCtx, 'rgba(239, 68, 68, 0.5)', 'source-over');
        } else {
          stroke(maskCtx, '#000000', 'source-over');
          stroke(overlayCtx, '#000000', 'destination-out');
        }

        if (maskCanvas && overlayCanvas) {
          drawMaskOutline(maskCtx, overlayCtx, maskCanvas.width, maskCanvas.height);
        }
      },
      [brushMode, brushSize]
    );

    const applySmartClick = useCallback(
      async (point: { x: number; y: number }, exclude: boolean) => {
        const sourceCanvas = sourceCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const maskCtx = maskCanvas?.getContext('2d');
        const overlayCtx = overlayCanvas?.getContext('2d');
        if (!sourceCanvas || !maskCtx || !overlayCtx || !imageReady || segmenting) return;

        ensureSamPrepare();
        setSegmenting(true);
        setSamError(null);

        const subtract = exclude || brushMode === 'erase';

        try {
          if (samReady) {
            const clickType = subtract ? 'exclude' : 'include';
            const samMask = await segmentSamAtClick(sourceCanvas, point, clickType);
            if (!samMask) return;
            mergeSamMaskIntoCanvas(maskCtx, overlayCtx, samMask, imageWidth, imageHeight, subtract);
          } else {
            applyFloodFillClick(point, subtract);
          }
        } catch (err) {
          try {
            applyFloodFillClick(point, subtract);
          } catch {
            const message =
              err instanceof SamSegmentError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : 'Smart selection failed.';
            setSamError(message);
          }
        } finally {
          setSegmenting(false);
          refreshMaskState();
        }
      },
      [
        applyFloodFillClick,
        brushMode,
        ensureSamPrepare,
        imageHeight,
        imageReady,
        imageWidth,
        refreshMaskState,
        samReady,
        segmenting,
      ]
    );

    const handleUndoSmartClick = useCallback(async () => {
      if (isEditingDisabled || selectionTool !== 'click') return;
      const sourceCanvas = sourceCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const maskCtx = maskCanvas?.getContext('2d');
      const overlayCtx = overlayCanvas?.getContext('2d');
      if (!sourceCanvas || !maskCtx || !overlayCtx) return;

      const samMask = await undoSamClick(sourceCanvas);
      if (!samMask) {
        maskCtx.fillStyle = '#000000';
        maskCtx.fillRect(0, 0, imageWidth, imageHeight);
        overlayCtx.clearRect(0, 0, imageWidth, imageHeight);
      } else {
        setMaskFromSam(maskCtx, overlayCtx, samMask, imageWidth, imageHeight);
      }
      refreshMaskState();
    }, [imageHeight, imageWidth, isEditingDisabled, refreshMaskState, selectionTool]);

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

    useEffect(() => {
      const handler = (event: KeyboardEvent) => {
        if (isPreviewing || isErasing || !hasMask) return;
        const target = event.target as HTMLElement | null;
        if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          onEraseHotkey?.();
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [hasMask, isErasing, isPreviewing, onEraseHotkey]);

    const handlePointerDown = (event: React.PointerEvent) => {
      if (event.button !== 0 || isEditingDisabled) return;
      event.preventDefault();
      const point = toImageCoords(event.clientX, event.clientY);

      if (selectionTool === 'click') {
        const exclude = event.shiftKey || brushMode === 'erase';
        void applySmartClick(point, exclude);
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

      if (selectionTool === 'click' || !drawingRef.current || !lastPointRef.current || isEditingDisabled) {
        return;
      }
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

    const stageCursor = isEditingDisabled
      ? 'default'
      : selectionTool === 'click'
        ? segmenting
          ? 'wait'
          : brushMode === 'erase'
            ? 'crosshair'
            : 'pointer'
        : showBrushCursor
          ? 'none'
          : 'crosshair';

    return (
      <div className="flex flex-col gap-4">
        {!isPreviewing ? (
          <>
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
                      onChange={(e) =>
                        onBrushSizeChange(clampObjectRemoveBrush(Number(e.target.value)))
                      }
                      className="min-w-0 flex-1 accent-accent"
                    />
                    <input
                      type="number"
                      min={OBJECT_REMOVE_BRUSH_MIN}
                      max={OBJECT_REMOVE_BRUSH_MAX}
                      value={clampObjectRemoveBrush(brushSize)}
                      onChange={(e) =>
                        onBrushSizeChange(clampObjectRemoveBrush(Number(e.target.value)))
                      }
                      className="w-14 rounded-md border border-border-default bg-background-primary px-2 py-1 text-center text-xs text-text-primary"
                    />
                  </div>
                </div>
              ) : null}

              {selectionTool === 'click' && samLoading ? (
                <p className="text-xs text-text-secondary">{t('objectRemoveSamLoading')}</p>
              ) : null}
              {selectionTool === 'click' && !samReady && !samLoading ? (
                <p className="text-xs text-text-tertiary">{t('objectRemoveClickFallbackHint')}</p>
              ) : null}
              {samError ? <p className="text-xs text-danger">{samError}</p> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={actionButtonClass(brushMode === 'erase')}
                onClick={() => setBrushMode((m) => (m === 'erase' ? 'paint' : 'erase'))}
              >
                <Eraser className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                {t('objectRemoveEraser')}
              </button>
              <button
                type="button"
                className={actionButtonClass(false, !hasMask)}
                disabled={!hasMask}
                onClick={clearMask}
              >
                {t('objectRemoveClearMask')}
              </button>
              {selectionTool === 'click' ? (
                <button
                  type="button"
                  className={actionButtonClass(false, segmenting)}
                  disabled={segmenting}
                  onClick={() => void handleUndoSmartClick()}
                >
                  <Undo2 className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                  {t('objectRemoveUndoClick')}
                </button>
              ) : null}
            </div>

            <p className="text-xs text-text-tertiary">
              {selectionTool === 'click' ? t('objectRemoveClickHint') : t('objectRemoveEditorHint')}
            </p>
          </>
        ) : (
          <p className="text-xs text-text-secondary">{t('objectRemovePreviewHint')}</p>
        )}

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
          {isPreviewing ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewImageUrl!}
              alt=""
              className="absolute inset-0 h-full w-full object-contain pointer-events-none"
              draggable={false}
            />
          ) : (
            <>
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
            </>
          )}
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
          {isErasing ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
              <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden />
            </div>
          ) : null}
          <canvas ref={maskCanvasRef} className="hidden" aria-hidden />
          <canvas ref={sourceCanvasRef} className="hidden" aria-hidden />
        </div>
      </div>
    );
  }
);
