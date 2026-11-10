import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import SettingsProvider from '@/components/SettingsProvider';
import StatsProvider from '@/components/StatsProvider';
import XiangqiGame from '@/games/xiangqi/XiangqiGame';

describe('Xiangqi game screen', () => {
  it('starts a match, plays a move, and supports undo and restart', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SettingsProvider>
          <StatsProvider>
            <XiangqiGame />
          </StatsProvider>
        </SettingsProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('radio', { name: '2 Players' }));
    await user.click(screen.getByRole('button', { name: 'Start game' }));

    const board = screen.getByRole('group', { name: 'Xiangqi board' });
    const redSoldier = within(board).getByRole('button', {
      name: 'Red soldier at row 7, column 1',
    });
    await user.click(redSoldier);
    await user.click(within(board).getByRole('button', { name: 'Empty row 6, column 1' }));

    expect(
      within(board).getByRole('button', { name: 'Red soldier at row 6, column 1' }),
    ).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(
      within(board).getByRole('button', { name: 'Red soldier at row 7, column 1' }),
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(
      within(board).getByRole('button', { name: 'Red soldier at row 7, column 1' }),
    ).toBeTruthy();
  });
});
