/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The focused viewport is a custom pointer-and-keyboard pan surface. */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSettings } from '@/hooks/useSettings';
import type { BoardZoomLevel } from '@/lib/settings';

const ZOOM_LEVELS: readonly BoardZoomLevel[] = [1, 1.25, 1.5, 2];

export interface ZoomableBoardMetrics {
  fitCellSize: number;
  cellSize: number;
  zoom: BoardZoomLevel;
  requiresTapToConfirm: boolean;
  shouldStartZoomed: boolean;
}

interface ZoomableBoardProps {
  gameId: string;
  rows: number;
  columns: number;
  children: ReactNode | ((metrics: ZoomableBoardMetrics) => ReactNode);
  className?: string;
  focusPoint?: { x: number; y: number };
  onMetricsChange?: (metrics: ZoomableBoardMetrics) => void;
}

interface Size {
  width: number;
  height: number;
}

interface PointerPosition {
  x: number;
  y: number;
}

function isZoomLevel(value: number): value is BoardZoomLevel {
  return ZOOM_LEVELS.includes(value as BoardZoomLevel);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(first: PointerPosition, second: PointerPosition): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function nextZoomLevel(current: BoardZoomLevel, direction: -1 | 1): BoardZoomLevel {
  const index = ZOOM_LEVELS.indexOf(current);
  return ZOOM_LEVELS[clamp(index + direction, 0, ZOOM_LEVELS.length - 1)]!;
}

function centerOffset(offset: number): string {
  return `calc(-50% ${offset < 0 ? '-' : '+'} ${Math.abs(offset)}px)`;
}

export default function ZoomableBoard({
  gameId,
  rows,
  columns,
  children,
  className = '',
  focusPoint = { x: 0.5, y: 0.5 },
  onMetricsChange,
}: ZoomableBoardProps) {
  const { settings, updateSettings } = useSettings();
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, PointerPosition>());
  const dragStart = useRef<{ pointer: PointerPosition; pan: PointerPosition } | null>(null);
  const pinchStart = useRef<{ distance: number; zoom: BoardZoomLevel } | null>(null);
  const initializedForFit = useRef(false);
  const persistedZoom = settings.boardZoomLevels[gameId];
  const initialZoom = isZoomLevel(persistedZoom ?? 1) ? (persistedZoom ?? 1) : 1;
  const [zoom, setZoomState] = useState<BoardZoomLevel>(initialZoom);
  const [pan, setPan] = useState<PointerPosition>({ x: 0, y: 0 });
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [announcement, setAnnouncement] = useState(`Zoom ${initialZoom * 100} percent`);

  const boardSize = useMemo(() => {
    if (size.width <= 0 || size.height <= 0 || rows <= 0 || columns <= 0) {
      return { width: 0, height: 0 };
    }
    const width = Math.min(size.width, (size.height * columns) / rows);
    return { width, height: (width * rows) / columns };
  }, [columns, rows, size.height, size.width]);

  const fitCellSize = columns > 0 ? boardSize.width / columns : 0;
  const shouldStartZoomed = fitCellSize > 0 && fitCellSize < 28;
  const metrics = useMemo<ZoomableBoardMetrics>(
    () => ({
      fitCellSize,
      cellSize: fitCellSize * zoom,
      zoom,
      requiresTapToConfirm: fitCellSize < 44,
      shouldStartZoomed,
    }),
    [fitCellSize, shouldStartZoomed, zoom],
  );

  const clampPan = useCallback(
    (requested: PointerPosition, scale = zoom): PointerPosition => {
      const maxX = Math.max(0, (boardSize.width * scale - size.width) / 2);
      const maxY = Math.max(0, (boardSize.height * scale - size.height) / 2);
      return {
        x: clamp(requested.x, -maxX, maxX),
        y: clamp(requested.y, -maxY, maxY),
      };
    },
    [boardSize.height, boardSize.width, size.height, size.width, zoom],
  );

  const setZoom = useCallback(
    (value: BoardZoomLevel, focus = focusPoint) => {
      setZoomState(value);
      setAnnouncement(`Zoom ${value * 100} percent`);
      setPan(
        clampPan(
          {
            x: -(focus.x - 0.5) * boardSize.width * value,
            y: -(focus.y - 0.5) * boardSize.height * value,
          },
          value,
        ),
      );
      if (settings.boardZoomLevels[gameId] !== value) {
        updateSettings({
          boardZoomLevels: { ...settings.boardZoomLevels, [gameId]: value },
        });
      }
    },
    [
      boardSize.height,
      boardSize.width,
      clampPan,
      focusPoint,
      gameId,
      settings.boardZoomLevels,
      updateSettings,
    ],
  );

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const bounds = viewport.getBoundingClientRect();
      setSize({ width: bounds.width, height: bounds.height });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldStartZoomed || initializedForFit.current || persistedZoom !== undefined) return;
    initializedForFit.current = true;
    const neededZoom = 28 / fitCellSize;
    const startingZoom = ZOOM_LEVELS.find((level) => level >= neededZoom) ?? 2;
    setZoom(startingZoom);
  }, [fitCellSize, persistedZoom, setZoom, shouldStartZoomed]);

  useEffect(() => {
    onMetricsChange?.(metrics);
  }, [metrics, onMetricsChange]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    if (pointers.current.size === 1) dragStart.current = { pointer: point, pan };
    if (pointers.current.size === 2) {
      const [first, second] = [...pointers.current.values()];
      if (first && second) pinchStart.current = { distance: distance(first, second), zoom };
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    event.preventDefault();
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    if (pointers.current.size >= 2 && pinchStart.current) {
      const [first, second] = [...pointers.current.values()];
      if (!first || !second) return;
      const ratio = distance(first, second) / Math.max(1, pinchStart.current.distance);
      const target = pinchStart.current.zoom * ratio;
      const nearest = ZOOM_LEVELS.reduce((best, level) =>
        Math.abs(level - target) < Math.abs(best - target) ? level : best,
      );
      if (nearest !== zoom) setZoom(nearest);
      return;
    }
    if (dragStart.current) {
      setPan(
        clampPan({
          x: dragStart.current.pan.x + point.x - dragStart.current.pointer.x,
          y: dragStart.current.pan.y + point.y - dragStart.current.pointer.y,
        }),
      );
    }
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    dragStart.current = null;
    pinchStart.current = null;
  };

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      setZoom(nextZoomLevel(zoom, direction));
    },
    [setZoom, zoom],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      setZoom(nextZoomLevel(zoom, 1));
    } else if (event.key === '-') {
      event.preventDefault();
      setZoom(nextZoomLevel(zoom, -1));
    } else if (event.key === '0') {
      event.preventDefault();
      setZoom(1);
    } else if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      const step = 32;
      const delta = {
        x: event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0,
        y: event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0,
      };
      setPan(clampPan({ x: pan.x + delta.x, y: pan.y + delta.y }));
    }
  };

  const reducedMotion =
    settings.reducedMotion ||
    (typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const board = typeof children === 'function' ? children(metrics) : children;

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex items-center justify-center gap-2" aria-label="Board zoom controls">
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => setZoom(nextZoomLevel(zoom, -1))}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
        >
          −
        </button>
        <span className="min-w-16 text-center text-sm font-semibold" aria-hidden="true">
          {zoom === 1 ? 'Fit' : `${zoom * 100}%`}
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => setZoom(nextZoomLevel(zoom, 1))}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Fit board"
          title="Fit board"
          onClick={() => setZoom(1)}
          className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
        >
          Fit
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div
        ref={viewportRef}
        data-zoomable-pan-area
        data-zoom={zoom}
        data-fit-cell-size={fitCellSize}
        role="application"
        tabIndex={0}
        aria-label={`${gameId} board pan area. Use plus and minus to zoom, zero to fit, and arrow keys to pan.`}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className="relative mx-auto w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        style={{ aspectRatio: `${columns} / ${rows}`, maxHeight: '70dvh', touchAction: 'none' }}
      >
        {boardSize.width > 0 && (
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: boardSize.width,
              height: boardSize.height,
              transform: `translate(${centerOffset(pan.x)}, ${centerOffset(pan.y)}) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: reducedMotion ? 'none' : 'transform 120ms ease-out',
            }}
          >
            <div className="h-full w-full">{board}</div>
          </div>
        )}
      </div>
    </div>
  );
}
