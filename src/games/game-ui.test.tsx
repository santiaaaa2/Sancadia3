import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import StatsProvider from '@/components/StatsProvider';
import SettingsProvider from '@/components/SettingsProvider';
import BullsCowsGame from '@/games/bullscows/BullsCowsGame';
import Connect4Game from '@/games/connect4/Connect4Game';
import GomokuMatch from '@/games/gomoku/GomokuMatch';
import HangmanGame from '@/games/hangman/HangmanGame';
import MastermindGame from '@/games/mastermind/MastermindGame';
import TicTacToeGame from '@/games/tictactoe/TicTacToeGame';
import MatchSetup from '@/components/MatchSetup';

function renderWithProviders(children: ReactNode) {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <StatsProvider>{children}</StatsProvider>
      </SettingsProvider>
    </MemoryRouter>,
  );
}

async function startTwoPlayerGame(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: '2 Players' }));
  await user.click(screen.getByRole('button', { name: 'Start game' }));
}

async function startPuzzleGame(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Start game' }));
}

describe('game screens', () => {
  it('starts the shared pre-game with the selected mode and difficulty', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    renderWithProviders(<MatchSetup onStart={onStart} />);

    await user.click(screen.getByRole('radio', { name: '2 Players' }));
    await user.click(screen.getByRole('button', { name: 'Start game' }));

    expect(onStart).toHaveBeenCalledWith({ mode: 'two-player' });
  });

  it('shows the online placeholder from shared pre-game setup', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    renderWithProviders(<MatchSetup onStart={onStart} />);

    const goLive = screen.getByRole('button', { name: 'GO LIVE — online play' });
    expect(goLive.className).toContain('bg-online-accent');
    expect(goLive.className).toContain('w-full');
    await user.click(goLive);

    expect(screen.getByRole('status').textContent).toBe('Online play coming soon');
    expect(onStart).not.toHaveBeenCalled();
  });

  it('Noughts and Crosses accepts a move and Restart clears the board', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicTacToeGame />);
    await startTwoPlayerGame(user);

    const board = screen.getByRole('group', { name: 'Noughts and Crosses board' });
    await user.click(within(board).getByRole('button', { name: 'Row 1, column 1, empty' }));
    expect(within(board).getByRole('button', { name: 'Row 1, column 1, X' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(within(board).getByRole('button', { name: 'Row 1, column 1, empty' })).toBeTruthy();
  });

  it('Connect 4 accepts a column move and Restart clears the board', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Connect4Game />);
    await startTwoPlayerGame(user);

    const board = screen.getByRole('group', { name: 'Connect 4 board' });
    await user.click(within(board).getByRole('button', { name: 'Row 6, column 1, empty' }));
    expect(
      within(board).getByRole('button', { name: 'Row 6, column 1, player one disc' }),
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(within(board).getByRole('button', { name: 'Row 6, column 1, empty' })).toBeTruthy();
  });

  it('Gomoku confirms a previewed move and Restart clears the board', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GomokuMatch />);
    await startTwoPlayerGame(user);

    const board = screen.getByRole('group', { name: 'Gomoku board' });
    await user.click(within(board).getByRole('button', { name: 'Empty, row 8, column 8' }));
    await user.click(within(board).getByRole('button', { name: 'Empty, row 8, column 8' }));
    expect(
      within(board).getByRole('button', { name: 'Black stone, row 8, column 8' }),
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(within(board).getByRole('button', { name: 'Empty, row 8, column 8' })).toBeTruthy();
  });

  it('Mastermind rejects incomplete guesses and supports a secret handoff', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MastermindGame />);

    await startPuzzleGame(user);
    await user.click(screen.getByRole('button', { name: 'Submit guess' }));
    expect(screen.getByText('Guess must contain 4 symbols.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '2 Players' }));
    for (let index = 0; index < 4; index += 1) {
      await user.click(screen.getByRole('button', { name: 'Add secret symbol A' }));
    }
    await user.click(screen.getByRole('button', { name: 'Confirm secret' }));
    expect(screen.getByRole('heading', { name: 'Pass the device to Player 2' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.queryByLabelText('Player 1 secret (4 symbols)')).toBeNull();
    expect(screen.getByRole('group', { name: 'Current guess' })).toBeTruthy();
  });

  it('Mastermind submits a complete guess and restart clears the history', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MastermindGame />);

    await startPuzzleGame(user);
    for (let index = 0; index < 4; index += 1) {
      await user.click(screen.getByRole('button', { name: 'Add colour A' }));
    }
    await user.click(screen.getByRole('button', { name: 'Submit guess' }));
    expect(screen.getByText(/^Feedback:/)).toBeTruthy();
    const playAgain = screen.queryByRole('button', { name: 'Play again' });
    await user.click(playAgain ?? screen.getByRole('button', { name: 'Restart' }));
    expect(screen.getByText('No guesses yet.')).toBeTruthy();
  });

  it('Bulls and Cows accepts keyboard guesses and rejects repeated digits inline', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BullsCowsGame />);

    await startPuzzleGame(user);
    await user.click(screen.getByRole('button', { name: 'Add digit 0' }));
    await user.click(screen.getByRole('button', { name: 'Add digit 0' }));
    await user.click(screen.getByRole('button', { name: 'Add digit 1' }));
    await user.click(screen.getByRole('button', { name: 'Add digit 2' }));
    await user.click(screen.getByRole('button', { name: 'Submit guess' }));
    expect(screen.getByText('Duplicate symbols are not allowed in this mode.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Restart' }));
    await user.click(screen.getByRole('heading', { name: 'Digit notes' }));
    await user.keyboard('1234{Enter}');
    expect(screen.getByRole('heading', { name: 'Guess history' })).toBeTruthy();
    expect(screen.getByText(/Bulls \d+ · Cows \d+/)).toBeTruthy();
  });

  it('Hangman exposes an on-screen keyboard, supports physical keys, and masks its word', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HangmanGame />);
    await startPuzzleGame(user);
    expect(screen.getByRole('button', { name: 'A' })).toBeTruthy();
    const maskedWord = screen.getByRole('group', { name: /Masked word:/ });
    expect(maskedWord).toBeTruthy();
    await user.click(maskedWord);
    await user.keyboard('z');
    const zButton = screen.getByRole('button', { name: /^Z, (correct|incorrect)$/ });
    expect((zButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('Hangman includes a reveal used on the winning guess in its point breakdown', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    try {
      renderWithProviders(<HangmanGame />);
      await startPuzzleGame(user);
      await user.click(screen.getByRole('button', { name: /Reveal a letter/ }));
      for (const letter of ['R', 'E', 'A', 'D']) {
        await user.click(screen.getByRole('button', { name: letter }));
      }
      expect(screen.getByText('Hints: -5')).toBeTruthy();
    } finally {
      random.mockRestore();
    }
  });

  it('Hangman validates and hands off a masked two-player secret', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HangmanGame />);
    await user.click(screen.getByRole('button', { name: '2 Players' }));
    await startPuzzleGame(user);
    const secret = screen.getByLabelText('Player 1 secret word');
    await user.type(secret, 'word1');
    await user.click(screen.getByRole('button', { name: 'Confirm secret' }));
    expect(screen.getByText('Use letters a-z only.')).toBeTruthy();
    await user.clear(secret);
    await user.type(secret, 'planet');
    await user.click(screen.getByRole('button', { name: 'Confirm secret' }));
    expect(screen.getByRole('heading', { name: 'Pass the device to Player 2' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.queryByLabelText('Player 1 secret word')).toBeNull();
    expect(screen.getByRole('group', { name: /Masked word:/ })).toBeTruthy();
  });
});
