import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import GameOverDialog from '@/components/GameOverDialog';
import GameBoard from '@/components/GameBoard';
import Scoreboard from '@/components/Scoreboard';
import ThinkingDots from '@/components/ThinkingDots';
import ZoomableBoard from '@/components/ZoomableBoard';
import { chooseMove } from '@/games/seega/ai';
import {
  BOARD_SIZE,
  CENTRE_SQUARE,
  seega,
  type SeegaMove,
} from '@/games/seega/rules';
import type { MatchConfig } from '@/games/matchConfig';
import { describeResult, scoreEntries, statusText } from '@/games/matchOutcome';
import { useEngineMatch } from '@/games/useEngineMatch';

export default function SeegaGame({ config }: { config: MatchConfig }) {
  const navigate = useNavigate();
  const match = useEngineMatch({ engine: seega, config, chooseMove });
  const { state, result, over, turn, humanSide, computerTurn, scores, dialogOpen, pointsEarned } =
    match;
  const [selectedFrom, setSelectedFrom] = useState<number | null>(null);
  const [pathProgress, setPathProgress] = useState<number[]>([]);
  const moves = seega.legalMoves(state);
  const selectedMoves = moves.filter(
    (move): move is Extract<SeegaMove, { from: number }> =>
      !('type' in move) && move.from === selectedFrom,
  );
  const nextTargets = new Set(
    selectedMoves.flatMap((move) =>
      move.path.length > pathProgress.length &&
      pathProgress.every((square, index) => move.path[index] === square)
        ? [move.path[pathProgress.length]!]
        : [],
    ),
  );
  const summary = result === null ? null : describeResult(result, config, humanSide);
  const remaining = state.ruleset.stonesPerPlayer * 2 - state.placementsMade;
  const blockedRemoval = moves.some((move) => 'type' in move);
  const status =
    state.phase === 'placement'
      ? `Place 2 stones: ${state.placementsInTurn + 1} of 2. ${remaining} stones left to place.`
      : blockedRemoval
        ? `Player ${turn + 1} is blocked. Player ${turn === 0 ? 2 : 1} must remove one of their own stones.`
        : statusText(result, turn, config, humanSide);

  const restart = () => {
    match.restart();
    setSelectedFrom(null);
    setPathProgress([]);
  };

  const selectCell = (row: number, col: number) => {
    if (computerTurn || over) return;
    const square = row * BOARD_SIZE + col;
    const move = moves.find(
      (candidate) => 'type' in candidate && candidate.type === 'blocked-remove' && candidate.at === square,
    );
    if (move) {
      match.playMove(move);
      setSelectedFrom(null);
      setPathProgress([]);
      return;
    }

    if (state.phase === 'placement') {
      if (state.board[square] !== null || !moves.some((candidate) => !('type' in candidate) && candidate.from === square)) {
        return;
      }
      match.playMove({ from: square, path: [] });
      return;
    }

    if (selectedFrom === null) {
      if (state.board[square] === turn) setSelectedFrom(square);
      return;
    }

    const continuations = selectedMoves.filter(
      (candidate) =>
        candidate.path.length > pathProgress.length &&
        pathProgress.every((step, index) => candidate.path[index] === step) &&
        candidate.path[pathProgress.length] === square,
    );
    if (continuations.length === 0) {
      if (state.board[square] === turn) {
        setSelectedFrom(square);
        setPathProgress([]);
      } else {
        setSelectedFrom(null);
        setPathProgress([]);
      }
      return;
    }

    const nextPath = [...pathProgress, square];
    const completed = continuations.find((candidate) => candidate.path.length === nextPath.length);
    if (completed) {
      match.playMove(completed);
      setSelectedFrom(null);
      setPathProgress([]);
      return;
    }
    setPathProgress(nextPath);
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Scoreboard entries={scoreEntries(config, humanSide, scores)} />

      <div role="status" aria-live="polite" className="flex min-h-11 items-center justify-center gap-3">
        <p className="text-center font-semibold">{status}</p>
        {computerTurn && <ThinkingDots />}
      </div>
      <p className="text-center text-sm text-subtle">
        {state.phase === 'placement'
          ? 'Place two stones on empty squares each turn. The centre stays empty.'
          : selectedFrom === null
            ? 'Select one of your stones, then choose an adjacent empty square.'
            : pathProgress.length > 0
              ? 'Continue the capture chain by selecting the highlighted square.'
              : 'Choose a highlighted square. Captures are shown as one complete move.'}
      </p>

      <ZoomableBoard gameId="seega" rows={BOARD_SIZE} columns={BOARD_SIZE}>
        <GameBoard
          label="Seega board"
          rows={BOARD_SIZE}
          cols={BOARD_SIZE}
          disabled={computerTurn || over}
          onCellTap={selectCell}
          gridClassName="gap-1 rounded-xl p-1"
          cellClassName="min-h-0 rounded-lg text-base"
          getCellLabel={(row, col) => {
            const square = row * BOARD_SIZE + col;
            const owner = state.board[square];
            const stone =
              owner === null
                ? square === CENTRE_SQUARE
                  ? 'Empty centre square'
                  : 'Empty square'
                : owner === humanSide
                  ? 'Your stone'
                  : config.mode === 'computer'
                    ? "Computer's stone"
                    : `Player ${owner + 1} stone`;
            return `Row ${row + 1}, column ${col + 1}, ${stone}`;
          }}
          renderCell={(row, col) => {
            const square = row * BOARD_SIZE + col;
            const owner = state.board[square];
            const isSelected = selectedFrom === square;
            const isTarget = nextTargets.has(square);
            const inPath = pathProgress.includes(square);
            const lastMove =
              state.lastMove && !('type' in state.lastMove)
                ? state.lastMove
                : null;
            const isLastMove =
              lastMove !== null &&
              (lastMove.from === square || lastMove.path.includes(square));
            const blocked =
              state.lastMove &&
              'type' in state.lastMove &&
              state.lastMove.at === square;
            return (
              <>
                {square === CENTRE_SQUARE && owner === null && (
                  <span className="text-xs font-semibold text-subtle" aria-hidden="true">
                    CENTER
                  </span>
                )}
                {owner !== null && (
                  <span
                    className={`h-[62%] w-[62%] shadow-sm ${
                      owner === 0
                        ? 'rounded-full bg-primary'
                        : 'rounded-md bg-accent'
                    } ${
                      isSelected ? 'ring-4 ring-primary ring-offset-2' : ''
                    } ${isLastMove ? 'outline outline-2 outline-foreground' : ''} ${
                      blocked ? 'opacity-50' : ''
                    }`}
                    aria-hidden="true"
                  />
                )}
                {isTarget && owner === null && (
                  <span
                    className={`absolute inset-2 rounded-full border-4 ${
                      inPath ? 'border-danger bg-danger/20' : 'border-primary bg-primary/10'
                    }`}
                    aria-hidden="true"
                  />
                )}
                {isLastMove && owner === null && (
                  <span
                    className="absolute inset-1 rounded-md border-2 border-foreground/70"
                    aria-hidden="true"
                  />
                )}
              </>
            );
          }}
        />
      </ZoomableBoard>

      <div className="grid gap-2 sm:grid-cols-2">
        <p className="rounded-xl bg-surface px-3 py-2 text-center text-sm font-semibold">
          Player 1 · round stones: {state.board.filter((owner) => owner === 0).length}
        </p>
        <p className="rounded-xl bg-surface px-3 py-2 text-center text-sm font-semibold">
          Player 2 · square stones: {state.board.filter((owner) => owner === 1).length}
        </p>
      </div>
      <Button variant="secondary" onClick={restart}>
        Restart
      </Button>

      {summary && (
        <GameOverDialog
          open={dialogOpen}
          outcome={summary.outcome}
          headline={summary.headline}
          message={summary.message}
          pointsEarned={config.mode === 'computer' ? pointsEarned : undefined}
          onPlayAgain={restart}
          onBackToMenu={() => navigate('/games')}
          onClose={match.closeDialog}
        />
      )}
    </div>
  );
}
