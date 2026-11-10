import { useEffect, useState } from 'react';
import { RotateCcw, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import GameBoard from '@/components/GameBoard';
import GameOverDialog from '@/components/GameOverDialog';
import Scoreboard from '@/components/Scoreboard';
import ThinkingDots from '@/components/ThinkingDots';
import { chooseMove } from '@/games/latrunculi/ai';
import { getCapturedPieces } from '@/games/latrunculi/capture';
import {
  createLatrunculiState,
  SIZE,
  latrunculi,
  legalMovesFor,
  resignGame,
  type Square,
} from '@/games/latrunculi/rules';
import type { MatchConfig } from '@/games/matchConfig';
import { describeResult, scoreEntries, statusText } from '@/games/matchOutcome';
import { useEngineMatch } from '@/games/useEngineMatch';

function sameSquare(a: Square, b: Square): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function squareName([row, col]: Square): string {
  return `${String.fromCharCode(65 + col)}${SIZE - row}`;
}

function armyName(player: 0 | 1, config: MatchConfig, humanSide: 0 | 1): string {
  if (config.mode === 'two-player') return `Player ${player + 1}`;
  return player === humanSide ? 'Your' : 'Computer';
}

export default function LatrunculiMatch({ config }: { config: MatchConfig }) {
  const navigate = useNavigate();
  const match = useEngineMatch({
    engine: latrunculi,
    config,
    chooseMove,
    enableUndo: true,
    initialState: () => createLatrunculiState(config.mode),
  });
  const { state, result, over, turn, humanSide, computerTurn, scores, dialogOpen, pointsEarned } =
    match;
  const [selected, setSelected] = useState<Square | null>(null);

  useEffect(() => setSelected(null), [computerTurn, turn]);

  const legalMoves = legalMovesFor(state);
  const movesFromSelected = selected
    ? legalMoves.filter((move) => sameSquare(move.from, selected))
    : [];
  const destinations = new Set(movesFromSelected.map((move) => `${move.to[0]},${move.to[1]}`));
  const summary = result === null ? null : describeResult(result, config, humanSide);

  const handleCellTap = (row: number, col: number) => {
    if (computerTurn || over) return;
    const target: Square = [row, col];
    const move = movesFromSelected.find((candidate) => sameSquare(candidate.to, target));
    if (move) {
      match.playMove(move);
      setSelected(null);
      return;
    }

    if (state.board[row]?.[col] === turn) {
      const canMove = legalMoves.some((candidate) => sameSquare(candidate.from, target));
      setSelected(canMove ? target : null);
    } else {
      setSelected(null);
    }
  };

  const getCellLabel = (row: number, col: number) => {
    const position: Square = [row, col];
    const piece = state.board[row]?.[col] ?? null;
    const parts = [`${squareName(position)} square`];
    if (piece !== null) parts.push(`${piece === 0 ? 'Red' : 'Ivory'} army stone`);
    if (piece === turn && !computerTurn && !over) parts.push('selectable stone');
    if (selected && sameSquare(selected, position)) parts.push('selected');
    if (destinations.has(`${row},${col}`)) parts.push('legal destination');
    return parts.join(', ');
  };

  const renderCell = (row: number, col: number) => {
    const piece = state.board[row]?.[col] ?? null;
    const position: Square = [row, col];
    const isSelected = selected !== null && sameSquare(selected, position);
    const isDestination = destinations.has(`${row},${col}`);
    const targetMove = movesFromSelected.find((move) => sameSquare(move.to, position));
    const captures = targetMove ? getCapturedPieces(state.board, targetMove, turn).length : 0;

    return (
      <>
        {isSelected && <span className="latrunculi-selected" aria-hidden="true" />}
        {isDestination && (
          <span
            className={`latrunculi-destination ${captures > 0 ? 'latrunculi-capture' : ''}`}
            aria-hidden="true"
          >
            {captures > 0 ? '×' : ''}
          </span>
        )}
        {piece !== null && (
          <span
            className={`latrunculi-stone ${piece === 0 ? 'latrunculi-stone-red' : 'latrunculi-stone-ivory'}`}
            aria-hidden="true"
          >
            {piece === 0 ? 'I' : 'II'}
          </span>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Scoreboard entries={scoreEntries(config, humanSide, scores)} />

      <div className="grid grid-cols-2 gap-3" aria-label="Army strength">
        {([0, 1] as const).map((player) => (
          <div
            key={player}
            className={`flex items-center justify-between gap-2 rounded-2xl bg-surface px-3 py-2 shadow-sm ring-1 ring-border ${
              turn === player && !over ? 'ring-2 ring-primary/60' : ''
            }`}
          >
            <span className="flex min-w-0 items-center gap-2 font-semibold">
              <span
                className={`h-4 w-4 shrink-0 rounded-full ${
                  player === 0 ? 'latrunculi-army-red' : 'latrunculi-army-ivory'
                }`}
                aria-hidden="true"
              />
              <span className="truncate">{armyName(player, config, humanSide)}</span>
            </span>
            <span
              className="text-right font-bold tabular-nums"
              aria-label={`${state.survivingPieces[player]} stones remaining, ${state.capturedPieces[player]} captured`}
            >
              {state.survivingPieces[player]} <span className="text-xs text-subtle">remaining</span>
              <br />
              <span className="text-xs text-subtle">{state.capturedPieces[player]} captured</span>
            </span>
          </div>
        ))}
      </div>

      <div
        role="status"
        aria-live="polite"
        className="flex min-h-11 items-center justify-center gap-3 text-center"
      >
        <p className="font-semibold">{statusText(result, turn, config, humanSide)}</p>
        {computerTurn && <ThinkingDots />}
      </div>

      <div className="mx-auto w-full max-w-lg rounded-2xl bg-[#66513a] p-1.5 shadow-xl sm:p-2">
        <GameBoard
          label="LATRUNCULI battlefield"
          rows={SIZE}
          cols={SIZE}
          disabled={computerTurn || over}
          onCellTap={handleCellTap}
          renderCell={renderCell}
          getCellLabel={getCellLabel}
          gridClassName="latrunculi-board"
          cellClassName="latrunculi-square"
        />
      </div>

      <p className="text-center text-xs text-subtle">
        Move {state.totalMoves} of 200 · Select a stone, then an open square in its row or column.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          disabled={!match.canUndo}
          onClick={() => {
            match.undoMove();
            setSelected(null);
          }}
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
          Undo move
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            match.restart();
            setSelected(null);
          }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Restart
        </Button>
        <Button
          variant="secondary"
          disabled={over || computerTurn}
          onClick={() => match.finish(resignGame(state, turn))}
        >
          Resign
        </Button>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Main menu
        </Button>
      </div>

      <section className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-border">
        <h2 className="font-bold">Move history</h2>
        {state.moveHistory.length === 0 ? (
          <p className="mt-2 text-sm text-subtle">Moves will appear here as the battle unfolds.</p>
        ) : (
          <ol className="mt-2 max-h-36 space-y-1 overflow-y-auto text-sm" aria-label="Move history">
            {state.moveHistory.map(({ from, to, player, captured }, index) => (
              <li
                key={`${index}-${squareName(from)}-${squareName(to)}`}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-subtle">Turn {index + 1}</span>
                <span className="font-medium">
                  {config.mode === 'two-player'
                    ? `Player ${player + 1}`
                    : armyName(player, config, humanSide)}
                  {' · '}
                  {squareName(from)} → {squareName(to)}
                  {captured.length > 0 && ` · captured ${captured.length}`}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <details className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-border">
        <summary className="cursor-pointer font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40">
          How to play LATRUNCULI
        </summary>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-subtle">
          <li>Move a stone any clear distance horizontally or vertically.</li>
          <li>
            Surround an enemy stone between your moved stone and another friendly stone to capture
            it.
          </li>
          <li>Capture the opposing army or block all its legal moves to win.</li>
        </ul>
      </details>

      {summary && (
        <GameOverDialog
          open={dialogOpen}
          outcome={summary.outcome}
          headline={summary.headline}
          message={summary.message}
          pointsEarned={config.mode === 'computer' ? pointsEarned : undefined}
          onPlayAgain={() => {
            match.restart();
            setSelected(null);
          }}
          onBackToMenu={() => navigate('/games')}
          onClose={match.closeDialog}
        />
      )}
    </div>
  );
}
