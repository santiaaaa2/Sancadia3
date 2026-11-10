import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import SettingsProvider from '@/components/SettingsProvider';
import StatsProvider from '@/components/StatsProvider';
import GamesScreen from '@/screens/GamesScreen';
import GameScreen from '@/screens/GameScreen';
import RulesScreen from '@/screens/RulesScreen';

function renderRulesApp(path = '/games') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SettingsProvider>
        <StatsProvider>
          <Routes>
            <Route path="/games" element={<GamesScreen />} />
            <Route path="/games/:gameId/rules" element={<RulesScreen />} />
            <Route path="/games/:gameId" element={<GameScreen />} />
          </Routes>
        </StatsProvider>
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe('How to play rules', () => {
  it('opens the selected game rules from its book button without starting the game', async () => {
    const user = userEvent.setup();
    renderRulesApp();

    const bookButton = screen.getByRole('button', { name: 'How to play Connect 4' });
    expect(bookButton.className).toContain('h-11');
    expect(bookButton.className).toContain('w-11');
    await user.click(bookButton);

    expect(screen.getByRole('heading', { name: 'Connect 4 Rules', level: 1 })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'How to play', level: 2 })).toBeTruthy();
    expect(screen.getByRole('img', { name: /Four ways to connect four/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to games' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Setup for connect-4' })).toBeNull();
  });

  it('filters the game list to the Traditional Chinese group', async () => {
    const user = userEvent.setup();
    renderRulesApp();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Game group' }), 'chinese');

    expect(screen.getByRole('heading', { name: 'Traditional Chinese', level: 3 })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'How to play Xiangqi' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'How to play Connect 4' })).toBeNull();
  });

  it('lists the Egyptian games and explains that reconstructed rules are modern choices', async () => {
    const user = userEvent.setup();
    renderRulesApp();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Game group' }), 'egyptian');

    expect(screen.getByRole('heading', { name: 'Ancient Egypt', level: 3 })).toBeTruthy();
    for (const gameName of [
      'Seega',
      'Egyptian Mancala',
      'Senet',
      'The Game of 20 Squares',
      'Hounds and Jackals',
      'Mehen',
    ]) {
      expect(screen.getByRole('button', { name: `How to play ${gameName}` })).toBeTruthy();
    }

    await user.click(screen.getByRole('button', { name: 'About reconstructed rules for Senet' }));
    expect(
      screen.getByRole('heading', { name: 'Senet: Reconstructed rules', level: 2 }),
    ).toBeTruthy();
    expect(screen.getByText(/original rules were not preserved/i)).toBeTruthy();
  });

  it('serves a direct rules URL and keeps Play enabled for an available game', () => {
    renderRulesApp('/games/mancala/rules');

    expect(screen.getByRole('heading', { name: 'Mancala (Kalah) Rules', level: 1 })).toBeTruthy();
    expect(screen.getAllByText(/extra turn/i).length).toBeGreaterThan(0);
    const playButton = screen.getByRole('button', { name: /Play/ }) as HTMLButtonElement;
    expect(playButton.disabled).toBe(false);
    expect(playButton.textContent).not.toContain('Coming soon');
  });

  it('opens the rules in advance from an available game card', async () => {
    const user = userEvent.setup();
    renderRulesApp();

    await user.click(screen.getByRole('button', { name: 'How to play Minesweeper' }));

    expect(screen.getByRole('heading', { name: 'Minesweeper Rules', level: 1 })).toBeTruthy();
    expect((screen.getByRole('button', { name: /Play/ }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('renders readable rule sections at a 360px viewport', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 });
    renderRulesApp('/games/2048/rules');

    expect(screen.getByRole('heading', { name: '2048 Rules', level: 1 })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(7);
    expect(screen.getByText(/Combine equal-numbered tiles/).className).toContain('text-base');
    for (const element of document.querySelectorAll('button, a')) {
      expect(element.className).not.toMatch(/min-w-\[(?:[3-9]\d{2,}|[1-9]\d{3,})px\]/);
    }
  });

  it('navigates to the game setup from Play for an available game', async () => {
    const user = userEvent.setup();
    renderRulesApp('/games/noughts-and-crosses/rules');

    await user.click(screen.getByRole('button', { name: 'Play' }));

    expect(screen.getByRole('heading', { name: 'Noughts and Crosses', level: 1 })).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Start game' })).toBeTruthy();
  });

  it('offers Rules on the game pre-game screen', async () => {
    const user = userEvent.setup();
    renderRulesApp('/games/connect-4');

    await user.click(await screen.findByRole('link', { name: 'How to play Connect 4' }));

    expect(await screen.findByRole('heading', { name: 'Connect 4 Rules', level: 1 })).toBeTruthy();
  });
});
