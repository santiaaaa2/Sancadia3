import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SettingsProvider from '@/components/SettingsProvider';
import StatsProvider from '@/components/StatsProvider';
import GameScreen from '@/screens/GameScreen';
import { games } from '@/games/registry';

const gamesWithSetup = new Set([
  'noughts-and-crosses',
  'connect-4',
  'gomoku',
  'reversi',
  'checkers',
  'xiangqi',
  'battleships',
  'mastermind',
  'bullscows',
  'hangman',
]);

function renderGame(gameId: string) {
  return render(
    <MemoryRouter initialEntries={[`/games/${gameId}`]}>
      <SettingsProvider>
        <StatsProvider>
          <Routes>
            <Route path="/games/:gameId" element={<GameScreen />} />
          </Routes>
        </StatsProvider>
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe('shared game pre-start layout', () => {
  const originalWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
    vi.restoreAllMocks();
  });

  it.each([360, 430])(
    'places Start, setup options, and links in order for every available game at %ipx',
    async (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      for (const game of games.filter(
        (entry) => entry.status === 'available' && gamesWithSetup.has(entry.id),
      )) {
        const view = renderGame(game.id);
        const start = await screen.findByRole('button', { name: 'Start game' });
        const setup = screen.getByTestId('game-setup-card');
        const rules = screen.getByRole('link', { name: `How to play ${game.name}` });
        const gameSettings = screen.getByRole('link', { name: 'Game settings' });
        const parent = start.parentElement;

        expect(parent).not.toBeNull();
        expect(start.className).toContain('w-full');
        expect(start.className).toContain('min-h-11');
        expect(start.getAttribute('aria-describedby')).toBeTruthy();
        expect(
          document.getElementById(start.getAttribute('aria-describedby')!)?.textContent,
        ).toMatch(/Solo|2 Players|Vs Computer/);
        expect(
          start.compareDocumentPosition(setup) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
        expect(
          setup.compareDocumentPosition(rules) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
        expect(
          rules.compareDocumentPosition(gameSettings) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
        expect(
          within(parent as HTMLElement).getAllByRole('button', { name: 'Start game' }),
        ).toHaveLength(1);

        view.unmount();
      }
    },
  );

  it('starts the puzzle with the chosen mode and difficulty', async () => {
    const user = userEvent.setup();
    renderGame('mastermind');

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Difficulty' }), 'expert');
    await user.click(screen.getByRole('button', { name: '2 Players' }));
    expect(
      screen.getByRole('button', { name: 'Start game' }).getAttribute('aria-describedby'),
    ).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Start game' }));

    expect(screen.getByLabelText('Player 1 secret (5 symbols)')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start game' })).toBeNull();
  });

  it('starts a match using the selected order and difficulty', async () => {
    const user = userEvent.setup();
    renderGame('connect-4');

    await user.click(await screen.findByRole('radio', { name: 'Go second' }));
    await user.click(screen.getByRole('radio', { name: 'Expert' }));
    const start = screen.getByRole('button', { name: 'Start game' });
    expect(document.getElementById(start.getAttribute('aria-describedby')!)?.textContent).toContain(
      'Expert',
    );
    expect(document.getElementById(start.getAttribute('aria-describedby')!)?.textContent).toContain(
      'second',
    );
    await user.click(start);

    expect(screen.getByRole('group', { name: 'Connect 4 board' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start game' })).toBeNull();
  });
});
