import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsProvider from '@/components/SettingsProvider';
import StatsProvider from '@/components/StatsProvider';
import MatchSetup from '@/components/MatchSetup';
import BullsCowsGame from '@/games/bullscows/BullsCowsGame';
import GameSettingsScreen from '@/screens/GameSettingsScreen';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SettingsProvider>
        <StatsProvider>
          <Routes>
            <Route path="/games/bullscows" element={<BullsCowsGame />} />
            <Route path="/games/:gameId" element={<MatchSetup onStart={() => undefined} />} />
            <Route path="/games/:gameId/settings" element={<GameSettingsScreen />} />
          </Routes>
        </StatsProvider>
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe('per-game settings', () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
    vi.unstubAllGlobals();
  });

  it.each([360, 430])(
    'opens from pre-game setup and displays shrinkable sections at a %ipx viewport',
    async (viewportWidth) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: viewportWidth });
      const user = userEvent.setup();
      renderAt('/games/checkers');

      await user.click(screen.getByRole('link', { name: 'Game settings' }));
      expect(screen.getByRole('heading', { name: 'Checkers Settings' })).toBeTruthy();
      expect(window.innerWidth).toBe(viewportWidth);

      const sectionNames = [
        'Speed & Mode',
        'Rules & Variations',
        'Visuals & Ergonomics',
        'Communication & Etiquette',
        'Multiplayer',
      ];
      expect(
        screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
      ).toEqual(sectionNames);
      for (const section of document.querySelectorAll('details')) {
        section.open = true;
      }

      expect((screen.getByRole('combobox', { name: 'Variant' }) as HTMLSelectElement).value).toBe(
        'american',
      );
      expect(
        (screen.getByRole('option', { name: 'Italian (Coming soon)' }) as HTMLOptionElement)
          .disabled,
      ).toBe(true);
      expect(
        (
          screen.getByRole('option', {
            name: 'International (Coming soon)',
          }) as HTMLOptionElement
        ).disabled,
      ).toBe(true);
      expect(screen.getByRole('switch', { name: 'Threat warnings' })).toBeTruthy();
      expect(screen.getByRole('radiogroup', { name: 'In-game chat' })).toBeTruthy();
      expect(screen.getByText('Not available in v1')).toBeTruthy();

      const multiplayer = screen.getByRole('heading', { name: 'Multiplayer' }).closest('details');
      expect(multiplayer).not.toBeNull();
      for (const control of (multiplayer as HTMLElement).querySelectorAll(
        'button, input, select',
      )) {
        expect(control.hasAttribute('disabled')).toBe(true);
      }
      for (const control of multiplayer!.querySelectorAll(
        'button:disabled, input:disabled, select:disabled',
      )) {
        const descriptionId = control.getAttribute('aria-describedby');
        expect(descriptionId, control.outerHTML).toBeTruthy();
        expect(document.getElementById(descriptionId!)?.textContent).toContain('Coming soon');
      }
      expect(
        within(multiplayer as HTMLElement).getByRole('heading', { name: 'Matchmaking & Privacy' }),
      ).toBeTruthy();

      for (const control of document.querySelectorAll('button, input, select')) {
        expect(control.className).not.toMatch(/min-w-\[(?:[3-9]\d{2,}|[1-9]\d{3,})px\]/);
      }
    },
  );

  it('exposes the settings shortcut on the puzzle-game setup screen', async () => {
    const user = userEvent.setup();
    renderAt('/games/bullscows');

    await user.click(screen.getByRole('link', { name: 'Game settings' }));
    expect(screen.getByRole('heading', { name: 'Bulls and Cows Settings' })).toBeTruthy();
  });

  it('persists settings per game and leaves global defaults unchanged', async () => {
    const user = userEvent.setup();
    const checkersView = renderAt('/games/checkers/settings');

    await user.click(screen.getByRole('switch', { name: 'Use global defaults for Speed & Mode' }));
    await user.click(screen.getByRole('radio', { name: 'Expert' }));
    checkersView.unmount();

    renderAt('/games/connect-4/settings');
    await user.click(screen.getByRole('switch', { name: 'Use global defaults for Speed & Mode' }));
    await user.click(screen.getByRole('radio', { name: 'Professional' }));

    const stored = JSON.parse(window.localStorage.getItem('classic-games-arcade:settings') ?? '{}');
    expect(stored.difficulty).toBe('beginner');
    expect(stored.gameSettings.checkers.speedAndMode.difficulty).toBe('expert');
    expect(stored.gameSettings['connect-4'].speedAndMode.difficulty).toBe('professional');
  });

  it('uses global values until a section is customized and confirms a game-only reset', async () => {
    const user = userEvent.setup();
    renderAt('/games/checkers/settings');

    expect(
      screen
        .getByRole('switch', { name: 'Use global defaults for Speed & Mode' })
        .getAttribute('aria-checked'),
    ).toBe('true');
    expect((screen.getByRole('radio', { name: 'Beginner' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    await user.click(screen.getByRole('switch', { name: 'Use global defaults for Speed & Mode' }));
    await user.click(screen.getByRole('radio', { name: 'Expert' }));
    await user.click(screen.getByRole('button', { name: "Reset this game's settings" }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(
      JSON.parse(window.localStorage.getItem('classic-games-arcade:settings') ?? '{}').gameSettings
        .checkers.speedAndMode.difficulty,
    ).toBe('expert');
    await user.click(screen.getByRole('button', { name: "Reset this game's settings" }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset' }));

    const stored = JSON.parse(window.localStorage.getItem('classic-games-arcade:settings') ?? '{}');
    expect(stored.gameSettings.checkers).toBeUndefined();
    expect(
      screen
        .getByRole('switch', { name: 'Use global defaults for Speed & Mode' })
        .getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('shows unsupported controls as unavailable rather than omitting them', () => {
    renderAt('/games/hangman/settings');
    const variantRow = screen.getByRole('combobox', { name: 'Variant' }).closest('[data-status]');
    expect(variantRow?.getAttribute('data-status')).toBe('unavailable');
    expect(within(variantRow as HTMLElement).getByText('Not available for this game')).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Standard only' })).toBeTruthy();
    expect(
      (screen.getByRole('combobox', { name: 'Gameplay style' }) as HTMLSelectElement).disabled,
    ).toBe(true);
  });
});
