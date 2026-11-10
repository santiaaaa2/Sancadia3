import { useState } from 'react';
import { RotateCcw, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import GameOverDialog from '@/components/GameOverDialog';
import Scoreboard from '@/components/Scoreboard';
import ThinkingDots from '@/components/ThinkingDots';
import TraditionalPiece, { type TraditionalPieceDefinition } from '@/components/TraditionalPiece';
import type { MatchConfig } from '@/games/matchConfig';
import { describeResult, scoreEntries, statusText } from '@/games/matchOutcome';
import { useEngineMatch } from '@/games/useEngineMatch';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  getLegalMovesFor,
  xiangqi,
  type XiangqiPiece,
  type XiangqiPieceType,
} from '@/games/xiangqi/rules';

const PIECE_NAMES: Record<XiangqiPieceType, string> = {
  general: 'general',
  advisor: 'advisor',
  elephant: 'elephant',
  horse: 'horse',
  chariot: 'chariot',
  cannon: 'cannon',
  soldier: 'soldier',
};

const PIECE_MARKS: Record<XiangqiPieceType, readonly [string, string, string]> = {
  general: ['帥', '將', 'G'],
  advisor: ['仕', '士', 'A'],
  elephant: ['相', '象', 'E'],
  horse: ['傌', '馬', 'H'],
  chariot: ['俥', '車', 'R'],
  cannon: ['炮', '砲', 'C'],
  soldier: ['兵', '卒', 'S'],
};

function pieceDefinition(piece: XiangqiPiece): TraditionalPieceDefinition {
  const [redGlyph, blackGlyph, westernGlyph] = PIECE_MARKS[piece.type];
  return {
    glyph: piece.player === 0 ? redGlyph : blackGlyph,
    label: `${piece.player === 0 ? 'Red' : 'Black'} ${PIECE_NAMES[piece.type]}`,
    shape: 'circle',
    colourToken: piece.player === 0 ? 'red' : 'black',
    westernGlyph,
  };
}

export default function XiangqiMatch({ config }: { config: MatchConfig }) {
  const navigate = useNavigate();
  const match = useEngineMatch({
    engine: xiangqi,
    config,
    chooseMove: (state) => xiangqi.legalMoves(state)[0] ?? null,
    enableUndo: true,
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
    canUndo,
  } = match;
  const [selected, setSelected] = useState<number | null>(null);

  const allLegal = getLegalMovesFor(state, turn);
  const movesFromSelected =
    selected === null ? [] : allLegal.filter((move) => move.from === selected);
  const destinations = new Map(movesFromSelected.map((move) => [move.to, move]));

  const handleCellTap = (index: number) => {
    if (computerTurn || over) return;
    const destinationMove = destinations.get(index);
    if (destinationMove) {
      match.playMove(destinationMove);
      setSelected(null);
      return;
    }
    const piece = state.board[index];
    if (piece?.player === turn && allLegal.some((move) => move.from === index)) {
      setSelected(index);
    } else {
      setSelected(null);
    }
  };

  const summary = result === null ? null : describeResult(result, config, humanSide);
  const lastMove = state.lastMove
    ? new Set([state.lastMove.from, state.lastMove.to])
    : new Set<number>();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Scoreboard entries={scoreEntries(config, humanSide, scores)} />

      <div
        role="status"
        aria-live="polite"
        className="flex min-h-11 items-center justify-center gap-3"
      >
        <p className="font-semibold">{statusText(result, turn, config, humanSide)}</p>
        {computerTurn && <ThinkingDots />}
      </div>

      <div
        role="group"
        aria-label="Xiangqi board"
        className="relative mx-auto w-full max-w-[36rem] overflow-hidden rounded-xl border-2 border-amber-900/70 bg-amber-100 shadow-lg"
        style={{ aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}` }}
      >
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${BOARD_HEIGHT}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: BOARD_WIDTH * BOARD_HEIGHT }, (_, index) => {
            const row = Math.floor(index / BOARD_WIDTH);
            const col = index % BOARD_WIDTH;
            const piece = state.board[index] ?? null;
            const move = destinations.get(index);
            const capture = move !== undefined && piece !== null;
            const isSelected = selected === index;
            const isLegalOrigin =
              !computerTurn && !over && allLegal.some((candidate) => candidate.from === index);
            return (
              <button
                key={index}
                type="button"
                disabled={computerTurn || over}
                onClick={() => handleCellTap(index)}
                aria-label={
                  piece
                    ? `${piece.player === 0 ? 'Red' : 'Black'} ${PIECE_NAMES[piece.type]} at row ${row + 1}, column ${col + 1}`
                    : `Empty row ${row + 1}, column ${col + 1}`
                }
                aria-pressed={isSelected}
                className={`relative flex min-h-0 min-w-0 items-center justify-center border-b border-r border-amber-900/40 transition focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  row === 4 || row === 5 ? 'bg-amber-200/70' : 'bg-amber-100'
                } ${isLegalOrigin ? 'cursor-pointer hover:bg-amber-300/70' : ''} ${
                  isSelected ? 'z-[1] ring-2 ring-primary' : ''
                } ${lastMove.has(index) ? 'bg-accent/30' : ''}`}
              >
                {piece && (
                  <span className="relative z-[1] flex h-[82%] w-[82%] items-center justify-center rounded-full bg-amber-100 p-[2px] shadow-md ring-1 ring-amber-900/70">
                    <TraditionalPiece piece={pieceDefinition(piece)} />
                  </span>
                )}
                {move && (
                  <span
                    aria-hidden="true"
                    className={`absolute inset-0 z-[2] rounded-full ${
                      capture ? 'ring-4 ring-danger/70' : 'bg-primary/25'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2 rounded bg-amber-100/90 px-2 py-0.5 text-[clamp(0.55rem,2vw,0.8rem)] font-semibold tracking-wide text-amber-950"
        >
          楚河 · 漢界
        </span>
        <span className="sr-only">
          {BOARD_HEIGHT} rows by {BOARD_WIDTH} columns. Select one of your pieces, then a marked
          destination.
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {canUndo && (
          <Button variant="secondary" onClick={match.undoMove}>
            <Undo2 className="h-4 w-4" aria-hidden="true" />
            Undo
          </Button>
        )}
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
      </div>

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
