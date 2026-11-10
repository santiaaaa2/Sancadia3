import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsProvider from '@/components/SettingsProvider';
import StatsProvider from '@/components/StatsProvider';
import GamesScreen from '@/screens/GamesScreen';
import HomeScreen from '@/screens/HomeScreen';
import SettingsScreen from '@/screens/SettingsScreen';

describe('nation game filter', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('updates the games list when the nation selection changes', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsProvider>
          <StatsProvider>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/games" element={<GamesScreen />} />
            </Routes>
          </StatsProvider>
        </SettingsProvider>
      </MemoryRouter>,
    );

    await user.selectOptions(screen.getByLabelText('Nation'), 'portugal');
    const nationList = screen.getByRole('list', { name: 'Nations' });
    expect(nationList.querySelector('li[aria-current="true"]')?.textContent).toContain('Portugal');
    expect(window.localStorage.getItem('classic-games-arcade:settings')).toContain(
      '"nation":"portugal"',
    );

    await user.click(screen.getByRole('link', { name: 'Go back' }));
    await user.click(screen.getByRole('link', { name: /Play/ }));

    expect(screen.getByRole('heading', { name: 'Games from Portugal' })).toBeTruthy();
    expect(screen.getByText('Connect 4')).toBeTruthy();
    expect(screen.queryByText('Noughts and Crosses')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Show all' }));
    expect(screen.getByRole('heading', { name: 'Games from All nations' })).toBeTruthy();
    expect(screen.getByText('Noughts and Crosses')).toBeTruthy();
  });

  it('resets the saved nation to all with Reset all data', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsProvider>
          <StatsProvider>
            <Routes>
              <Route path="/settings" element={<SettingsScreen />} />
            </Routes>
          </StatsProvider>
        </SettingsProvider>
      </MemoryRouter>,
    );

    await user.selectOptions(screen.getByLabelText('Nation'), 'india');
    await user.click(screen.getByRole('button', { name: 'Reset all data' }));
    await user.click(screen.getByRole('button', { name: /^Reset$/ }));

    expect((screen.getByLabelText('Nation') as HTMLSelectElement).value).toBe('all');
  });
});
