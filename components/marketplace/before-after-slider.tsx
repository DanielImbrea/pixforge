'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  afterBackground?: 'white' | 'checkerboard';
  objectFit?: 'cover' | 'contain';
  /** @deprecated use objectFit */
  afterObjectFit?: 'cover' | 'contain';
  /** Size container to match output dimensions (upscale compare). */
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  className?: string;
}

const CHECKERBOARD_STYLE = {
  backgroundColor: '#ffffff',
  backgroundImage: `
    linear-gradient(45deg, #e4e4e7 25%, transparent 25%),
    linear-gradient(-45deg, #e4e4e7 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e4e4e7 75%),
    linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)
  `,
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
} as const;

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before',
  afterLabel = 'After',
  afterBackground,
  objectFit,
  afterObjectFit = 'cover',
  intrinsicWidth,
  intrinsicHeight,
  className,
}: BeforeAfterSliderProps) {
  const fit = objectFit ?? afterObjectFit;
  const useIntrinsicSize = Boolean(intrinsicWidth && intrinsicHeight && intrinsicWidth > 0 && intrinsicHeight > 0);
  const imageFitClass =
    fit === 'contain'
      ? useIntrinsicSize
        ? 'object-contain object-center'
        : 'object-contain object-center p-4 md:p-8'
      : 'object-cover object-center';
  const [position, setPosition] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(container.getBoundingClientRect().width);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, ratio)));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const sharedImageStyle =
    containerWidth > 0
      ? {
          width: containerWidth,
          maxWidth: 'none' as const,
        }
      : undefined;

  return (
    <div
      className={cn('w-full', useIntrinsicSize ? 'flex justify-center' : undefined, className)}
      style={
        useIntrinsicSize
          ? {
              maxHeight: 'min(70vh, 900px)',
            }
          : undefined
      }
    >
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={cn(
          'relative w-full overflow-hidden rounded-lg border border-border-default select-none cursor-col-resize touch-none',
          !useIntrinsicSize && 'aspect-video'
        )}
        style={
          useIntrinsicSize
            ? {
                aspectRatio: `${intrinsicWidth} / ${intrinsicHeight}`,
                maxWidth: `min(100%, ${intrinsicWidth}px)`,
                maxHeight: 'min(70vh, 900px)',
                width: '100%',
              }
            : undefined
        }
      >
        <div
          className="absolute inset-0 bg-background-secondary"
          style={afterBackground === 'checkerboard' ? CHECKERBOARD_STYLE : undefined}
        >
          {afterBackground === 'white' ? <div className="absolute inset-0 bg-white" /> : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={afterSrc}
            alt={afterLabel}
            className={`absolute top-0 left-0 h-full ${imageFitClass}`}
            style={sharedImageStyle}
            draggable={false}
          />
        </div>

        <div
          className="absolute top-0 left-0 bottom-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeSrc}
            alt={beforeLabel}
            className={`absolute top-0 left-0 h-full ${imageFitClass}`}
            style={sharedImageStyle}
            draggable={false}
          />
        </div>

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2">
              <path d="M8 5L3 12L8 19M16 5L21 12L16 19" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <span className="absolute top-3 left-3 text-xs font-medium bg-black/60 text-white px-2 py-1 rounded pointer-events-none">
          {beforeLabel}
        </span>
        <span className="absolute top-3 right-3 text-xs font-medium bg-black/60 text-white px-2 py-1 rounded pointer-events-none">
          {afterLabel}
        </span>
      </div>
    </div>
  );
}
