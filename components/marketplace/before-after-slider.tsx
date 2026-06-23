'use client';

import { useCallback, useRef, useState } from 'react';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

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

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative w-full aspect-video rounded-lg overflow-hidden border border-border-default select-none cursor-col-resize"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={afterSrc} alt={afterLabel} className="absolute inset-0 w-full h-full object-cover" draggable={false} />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeSrc} alt={beforeLabel} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      </div>

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2">
            <path d="M8 5L3 12L8 19M16 5L21 12L16 19" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <span className="absolute top-3 left-3 text-xs font-medium bg-black/60 text-white px-2 py-1 rounded">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 text-xs font-medium bg-black/60 text-white px-2 py-1 rounded">
        {afterLabel}
      </span>
    </div>
  );
}
