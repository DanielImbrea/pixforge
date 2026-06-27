'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import type { CropAspectRatio, CropParams } from '@/lib/tools/crop-params';
import {
  CROP_ASPECT_RATIOS,
  buildCropPreviewTransform,
  clampCropRect,
  clampCropMove,
  getOrientedDimensions,
  initCropRectForImage,
  parseAspectRatioValue,
} from '@/lib/tools/crop-params';

interface CropEditorProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  value: CropParams;
  onChange: (value: CropParams) => void;
  /** Hide aspect presets and transform controls (portrait reference crop). */
  compact?: boolean;
}

type DragMode = 'move' | 'draw' | 'resize';
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function getHandleStyle(handle: ResizeHandle): CSSProperties {
  const base: CSSProperties = {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: 'white',
    border: '2px solid var(--color-accent, #6366f1)',
    transform: 'translate(-50%, -50%)',
    touchAction: 'none',
  };

  const positions: Record<ResizeHandle, Pick<CSSProperties, 'left' | 'top' | 'cursor'>> = {
    nw: { left: '0%', top: '0%', cursor: 'nwse-resize' },
    n: { left: '50%', top: '0%', cursor: 'ns-resize' },
    ne: { left: '100%', top: '0%', cursor: 'nesw-resize' },
    e: { left: '100%', top: '50%', cursor: 'ew-resize' },
    se: { left: '100%', top: '100%', cursor: 'nwse-resize' },
    s: { left: '50%', top: '100%', cursor: 'ns-resize' },
    sw: { left: '0%', top: '100%', cursor: 'nesw-resize' },
    w: { left: '0%', top: '50%', cursor: 'ew-resize' },
  };

  return { ...base, ...positions[handle] };
}

function isPointInRect(
  x: number,
  y: number,
  rect: Pick<CropParams, 'left' | 'top' | 'width' | 'height'>
): boolean {
  return (
    x >= rect.left &&
    x <= rect.left + rect.width &&
    y >= rect.top &&
    y <= rect.top + rect.height
  );
}

function applyResize(
  handle: ResizeHandle,
  startRect: Pick<CropParams, 'left' | 'top' | 'width' | 'height'>,
  deltaX: number,
  deltaY: number,
  imageWidth: number,
  imageHeight: number,
  lockAspect: number | null
): Pick<CropParams, 'left' | 'top' | 'width' | 'height'> {
  let { left, top, width, height } = startRect;
  const right = left + width;
  const bottom = top + height;

  if (handle.includes('w')) {
    left = Math.min(left + deltaX, right - 8);
    width = right - left;
  }
  if (handle.includes('e')) {
    width = Math.max(8, width + deltaX);
  }
  if (handle.includes('n')) {
    top = Math.min(top + deltaY, bottom - 8);
    height = bottom - top;
  }
  if (handle.includes('s')) {
    height = Math.max(8, height + deltaY);
  }

  if (lockAspect) {
    height = Math.round(width / lockAspect);
    if (handle.includes('n')) {
      top = bottom - height;
    }
    if (top < 0) {
      top = 0;
      height = bottom - top;
      width = Math.round(height * lockAspect);
      if (handle.includes('w')) left = right - width;
    }
    if (left + width > imageWidth) {
      width = imageWidth - left;
      height = Math.round(width / lockAspect);
      if (handle.includes('n')) top = bottom - height;
    }
    if (top + height > imageHeight) {
      height = imageHeight - top;
      width = Math.round(height * lockAspect);
      if (handle.includes('w')) left = right - width;
    }
  }

  return clampCropRect({ left, top, width, height }, imageWidth, imageHeight);
}

export function CropEditor({
  imageUrl,
  imageWidth,
  imageHeight,
  value,
  onChange,
  compact = false,
}: CropEditorProps) {
  const t = useTranslations('tool');
  const stageRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    startRect?: Pick<CropParams, 'left' | 'top' | 'width' | 'height'>;
    resizeHandle?: ResizeHandle;
  } | null>(null);

  const oriented = useMemo(
    () => getOrientedDimensions(imageWidth, imageHeight, value.rotate),
    [imageWidth, imageHeight, value.rotate]
  );

  const previewTransform = useMemo(
    () => buildCropPreviewTransform(value),
    [value.flipHorizontal, value.flipVertical, value.rotate]
  );

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
  }, [oriented.width, oriented.height]);

  const scaleX = displaySize.width > 0 ? oriented.width / displaySize.width : 1;
  const scaleY = displaySize.height > 0 ? oriented.height / displaySize.height : 1;

  const toImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
      return {
        x: Math.round(x * scaleX),
        y: Math.round(y * scaleY),
      };
    },
    [scaleX, scaleY]
  );

  const applyAspect = useCallback(
    (rect: Pick<CropParams, 'left' | 'top' | 'width' | 'height'>, ratio: CropAspectRatio) => {
      const aspect = parseAspectRatioValue(ratio);
      if (!aspect) return rect;
      let width = rect.width;
      let height = Math.round(width / aspect);
      if (height > oriented.height) {
        height = oriented.height;
        width = Math.round(height * aspect);
      }
      return clampCropRect(
        { left: rect.left, top: rect.top, width, height },
        oriented.width,
        oriented.height
      );
    },
    [oriented.height, oriented.width]
  );

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const point = toImageCoords(event.clientX, event.clientY);
    const resizeHandle = (event.target as HTMLElement).dataset.resizeHandle as
      | ResizeHandle
      | undefined;

    if (compact && resizeHandle && RESIZE_HANDLES.includes(resizeHandle)) {
      dragRef.current = {
        mode: 'resize',
        startX: point.x,
        startY: point.y,
        offsetX: 0,
        offsetY: 0,
        startRect: {
          left: value.left,
          top: value.top,
          width: value.width,
          height: value.height,
        },
        resizeHandle,
      };
      stageRef.current?.setPointerCapture(event.pointerId);
      return;
    }

    const canMoveExisting =
      value.width > 0 &&
      isPointInRect(point.x, point.y, value) &&
      (value.aspectRatio !== 'free' || compact);

    if (canMoveExisting) {
      dragRef.current = {
        mode: 'move',
        startX: point.x,
        startY: point.y,
        offsetX: point.x - value.left,
        offsetY: point.y - value.top,
      };
    } else if (value.aspectRatio === 'free') {
      dragRef.current = {
        mode: 'draw',
        startX: point.x,
        startY: point.y,
        offsetX: 0,
        offsetY: 0,
      };
    } else {
      dragRef.current = {
        mode: 'move',
        startX: point.x,
        startY: point.y,
        offsetX: point.x - value.left,
        offsetY: point.y - value.top,
      };
    }

    stageRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragRef.current) return;
    const point = toImageCoords(event.clientX, event.clientY);
    const drag = dragRef.current;

    if (drag.mode === 'move') {
      const rect = clampCropMove(
        {
          left: point.x - drag.offsetX,
          top: point.y - drag.offsetY,
          width: value.width,
          height: value.height,
        },
        oriented.width,
        oriented.height
      );
      onChange({ ...value, ...rect });
      return;
    }

    if (drag.mode === 'resize' && drag.startRect && drag.resizeHandle) {
      const lockAspect = compact ? null : parseAspectRatioValue(value.aspectRatio);
      const rect = applyResize(
        drag.resizeHandle,
        drag.startRect,
        point.x - drag.startX,
        point.y - drag.startY,
        oriented.width,
        oriented.height,
        lockAspect
      );
      onChange({ ...value, ...rect });
      return;
    }

    const { startX, startY } = drag;
    let left = Math.min(startX, point.x);
    let top = Math.min(startY, point.y);
    let width = Math.abs(point.x - startX);
    let height = Math.abs(point.y - startY);

    if (width < 8) width = 8;
    if (height < 8) height = 8;

    const rect = clampCropRect({ left, top, width, height }, oriented.width, oriented.height);
    onChange({ ...value, ...rect });
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    dragRef.current = null;
    if (stageRef.current?.hasPointerCapture(event.pointerId)) {
      stageRef.current.releasePointerCapture(event.pointerId);
    }
  };

  const setAspectRatio = (aspectRatio: CropAspectRatio) => {
    const rect = initCropRectForImage(oriented.width, oriented.height, aspectRatio);
    onChange({ ...value, aspectRatio, ...rect });
  };

  const rotate = () => {
    const next = value.rotate === 270 ? 0 : ((value.rotate + 90) as CropParams['rotate']);
    const nextOriented = getOrientedDimensions(imageWidth, imageHeight, next);
    const rect = initCropRectForImage(nextOriented.width, nextOriented.height, value.aspectRatio);
    onChange({ ...value, rotate: next, ...rect });
  };

  const overlayStyle =
    displaySize.width > 0 && value.width > 0
      ? {
          left: `${(value.left / oriented.width) * 100}%`,
          top: `${(value.top / oriented.height) * 100}%`,
          width: `${(value.width / oriented.width) * 100}%`,
          height: `${(value.height / oriented.height) * 100}%`,
        }
      : undefined;

  const shadeBands = overlayStyle
    ? {
        top: (value.top / oriented.height) * 100,
        left: (value.left / oriented.width) * 100,
        bottom: ((value.top + value.height) / oriented.height) * 100,
        right: ((value.left + value.width) / oriented.width) * 100,
      }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border-default bg-background-secondary p-3 sm:p-4">
        <div
          ref={stageRef}
          className={`relative mx-auto w-full overflow-hidden rounded-md touch-none select-none ${
            value.aspectRatio === 'free' && !compact
              ? 'cursor-crosshair'
              : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{
            aspectRatio: `${oriented.width} / ${oriented.height}`,
            maxHeight: 'min(72vh, 560px)',
            minHeight: '320px',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            style={{
              transform: previewTransform,
              transformOrigin: 'center center',
            }}
            draggable={false}
          />
          {shadeBands && overlayStyle ? (
            <div className="pointer-events-none absolute inset-0">
              <div
                className="absolute inset-x-0 top-0 bg-black/40"
                style={{ height: `${shadeBands.top}%` }}
              />
              <div
                className="absolute inset-x-0 bottom-0 bg-black/40"
                style={{ height: `${100 - shadeBands.bottom}%` }}
              />
              <div
                className="absolute left-0 bg-black/40"
                style={{
                  top: `${shadeBands.top}%`,
                  width: `${shadeBands.left}%`,
                  height: `${shadeBands.bottom - shadeBands.top}%`,
                }}
              />
              <div
                className="absolute right-0 bg-black/40"
                style={{
                  top: `${shadeBands.top}%`,
                  width: `${100 - shadeBands.right}%`,
                  height: `${shadeBands.bottom - shadeBands.top}%`,
                }}
              />
              <div className="absolute border-2 border-accent pointer-events-none" style={overlayStyle} />
              {compact ? (
                <div className="absolute pointer-events-auto" style={overlayStyle}>
                  {RESIZE_HANDLES.map((handle) => (
                    <div
                      key={handle}
                      data-resize-handle={handle}
                      className="absolute z-10"
                      style={getHandleStyle(handle)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {!compact ? (
        <div className="flex flex-wrap gap-2">
          {CROP_ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => setAspectRatio(ratio)}
              className={`rounded-md border px-3 py-1.5 text-xs ${
                value.aspectRatio === ratio
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-default text-text-secondary hover:border-accent/40'
              }`}
            >
              {ratio === 'free' ? t('cropAspectFree') : ratio}
            </button>
          ))}
        </div>
      ) : null}

      {!compact ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={rotate}
            className={`rounded-md border px-3 py-1.5 text-xs ${
              value.rotate !== 0
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-default text-text-secondary hover:border-accent/40'
            }`}
          >
            {t('cropRotate')}
            {value.rotate ? ` (${value.rotate}°)` : ''}
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, flipHorizontal: !value.flipHorizontal })}
            className={`rounded-md border px-3 py-1.5 text-xs ${
              value.flipHorizontal
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-default text-text-secondary hover:border-accent/40'
            }`}
          >
            {t('cropFlipHorizontal')}
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, flipVertical: !value.flipVertical })}
            className={`rounded-md border px-3 py-1.5 text-xs ${
              value.flipVertical
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-default text-text-secondary hover:border-accent/40'
            }`}
          >
            {t('cropFlipVertical')}
          </button>
        </div>
      ) : null}

      <p className="text-xs text-text-tertiary">
        {compact
          ? t('blurFacesPortraitCropDragHint')
          : value.aspectRatio === 'free'
            ? t('cropFreeHint')
            : t('cropLockedHint')}
      </p>
      {!compact ? (
        <p className="text-xs text-text-tertiary">
          {t('cropSelectionHint', {
            width: value.width,
            height: value.height,
            left: value.left,
            top: value.top,
          })}
        </p>
      ) : null}
    </div>
  );
}
