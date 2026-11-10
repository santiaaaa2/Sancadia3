import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import SettingsProvider from '@/components/SettingsProvider';
import StatsProvider from '@/components/StatsProvider';
import GameScreen from '@/screens/GameScreen';

describe('LATRUNCULI game flow', () => {
  it('presents the historical menu, instructions, background, and persistent settings', async () => {
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

    expect(await screen.findByText('LUDUS LATRUNCULORUM')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'LATRUNCULI' })).toBeTruthy();
    expect(screen.getByText('The Ancient Roman Game of Strategy.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'HOW TO PLAY' }));
    expect(screen.getByText(/move it any clear distance/)).toBeTruthy();
    expect(screen.getByText(/Trap an opposing stone/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Back to main menu' }));

    await user.click(screen.getByRole('button', { name: 'HISTORICAL BACKGROUND' }));
    expect(screen.getByText(/ancient Rome/)).toBeTruthy();
    expect(screen.getByText(/rules remain uncertain/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Back to main menu' }));

    await user.click(screen.getByRole('button', { name: 'GAME SETTINGS' }));
    const sound = screen.getByRole('switch', { name: 'Sound effects' });
    expect(sound.getAttribute('aria-checked')).toBe('true');
    await user.click(sound);
    expect(screen.getByRole('switch', { name: 'Sound effects' }).getAttribute('aria-checked')).toBe(
      'false',
    );
    expect(screen.getByRole('switch', { name: 'Board animations' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Default computer difficulty' })).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Show board coordinates' })).toBeTruthy();
  });

  it('does not show a pass-device screen against the computer', async () => {
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

    await user.click(await screen.findByRole('button', { name: 'BATTLE AGAINST THE COMPUTER' }));
    expect(screen.getByRole('radio', { name: 'Recruit' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Centurion' })).toBeTruthy();
    await user.click(screen.getByRole('radio', { name: 'General' }));
    await user.click(screen.getByRole('button', { name: 'Begin computer battle' }));
    await user.click(
      screen.getByRole('button', { name: 'A7 square, Red army stone, selectable stone' }),
    );
    await user.click(screen.getByRole('button', { name: 'A3 square, legal destination' }));

    expect(screen.queryByRole('heading', { name: /Pass device to Player/ })).toBeNull();
    expect(screen.getByRole('group', { name: 'LATRUNCULI battlefield' })).toBeTruthy();
  });

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

    await user.click(await screen.findByRole('button', { name: 'LOCAL BATTLE' }));

    expect(screen.getByRole('group', { name: 'LATRUNCULI battlefield' })).toBeTruthy();
    await user.click(
      screen.getByRole('button', { name: 'A7 square, Red army stone, selectable stone' }),
    );
    await user.click(screen.getByRole('button', { name: 'A3 square, legal destination' }));
    expect(screen.getByRole('heading', { name: 'Pass device to Player 2' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'LATRUNCULI battlefield' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(
      screen.getByRole('button', { name: 'B2 square, Blue army stone, selectable stone' }),
    );
    await user.click(screen.getByRole('button', { name: 'B3 square, legal destination' }));
    expect(screen.getByRole('heading', { name: 'Pass device to Player 1' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(
      screen.getByRole('button', { name: 'C7 square, Red army stone, selectable stone' }),
    );
    await user.click(screen.getByRole('button', { name: 'C3 square, legal destination' }));
    expect(screen.getByText(/^Move 3 of 200/)).toBeTruthy();
    expect(screen.getByText('Player 1 · C7 → C3 · captured 1')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Pass device to Player 2' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('button', { name: 'B3 square' })).toBeTruthy();
    expect(screen.getByText('1 captured')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText(/^Move 2 of 200/)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Pass device to Player 2' })).toBeNull();
    expect(screen.getByRole('button', { name: 'B3 square, Blue army stone' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe("Player 1's turn");
    expect(screen.getByRole('button', { name: 'Undo' }).hasAttribute('disabled')).toBe(false);
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

    await user.click(await screen.findByRole('button', { name: 'LOCAL BATTLE' }));
    await user.click(screen.getByRole('button', { name: 'Resign' }));

    expect(await screen.findByRole('heading', { name: 'VICTORIA!' })).toBeTruthy();
    expect(screen.getByText('THE BLUE ARMY PREVAILS.')).toBeTruthy();
    const finalResult = screen.getByRole('region', { name: 'Final battle result' });
    expect(finalResult.textContent).toContain('Winner: Player 2 · Blue Army');
    expect(finalResult.textContent).toContain('Red Army remaining: 16');
    expect(finalResult.textContent).toContain('Blue Army remaining: 16');
    expect(finalResult.textContent).toContain('Total moves: 0');
    expect(screen.getByRole('button', { name: /A7 square/ })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Resign' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'New game' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Main menu' })).toHaveLength(2);
  });
});
