import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import SettingsProvider from '@/components/SettingsProvider';
import StatsProvider from '@/components/StatsProvider';
import GameScreen from '@/screens/GameScreen';

describe('LATRUNCULI game flow', () => {
  it('starts a local match, records moves, and undoes a move', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/games/latrunculi']}>
        <SettingsProvider>
          <StatsProvider>
            <Routes>
              <Route path="/games/:gameId" element={<GameScreen />} />
            </Routes>
          </StatsProvider>
        </SettingsProvider>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('radio', { name: '2 Players' }));
    await user.click(screen.getByRole('button', { name: 'Start game' }));

    expect(screen.getByRole('group', { name: 'LATRUNCULI battlefield' })).toBeTruthy();
    await user.click(
      screen.getByRole('button', { name: 'A7 square, Red army stone, selectable stone' }),
    );
    await user.click(screen.getByRole('button', { name: 'A3 square, legal destination' }));
    await user.click(
      screen.getByRole('button', { name: 'B2 square, Ivory army stone, selectable stone' }),
    );
    await user.click(screen.getByRole('button', { name: 'B3 square, legal destination' }));
    await user.click(
      screen.getByRole('button', { name: 'C7 square, Red army stone, selectable stone' }),
    );
    await user.click(screen.getByRole('button', { name: 'C3 square, legal destination' }));
    expect(screen.getByText(/^Move 3 of 200/)).toBeTruthy();
    expect(screen.getByText('Player 1 · C7 → C3 · captured 1')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'B3 square' })).toBeTruthy();
    expect(screen.getByText('1 captured')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Undo move' }));
    expect(screen.getByText(/^Move 2 of 200/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'B3 square, Ivory army stone' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe("Player 1's turn");
    expect(screen.getByRole('button', { name: 'Undo move' }).hasAttribute('disabled')).toBe(false);
    expect(screen.getByText('Player 2 · B2 → B3')).toBeTruthy();
    expect(screen.getByText('Player 1 · A7 → A3')).toBeTruthy();
    expect(screen.getAllByText('0 captured')).toHaveLength(2);
  });

  it('resigns the current player and leaves completed board controls disabled', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/games/latrunculi']}>
        <SettingsProvider>
          <StatsProvider>
            <Routes>
              <Route path="/games/:gameId" element={<GameScreen />} />
            </Routes>
          </StatsProvider>
        </SettingsProvider>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('radio', { name: '2 Players' }));
    await user.click(screen.getByRole('button', { name: 'Start game' }));
    await user.click(screen.getByRole('button', { name: 'Resign' }));

    expect(await screen.findByRole('heading', { name: 'Player 2 wins!' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /A7 square/ })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Resign' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Main menu' })).toBeTruthy();
  });
});
