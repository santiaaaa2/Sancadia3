import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminScreen from '@/screens/AdminScreen';
import { invokeAdmin } from '@/lib/admin';
import SettingsProvider from '@/components/SettingsProvider';

vi.mock('@/lib/admin', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/admin')>();
  return { ...actual, invokeAdmin: vi.fn() };
});

const invokeAdminMock = vi.mocked(invokeAdmin);

function renderAdmin() {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <AdminScreen />
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe('LATRUNCULI admin screen', () => {
  beforeEach(() => {
    invokeAdminMock.mockReset();
  });

  it('does not render administration controls when server authorization fails', async () => {
    invokeAdminMock.mockRejectedValue(new Error('Administrator access required.'));
    renderAdmin();

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Administrator access required.',
    );
    expect(screen.queryByRole('heading', { name: 'Content management' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Create content' })).toBeNull();
  });

  it('loads analytics and content after the server authorizes access', async () => {
    invokeAdminMock.mockImplementation(async (action) => {
      if (action === 'metrics') {
        return {
          metrics: {
            registered_users: 12,
            new_registrations: 3,
            active_users: 8,
            returning_players: 4,
            games_played: 20,
            ai_matches: 14,
            multiplayer_matches: 6,
            daily_challenges_completed: null,
            campaign_completions: null,
            window_days: 30,
          },
          stripe: { configured: false },
          tracking: { completions: false },
        } as never;
      }
      if (action === 'list_content') return { content: [] } as never;
      throw new Error(`Unexpected admin action: ${action}`);
    });

    renderAdmin();

    await waitFor(() => expect(screen.getByText('12')).toBeTruthy());
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Content management' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Stripe metrics are unavailable');
    expect(invokeAdminMock).toHaveBeenCalledWith('metrics');
    expect(invokeAdminMock).toHaveBeenCalledWith('list_content');
  });
});
