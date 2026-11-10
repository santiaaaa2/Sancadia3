import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsProvider from '@/components/SettingsProvider';
import ZoomableBoard, { type ZoomableBoardMetrics } from '@/components/ZoomableBoard';

function renderBoard(rows = 4, columns = 4, metrics?: (value: ZoomableBoardMetrics) => void) {
  return render(
    <SettingsProvider>
      <ZoomableBoard gameId="zoom-test" rows={rows} columns={columns} onMetricsChange={metrics}>
        {(value) => <div data-testid="board-content">Cell size: {value.fitCellSize}</div>}
      </ZoomableBoard>
    </SettingsProvider>,
  );
}

describe('ZoomableBoard', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-zoomable-pan-area')) {
        return {
          width: 300,
          height: 300,
          top: 0,
          right: 300,
          bottom: 300,
          left: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        };
      }
      return {
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports the fit cell size and flags cells below 44px for confirmation', async () => {
    const onMetrics = vi.fn();
    renderBoard(8, 8, onMetrics);

    await waitFor(() =>
      expect(onMetrics).toHaveBeenLastCalledWith(
        expect.objectContaining({
          fitCellSize: 37.5,
          requiresTapToConfirm: true,
          shouldStartZoomed: false,
        }),
      ),
    );
    expect(screen.getByTestId('board-content').textContent).toContain('37.5');
  });

  it('zooms in, restores Fit, and supports keyboard shortcuts', async () => {
    renderBoard();
    const panArea = screen.getByRole('application');

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(panArea.getAttribute('data-zoom')).toBe('1.25');
    expect(screen.getByText('Zoom 125 percent')).toBeTruthy();

    fireEvent.keyDown(panArea, { key: '+' });
    expect(panArea.getAttribute('data-zoom')).toBe('1.5');
    fireEvent.keyDown(panArea, { key: '0' });
    expect(panArea.getAttribute('data-zoom')).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    fireEvent.keyDown(panArea, { key: 'ArrowRight' });
    expect(panArea.querySelector('div')?.getAttribute('style')).toContain('- 32px');

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fit board' }));
    expect(panArea.getAttribute('data-zoom')).toBe('1');
  });

  it('clamps pointer panning to board edges and prevents page scrolling over the board', () => {
    renderBoard();
    const panArea = screen.getByRole('application');
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));

    expect(fireEvent.pointerDown(panArea, { pointerId: 1, clientX: 100, clientY: 100 })).toBe(
      false,
    );
    fireEvent.pointerMove(panArea, { pointerId: 1, clientX: 1000, clientY: 1000 });
    fireEvent.pointerUp(panArea, { pointerId: 1 });

    expect(panArea.getAttribute('style')).toContain('touch-action: none');
    expect(panArea.querySelector('div')?.getAttribute('style')).toContain('+ 75px');
    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 50 });
    panArea.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
  });

  it('pinches to supported zoom levels', () => {
    renderBoard();
    const panArea = screen.getByRole('application');

    fireEvent.pointerDown(panArea, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerDown(panArea, { pointerId: 2, clientX: 200, clientY: 100 });
    fireEvent.pointerMove(panArea, { pointerId: 2, clientX: 300, clientY: 100 });

    expect(panArea.getAttribute('data-zoom')).toBe('2');
    fireEvent.pointerUp(panArea, { pointerId: 2 });
    fireEvent.pointerUp(panArea, { pointerId: 1 });
  });

  it('persists zoom per game and safely starts tiny boards zoomed in', async () => {
    const first = renderBoard();
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(
      JSON.parse(window.localStorage.getItem('classic-games-arcade:settings') ?? '{}'),
    ).toMatchObject({ boardZoomLevels: { 'zoom-test': 1.25 } });
    first.unmount();
    const second = renderBoard();
    expect(screen.getByRole('application').getAttribute('data-zoom')).toBe('1.25');
    second.unmount();

    window.localStorage.clear();
    renderBoard(20, 20);
    await waitFor(() =>
      expect(screen.getByRole('application').getAttribute('data-zoom')).toBe('2'),
    );
  });
});
