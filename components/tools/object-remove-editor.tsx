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
  cancelSamHoverSegment,
  clearSamClicks,
  commitSamClickForUndo,
  isSamEmbeddingReady,
  preloadSamModels,
  prepareSamImage,
  resetSamSession,
  SamSegmentError,
  segmentSamAtClickWithAssist,
  segmentSamAtHover,
  undoSamClick,
} from '@/lib/image/sam-segment-browser';
import { clickCentroidFromSamMask } from '@/lib/tools/object-remove-sam-postprocess';
import { imageToDisplayCoords, pointerToImageCoords } from '@/lib/tools/object-remove-coords';
import {
  HOVER_DEBOUNCE_MS,
  HOVER_MASK_OVERLAP_SKIP,
  maskAlphaOverlapRatio,
} from '@/lib/tools/object-remove-hover-preview';
import {
  applyProcessedMaskToSelection,
  countMaskPixels,
  drawHoverPreviewOverlay,
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

export interface ObjectRemoveEditorHandle {
  /** JPEG aligned to the same pixel grid as the mask (what the user edited). */
  exportSourceImageFile: () => Promise<File | null>;
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
    const hoverCanvasRef = useRef<HTMLCanvasElement>(null);
    const samPrepareStartedRef = useRef(false);
    const hoverDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hoverPreviewMaskRef = useRef<ImageData | null>(null);
    const hoverPreviewPointRef = useRef<{ x: number; y: number } | null>(null);
    const [samEmbeddingReady, setSamEmbeddingReady] = useState(false);
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
    const [brushMode, setBrushMode] = useState<BrushMode>('paint');
    const [hasMask, setHasMask] = useState(false);
    const [imageReady, setImageReady] = useState(false);
    const [samReady, setSamReady] = useState(false);
    const [samLoading, setSamLoading] = useState(false);
    const [samError, setSamError] = useState<string | null>(null);
    const [segmenting, setSegmenting] = useState(false);
    const [pendingClick, setPendingClick] = useState<{ x: number; y: number } | null>(null);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
    const [cursorInside, setCursorInside] = useState(false);
    const drawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    const isPreviewing = Boolean(previewImageUrl);
    const isEditingDisabled = isPreviewing || isErasing;

    const clearHoverPreview = useCallback(() => {
      if (hoverDebounceRef.current) {
        clearTimeout(hoverDebounceRef.current);
        hoverDebounceRef.current = null;
      }
      cancelSamHoverSegment();
      hoverPreviewMaskRef.current = null;
      hoverPreviewPointRef.current = null;
      const hoverCanvas = hoverCanvasRef.current;
      const hoverCtx = hoverCanvas?.getContext('2d');
      if (hoverCtx && hoverCanvas) {
        hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
      }
    }, []);

    const resetMaskCanvases = useCallback(() => {
      const maskCanvas = maskCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      if (!maskCanvas || !overlayCanvas) return;

      const maskCtx = maskCanvas.getContext('2d');
      const overlayCtx = overlayCanvas.getContext('2d');
      if (!maskCtx || !overlayCtx) return;

      maskCtx.fillStyle = '#000000';
      maskCtx.fillRect(0, 0, imageWidth, imageHeight);
      overlayCtx.clearRect(0, 0, imageWidth, imageHeight);
      clearHoverPreview();
      clearSamClicks();
      setHasMask(false);
      onMaskChange?.(false);
    }, [clearHoverPreview, imageHeight, imageWidth, onMaskChange]);

    const resetForNewImage = useCallback(() => {
      const maskCanvas = maskCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      if (!maskCanvas || !overlayCanvas) return;

      maskCanvas.width = imageWidth;
      maskCanvas.height = imageHeight;
      overlayCanvas.width = imageWidth;
      overlayCanvas.height = imageHeight;
      const hoverCanvas = hoverCanvasRef.current;
      if (hoverCanvas) {
        hoverCanvas.width = imageWidth;
        hoverCanvas.height = imageHeight;
      }

      resetSamSession();
      samPrepareStartedRef.current = false;
      setSamEmbeddingReady(false);
      setSamError(null);
      resetMaskCanvases();
    }, [imageHeight, imageWidth, resetMaskCanvases]);

    useEffect(() => {
      resetForNewImage();
    }, [imageUrl, resetForNewImage]);

    useEffect(() => {
      void preloadSamModels().catch(() => undefined);
    }, []);

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
    const pendingClickDisplay =
      pendingClick && displaySize.width > 0
        ? imageToDisplayCoords(
            pendingClick.x,
            pendingClick.y,
            displaySize.width,
            displaySize.height,
            imageWidth,
            imageHeight
          )
        : null;
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

    const runSamPrepare = useCallback(() => {
      if (samPrepareStartedRef.current || !imageReady) return;

      samPrepareStartedRef.current = true;
      setSamLoading(true);
      setSamError(null);

      void (async () => {
        try {
          await preloadSamModels();
          await prepareSamImage(imageUrl);
          setSamEmbeddingReady(true);
        } catch (err) {
          setSamError(
            err instanceof Error ? err.message : 'Smart selection failed to load.'
          );
          setSamEmbeddingReady(false);
          samPrepareStartedRef.current = false;
        } finally {
          setSamLoading(false);
        }
      })();
    }, [imageReady, imageUrl]);

    useEffect(() => {
      if (imageReady) {
        runSamPrepare();
      }
    }, [imageReady, runSamPrepare]);

    useEffect(() => {
      if (selectionTool === 'brush') {
        clearHoverPreview();
      }
    }, [clearHoverPreview, selectionTool]);

    const scheduleHoverPreview = useCallback(
      (point: { x: number; y: number }) => {
        if (
          selectionTool !== 'click' ||
          isEditingDisabled ||
          !samEmbeddingReady ||
          segmenting
        ) {
          return;
        }

        if (hoverDebounceRef.current) {
          clearTimeout(hoverDebounceRef.current);
        }

        hoverDebounceRef.current = setTimeout(() => {
          hoverDebounceRef.current = null;
          const generation = cancelSamHoverSegment();
          const hoverCanvas = hoverCanvasRef.current;
          const hoverCtx = hoverCanvas?.getContext('2d');
          if (!hoverCtx || !hoverCanvas) return;

          void (async () => {
            try {
              const result = await segmentSamAtHover(
                point,
                imageWidth,
                imageHeight,
                generation
              );
              if (!result) return;

              const { processed, point: hoverPoint } = result;
              const previous = hoverPreviewMaskRef.current;
              if (
                previous &&
                maskAlphaOverlapRatio(previous, processed) >= HOVER_MASK_OVERLAP_SKIP
              ) {
                hoverPreviewPointRef.current = hoverPoint;
                return;
              }

              drawHoverPreviewOverlay(hoverCtx, processed, imageWidth, imageHeight);
              hoverPreviewMaskRef.current = processed;
              hoverPreviewPointRef.current = hoverPoint;
            } catch {
              // Hover preview is best-effort; ignore transient failures.
            }
          })();
        }, HOVER_DEBOUNCE_MS);
      },
      [
        imageHeight,
        imageWidth,
        isEditingDisabled,
        samEmbeddingReady,
        segmenting,
        selectionTool,
      ]
    );

    const confirmHoverSelection = useCallback(
      (point: { x: number; y: number }, exclude: boolean) => {
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const maskCtx = maskCanvas?.getContext('2d');
        const overlayCtx = overlayCanvas?.getContext('2d');
        if (!maskCanvas || !maskCtx || !overlayCtx) return false;

        const processed = hoverPreviewMaskRef.current;
        if (!processed) return false;

        const hadMask = countMaskPixels(maskCtx, imageWidth, imageHeight) > 0;
        clearHoverPreview();

        if (exclude) {
          mergeSamMaskIntoCanvas(
            maskCtx,
            overlayCtx,
            processed,
            imageWidth,
            imageHeight,
            true
          );
          commitSamClickForUndo(point, 'exclude');
        } else if (hadMask) {
          mergeSamMaskIntoCanvas(
            maskCtx,
            overlayCtx,
            processed,
            imageWidth,
            imageHeight,
            false
          );
          commitSamClickForUndo(point, 'include');
        } else {
          clearSamClicks();
          applyProcessedMaskToSelection(maskCtx, overlayCtx, processed, imageWidth, imageHeight);
          commitSamClickForUndo(point, 'include');
        }

        refreshMaskState();
        return true;
      },
      [clearHoverPreview, imageHeight, imageWidth, refreshMaskState]
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

        clearHoverPreview();

        if (!samEmbeddingReady && !isSamEmbeddingReady()) {
          setSamError(t('objectRemoveSamNotReady'));
          return;
        }

        setSegmenting(true);
        setSamError(null);
        setPendingClick(point);

        const clickType = exclude || brushMode === 'erase' ? 'exclude' : 'include';

        try {
          const samMask = await segmentSamAtClickWithAssist(
            sourceCanvas,
            point,
            clickType,
            imageWidth,
            imageHeight
          );
          if (samMask) {
            if (exclude || countMaskPixels(maskCtx, imageWidth, imageHeight) > 0) {
              mergeSamMaskIntoCanvas(
                maskCtx,
                overlayCtx,
                samMask,
                imageWidth,
                imageHeight,
                exclude
              );
            } else {
              setMaskFromSam(maskCtx, overlayCtx, samMask, imageWidth, imageHeight, point);
            }
          }
        } catch (err) {
          const message =
            err instanceof SamSegmentError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Smart selection failed.';
          setSamError(message);
        } finally {
          setSegmenting(false);
          setPendingClick(null);
          refreshMaskState();
        }
      },
      [
        brushMode,
        clearHoverPreview,
        imageHeight,
        imageReady,
        imageWidth,
        refreshMaskState,
        samEmbeddingReady,
        segmenting,
        t,
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
        const centroid = clickCentroidFromSamMask(samMask);
        setMaskFromSam(maskCtx, overlayCtx, samMask, imageWidth, imageHeight, centroid);
      }
      refreshMaskState();
    }, [imageHeight, imageWidth, isEditingDisabled, refreshMaskState, selectionTool]);

    const clearMask = useCallback(() => {
      resetMaskCanvases();
    }, [resetMaskCanvases]);

    const exportSourceImageFile = useCallback(async (): Promise<File | null> => {
      const sourceCanvas = sourceCanvasRef.current;
      if (!sourceCanvas || !imageReady) return null;

      return new Promise((resolve) => {
        sourceCanvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(null);
              return;
            }
            resolve(
              new File([blob], 'object-remove-input.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
            );
          },
          'image/jpeg',
          0.95
        );
      });
    }, [imageReady]);

    const exportMaskFile = useCallback(async (): Promise<File | null> => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return null;

      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) return null;

      const { width, height } = maskCanvas;
      if (countMaskPixels(maskCtx, width, height) === 0) return null;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = width;
      exportCanvas.height = height;
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) return null;

      const src = maskCtx.getImageData(0, 0, width, height);
      const out = exportCtx.createImageData(width, height);
      for (let i = 0; i < src.data.length; i += 4) {
        const on = src.data[i] > 128;
        const value = on ? 255 : 0;
        out.data[i] = value;
        out.data[i + 1] = value;
        out.data[i + 2] = value;
        out.data[i + 3] = 255;
      }
      exportCtx.putImageData(out, 0, 0);

      return new Promise((resolve) => {
        exportCanvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(new File([blob], 'object-remove-mask.png', { type: 'image/png' }));
        }, 'image/png');
      });
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        exportSourceImageFile,
        exportMaskFile,
        hasMaskContent: () => hasMask,
        clearMask,
      }),
      [clearMask, exportMaskFile, exportSourceImageFile, hasMask]
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
        if (hoverPreviewMaskRef.current && confirmHoverSelection(point, exclude)) {
          return;
        }
        void applySmartClick(point, exclude);
        return;
      }

      clearHoverPreview();
      drawingRef.current = true;
      lastPointRef.current = point;
      drawStroke(point, point);
      refreshMaskState();
      stageRef.current?.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent) => {
      setCursorPos(toDisplayCoords(event.clientX, event.clientY));

      if (selectionTool === 'click' && !isEditingDisabled) {
        const point = toImageCoords(event.clientX, event.clientY);
        scheduleHoverPreview(point);
        return;
      }

      if (!drawingRef.current || !lastPointRef.current || isEditingDisabled) {
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
      clearHoverPreview();
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

    useEffect(() => {
      return () => clearHoverPreview();
    }, [clearHoverPreview]);

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
              {selectionTool === 'click' && samEmbeddingReady ? (
                <p className="text-xs text-text-tertiary">{t('objectRemoveSamReady')}</p>
              ) : null}
              {selectionTool === 'click' && !samEmbeddingReady && !samLoading ? (
                <p className="text-xs text-text-tertiary">{t('objectRemoveSamPreparing')}</p>
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
              className="absolute inset-0 h-full w-full object-contain pointer-events-none bg-white"
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
                ref={hoverCanvasRef}
                className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                style={{ width: '100%', height: '100%' }}
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
          {pendingClickDisplay ? (
            <div
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-accent ring-2 ring-white"
              style={{ left: pendingClickDisplay.x, top: pendingClickDisplay.y }}
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
