import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Difficulty } from '@/engine/difficulty';
import { RotateCcw, Undo2 } from 'lucide-react';
import Button from '@/components/Button';
import GameBoard from '@/components/GameBoard';
import GameOverDialog from '@/components/GameOverDialog';
import PassDeviceScreen from '@/components/PassDeviceScreen';
import Scoreboard from '@/components/Scoreboard';
import ThinkingDots from '@/components/ThinkingDots';
import { useSettings } from '@/hooks/useSettings';
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
  if (config.mode === 'two-player') {
    return `Player ${player + 1} · ${player === 0 ? 'Red' : 'Blue'} Army`;
  }
  return player === humanSide ? 'Your' : 'Computer';
}

function armyTitle(player: 0 | 1): string {
  return player === 0 ? 'Red Army' : 'Blue Army';
}

function difficultyTitle(difficulty: Difficulty): string {
  if (difficulty === 'beginner') return 'Recruit';
  if (difficulty === 'professional') return 'Centurion';
  return 'General';
}

export default function LatrunculiMatch({
  config,
  onReturnToMenu,
}: {
  config: MatchConfig;
  onReturnToMenu: () => void;
}) {
  const { settings } = useSettings();
  const match = useEngineMatch({
    engine: latrunculi,
    config,
    chooseMove,
    enableUndo: true,
    initialState: () => createLatrunculiState(config.mode),
    thinkingDelayMs: 700,
  });
  const {
    state,
    result,
    over,
    turn,
    humanSide,
    computerTurn,
    scores,
    dialogOpen,
    pointsEarned,
    aiError,
  } = match;
  const [selected, setSelected] = useState<Square | null>(null);
  const [handoffPending, setHandoffPending] = useState(false);
  const previousMoveCount = useRef(state.totalMoves);

  useEffect(() => {
    setSelected(null);
    if (
      config.mode === 'two-player' &&
      state.status === 'active' &&
      state.totalMoves > previousMoveCount.current
    ) {
      setHandoffPending(true);
    }
    previousMoveCount.current = state.totalMoves;
  }, [computerTurn, config.mode, state.status, state.totalMoves, turn]);

  const legalMoves = legalMovesFor(state);
  const movesFromSelected = selected
    ? legalMoves.filter((move) => sameSquare(move.from, selected))
    : [];
  const destinations = new Set(movesFromSelected.map((move) => `${move.to[0]},${move.to[1]}`));
  const summary = result === null ? null : describeResult(result, config, humanSide);
  const gameModeLabel =
    config.mode === 'two-player'
      ? 'LOCAL BATTLE · PASS & PLAY'
      : `COMPUTER BATTLE · ${difficultyTitle(config.difficulty)}`;
  const victoryPresentation =
    result !== null && result !== 'draw'
      ? {
          title: 'VICTORIA!',
          subtitle: `THE ${result === 0 ? 'RED' : 'BLUE'} ARMY PREVAILS.`,
          winner:
            config.mode === 'two-player'
              ? `Player ${result + 1} · ${armyTitle(result)}`
              : result === humanSide
                ? `You · ${armyTitle(result)}`
                : `Computer · ${armyTitle(result)}`,
          finalPieces: state.survivingPieces,
          totalMoves: state.totalMoves,
          armyNames: ['Red Army', 'Blue Army'] as const,
        }
      : undefined;

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
    if (piece !== null) parts.push(`${piece === 0 ? 'Red' : 'Blue'} army stone`);
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
    const lastMove = state.moveHistory[state.moveHistory.length - 1];
    const justMoved = lastMove !== undefined && sameSquare(lastMove.to, position);
    const movementStyle: CSSProperties & { '--move-x'?: number; '--move-y'?: number } =
      justMoved && lastMove
        ? {
            '--move-x': lastMove.from[1] - col,
            '--move-y': lastMove.from[0] - row,
          }
        : {};

    return (
      <>
        {isSelected && <span className="latrunculi-selected" aria-hidden="true" />}
        {isDestination && settings.showLegalMoveHighlights && (
          <span
            className={`latrunculi-destination ${captures > 0 ? 'latrunculi-capture' : ''}`}
            aria-hidden="true"
          >
            {captures > 0 ? '×' : ''}
          </span>
        )}
        {piece !== null && (
          <span
            className={`latrunculi-stone ${piece === 0 ? 'latrunculi-stone-red' : 'latrunculi-stone-blue'} ${justMoved && settings.showLastMoveMarker ? 'latrunculi-stone-last-move' : ''} ${justMoved && settings.animationSpeed !== 'off' && !settings.reducedMotion ? 'latrunculi-stone-moving' : ''}`}
            style={movementStyle}
            aria-hidden="true"
          >
            {piece === 0 ? 'I' : 'II'}
          </span>
        )}
        {settings.showBoardCoordinates && (row === SIZE - 1 || col === 0) && (
          <span className="latrunculi-coordinate" aria-hidden="true">
            {row === SIZE - 1 ? String.fromCharCode(65 + col) : ''}
            {col === 0 ? SIZE - row : ''}
          </span>
        )}
      </>
    );
  };

  return (
    <div className="latrunculi-match flex flex-1 flex-col gap-4">
      <header className="latrunculi-match-header">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-[0.12em]">LATRUNCULI</h1>
          <p className="mt-1 text-xs font-semibold tracking-[0.18em] text-[#756147]">
            LUDUS LATRUNCULORUM
          </p>
        </div>
        <span className="latrunculi-mode-chip">{gameModeLabel}</span>
      </header>

      <div className="latrunculi-match-layout">
        <section className="latrunculi-battlefield-column" aria-label="Battlefield section">
          <div className={`latrunculi-turn-banner ${turn === 0 ? 'army-red' : 'army-blue'}`}>
            <span
              className={`h-4 w-4 shrink-0 rounded-full ${
                turn === 0 ? 'latrunculi-army-red' : 'latrunculi-army-blue'
              }`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold" role="status" aria-live="polite">
                {statusText(result, turn, config, humanSide)}
              </p>
              <p className="text-xs">
                Active army: {armyTitle(turn)} · {armyName(turn, config, humanSide)}
              </p>
            </div>
            {computerTurn && <ThinkingDots />}
          </div>

          {handoffPending && config.mode === 'two-player' && !over ? (
            <PassDeviceScreen
              title={`Pass device to Player ${turn + 1}`}
              description={`Player ${turn + 1} controls the ${armyTitle(turn)}. Tap Continue when ready to take your turn.`}
              onContinue={() => setHandoffPending(false)}
            />
          ) : (
            <div className="mx-auto w-full max-w-2xl rounded-2xl bg-[#66513a] p-1.5 shadow-xl sm:p-2">
              <GameBoard
                label="LATRUNCULI battlefield"
                rows={SIZE}
                cols={SIZE}
                disabled={computerTurn || over || handoffPending}
                onCellTap={handleCellTap}
                renderCell={renderCell}
                getCellLabel={getCellLabel}
                gridClassName="latrunculi-board"
                cellClassName="latrunculi-square"
              />
            </div>
          )}

          <p className="text-center text-xs text-subtle">
            Move {state.totalMoves} of 200 · Select a stone, then an open square in its row or
            column.
          </p>
        </section>

        <aside className="latrunculi-game-info">
          <Scoreboard entries={scoreEntries(config, humanSide, scores)} />

          <section aria-label="Army strength" className="grid grid-cols-2 gap-3">
            {([0, 1] as const).map((player) => (
              <div
                key={player}
                className={`latrunculi-army-card ${
                  turn === player && !over ? 'latrunculi-army-card-active' : ''
                }`}
              >
                <span
                  className={`h-4 w-4 shrink-0 rounded-full ${
                    player === 0 ? 'latrunculi-army-red' : 'latrunculi-army-blue'
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{armyTitle(player)}</p>
                  <p className="truncate text-xs text-subtle">
                    {armyName(player, config, humanSide)}
                  </p>
                  <p className="mt-2 text-sm font-bold tabular-nums">
                    {state.survivingPieces[player]} remaining
                  </p>
                  <p className="text-xs text-subtle">{state.capturedPieces[player]} captured</p>
                </div>
              </div>
            ))}
          </section>

          {aiError && (
            <p role="alert" className="rounded-xl bg-danger/10 p-3 text-center text-sm text-danger">
              The computer could not complete its search. Restart the match to try again.
            </p>
          )}

          <section className="grid grid-cols-2 gap-3" aria-label="Game controls">
            <Button
              variant="secondary"
              disabled={!match.canUndo}
              onClick={() => {
                match.undoMove();
                setHandoffPending(false);
                setSelected(null);
              }}
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
              Undo
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                match.restart();
                setHandoffPending(false);
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
            <Button variant="secondary" onClick={onReturnToMenu}>
              Main menu
            </Button>
          </section>

          <section className="latrunculi-info-panel">
            <h2 className="font-bold">Move history</h2>
            {state.moveHistory.length === 0 ? (
              <p className="mt-2 text-sm text-subtle">
                Moves will appear here as the battle unfolds.
              </p>
            ) : (
              <ol
                className="mt-2 max-h-52 space-y-1 overflow-y-auto text-sm"
                aria-label="Move history"
              >
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

          <details className="latrunculi-info-panel">
            <summary className="cursor-pointer font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40">
              How to play LATRUNCULI
            </summary>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-subtle">
              <li>Move a stone any clear distance horizontally or vertically.</li>
              <li>Player 1 commands the Red Army; Player 2 commands the Blue Army.</li>
              <li>
                Surround an enemy stone between your moved stone and another friendly stone to
                capture it.
              </li>
              <li>Capture the opposing army or block all its legal moves to win.</li>
            </ul>
          </details>
        </aside>
      </div>

      {summary && (
        <GameOverDialog
          open={dialogOpen}
          outcome={summary.outcome}
          headline={summary.headline}
          message={summary.message}
          victoryPresentation={victoryPresentation}
          playAgainLabel="New game"
          backToMenuLabel="Main menu"
          pointsEarned={config.mode === 'computer' ? pointsEarned : undefined}
          onPlayAgain={() => {
            match.restart();
            setSelected(null);
            setHandoffPending(false);
          }}
          onBackToMenu={onReturnToMenu}
          onClose={match.closeDialog}
        />
      )}
    </div>
  );
}
