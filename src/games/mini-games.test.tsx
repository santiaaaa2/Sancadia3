import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import SettingsProvider from '@/components/SettingsProvider';
import StatsProvider from '@/components/StatsProvider';
import GameScreen from '@/screens/GameScreen';

const games = [
  ['dominoes', 'button', /Play tile/],
  ['dots-and-boxes', 'button', /Horizontal line/],
  ['mancala', 'button', /Player 1 pit 1/],
  ['ludo', 'button', 'Roll die'],
  ['ganzenbord', 'grid', 'Ganzenbord board'],
  ['snake', 'button', 'Start'],
  ['2048', 'grid', '2048 game board'],
  ['minesweeper', 'grid', 'Minesweeper board'],
] as const;

describe('mini-game routes', () => {
  it.each(games)('%s loads its interactive UI', async (gameId, role, name) => {
    render(
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

    expect(await screen.findByRole(role, { name })).toBeTruthy();
  });
});
