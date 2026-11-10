import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppLayout from '@/components/AppLayout';
import SettingsProvider from '@/components/SettingsProvider';
import StatsProvider from '@/components/StatsProvider';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import SettingsScreen from '@/screens/SettingsScreen';
import { settingsSections } from '@/screens/settings/sections';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <SettingsProvider>
        <StatsProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/settings" element={<SettingsScreen />} />
            </Route>
          </Routes>
        </StatsProvider>
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe('global settings page', () => {
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
    'renders every section in order with shrinkable settings content at a %ipx viewport',
    (viewportWidth) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: viewportWidth });
      renderSettings();

      expect(window.innerWidth).toBe(viewportWidth);
      expect(screen.getByRole('main')).toBeTruthy();
      expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeTruthy();
      expect(
        screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
      ).toEqual(settingsSections.map((section) => section.title));

      const detailSections = [...document.querySelectorAll('details')];
      expect(detailSections).toHaveLength(settingsSections.length);
      expect(detailSections[0]?.open).toBe(true);
      expect(detailSections.slice(1).every((section) => !section.open)).toBe(true);
      detailSections.forEach((section) => {
        section.open = true;
      });

      for (const label of [
        'Display name',
        'Rating / ELO',
        'Dark mode',
        'Language',
        'Sound effects volume',
        'Show legal-move highlights',
        'Default difficulty',
        'Master push notifications',
        'Skill-based filtering',
        'Let non-friends spectate',
        'Let non-friends view my stats',
        'Let non-friends send random invites',
        'Rematches',
        'Region preference',
        'Chat mode',
        'Mute emotes and reactions',
        'Friend request permissions',
        'Disconnect auto-resign timer',
        'Low-ping warning',
        'Report a player',
        'Blocked players list',
        'Your turn push notifications',
        'Background connection keep-alive',
        'Graphics quality',
        'Install app',
        'Reset all data',
      ]) {
        expect(screen.getAllByText(label).length).toBeGreaterThan(0);
      }

      for (const control of document.querySelectorAll('button, input, select')) {
        expect(control.className).not.toMatch(/min-w-\[(?:[3-9]\d{2,}|[1-9]\d{3,})px\]/);
        expect(
          control.getAttribute('aria-label') ||
            control.textContent?.trim() ||
            control.getAttribute('name'),
        ).toBeTruthy();
      }
      for (const control of document.querySelectorAll('button, input, select, a[href], summary')) {
        expect(control.className, control.outerHTML).toContain('focus-visible');
      }

      const multiplayer = screen.getByRole('heading', { name: 'Multiplayer' }).closest('details');
      expect(multiplayer).not.toBeNull();
      for (const control of (multiplayer as HTMLElement).querySelectorAll(
        'button, input, select',
      )) {
        expect(control.hasAttribute('disabled')).toBe(true);
      }
      expect(
        (
          within(multiplayer as HTMLElement).getByRole('radio', {
            name: 'Full text (Not available in v1)',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      for (const control of multiplayer!.querySelectorAll(
        'button:disabled, input:disabled, select:disabled',
      )) {
        const descriptionId = control.getAttribute('aria-describedby');
        expect(descriptionId, control.outerHTML).toBeTruthy();
        expect(document.getElementById(descriptionId!)?.textContent).toContain('Coming soon');
      }
      expect(
        within(multiplayer as HTMLElement).getAllByText(/Requires an account/).length,
      ).toBeGreaterThan(0);
    },
  );

  it('uses the existing social and notification settings as preview-only values', () => {
    window.localStorage.setItem(
      'classic-games-arcade:settings',
      JSON.stringify({
        version: 5,
        friendRequestPrivacy: 'friends-of-friends',
        yourTurnAlerts: true,
        emailNotifications: true,
      }),
    );
    renderSettings();
    const multiplayer = screen.getByRole('heading', { name: 'Multiplayer' }).closest('details');
    expect(multiplayer).not.toBeNull();
    (multiplayer as HTMLDetailsElement).open = true;

    const friendRequests = within(multiplayer as HTMLElement).getByRole('combobox', {
      name: 'Friend request permissions',
    }) as HTMLSelectElement;
    expect(friendRequests.value).toBe('friends-of-friends');
    expect(friendRequests.disabled).toBe(true);
    expect(
      within(multiplayer as HTMLElement)
        .getByRole('switch', {
          name: 'Your turn push notifications',
        })
        .getAttribute('aria-checked'),
    ).toBe('true');
    expect(
      within(multiplayer as HTMLElement)
        .getByRole('switch', {
          name: 'Email notifications',
        })
        .getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('keeps preview controls disabled and does not persist attempted changes', async () => {
    const user = userEvent.setup();
    renderSettings();
    const accountSection = screen
      .getByRole('heading', { name: 'Account & Profile' })
      .closest('details');
    expect(accountSection).not.toBeNull();
    await user.click(within(accountSection as HTMLElement).getByText('Account & Profile'));

    const displayName = screen.getByRole('textbox', { name: 'Display name' }) as HTMLInputElement;
    expect(displayName.disabled).toBe(true);
    expect(displayName.getAttribute('aria-disabled')).toBe('true');
    expect(
      within(accountSection as HTMLElement).getAllByText('Coming soon').length,
    ).toBeGreaterThan(0);
    await user.type(displayName, 'Player');
    expect(displayName.value).toBe('');
    expect(window.localStorage.getItem('classic-games-arcade:settings')).toBeNull();

    const appearanceSection = screen
      .getByRole('heading', { name: 'Appearance' })
      .closest('details');
    expect(appearanceSection).not.toBeNull();
    await user.click(within(appearanceSection as HTMLElement).getByText('Appearance'));
    const darkMode = within(appearanceSection as HTMLElement).getByRole('switch', {
      name: 'Dark mode',
    });
    expect(darkMode.getAttribute('aria-disabled')).toBe('true');
    await user.click(darkMode);
    expect(window.localStorage.getItem('classic-games-arcade:settings')).toBeNull();
  });

  it('keeps active theme and nation controls working', async () => {
    const user = userEvent.setup();
    renderSettings();
    expect(screen.getByRole('list', { name: 'Nations' }).getAttribute('data-status')).toBe(
      'active',
    );
    await user.selectOptions(screen.getByRole('combobox', { name: 'Nation' }), 'france');
    expect(window.localStorage.getItem('classic-games-arcade:settings')).toContain(
      '"nation":"france"',
    );

    const appearanceSection = screen
      .getByRole('heading', { name: 'Appearance' })
      .closest('details');
    expect(appearanceSection).not.toBeNull();
    await user.click(within(appearanceSection as HTMLElement).getByText('Appearance'));
    await user.click(
      within(appearanceSection as HTMLElement).getByRole('radio', { name: 'Sunset' }),
    );
    expect(document.documentElement.dataset.theme).toBe('sunset');
  });

  it('restores active settings after remounting the provider', async () => {
    const user = userEvent.setup();
    const firstRender = renderSettings();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Nation' }), 'france');

    const appearanceSection = screen
      .getByRole('heading', { name: 'Appearance' })
      .closest('details');
    expect(appearanceSection).not.toBeNull();
    await user.click(within(appearanceSection as HTMLElement).getByText('Appearance'));
    await user.click(
      within(appearanceSection as HTMLElement).getByRole('radio', { name: 'Sunset' }),
    );
    firstRender.unmount();

    renderSettings();
    expect((screen.getByRole('combobox', { name: 'Nation' }) as HTMLSelectElement).value).toBe(
      'france',
    );
    expect(screen.getByRole('radio', { name: 'Sunset' }).getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.dataset.theme).toBe('sunset');
  });

  it('resets active settings to defaults after confirmation', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Nation' }), 'india');

    const appearanceSection = screen
      .getByRole('heading', { name: 'Appearance' })
      .closest('details');
    expect(appearanceSection).not.toBeNull();
    await user.click(within(appearanceSection as HTMLElement).getByText('Appearance'));
    await user.click(
      within(appearanceSection as HTMLElement).getByRole('radio', { name: 'Sunset' }),
    );

    const performanceSection = screen
      .getByRole('heading', { name: 'Performance & Data' })
      .closest('details');
    expect(performanceSection).not.toBeNull();
    await user.click(within(performanceSection as HTMLElement).getByText('Performance & Data'));
    await user.click(screen.getByRole('button', { name: 'Reset all data' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset' }));

    expect(window.localStorage.getItem('classic-games-arcade:settings')).toBeNull();
    expect((screen.getByRole('combobox', { name: 'Nation' }) as HTMLSelectElement).value).toBe(
      DEFAULT_SETTINGS.nation,
    );
    expect(screen.getByRole('radio', { name: 'Classic' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(screen.getByRole('radio', { name: 'Sunset' }).getAttribute('aria-checked')).toBe(
      'false',
    );
    expect(document.documentElement.dataset.theme).toBe(DEFAULT_SETTINGS.themeId);
  });
});
