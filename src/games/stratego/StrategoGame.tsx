import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';

type Side = 0 | 1;
type PieceType =
  | 'flag'
  | 'bomb'
  | 'spy'
  | 'scout'
  | 'miner'
  | 'sergeant'
  | 'lieutenant'
  | 'captain'
  | 'major'
  | 'colonel'
  | 'general'
  | 'marshal';

interface Piece {
  id: string;
  side: Side;
  type: PieceType;
  rank: number;
}

type BoardCell = Piece | null;
type Board = BoardCell[][];

interface Position {
  row: number;
  col: number;
}

type BattleResult = 'attacker' | 'defender' | 'draw';

const ARMY_ORDER: PieceType[] = [
  'marshal',
  'general',
  'colonel',
  'major',
  'captain',
  'captain',
  'lieutenant',
  'lieutenant',
  'sergeant',
  'sergeant',
  'miner',
  'miner',
  'scout',
  'scout',
  'scout',
  'scout',
  'scout',
  'spy',
  'bomb',
  'bomb',
  'bomb',
  'bomb',
  'bomb',
  'bomb',
  'flag',
];

const PIECE_RANKS: Record<PieceType, number> = {
  flag: 0,
  bomb: 12,
  spy: 1,
  scout: 2,
  miner: 3,
  sergeant: 4,
  lieutenant: 5,
  captain: 6,
  major: 7,
  colonel: 8,
  general: 9,
  marshal: 10,
};

const pieceBadge = (piece: Piece) => {
  if (piece.type === 'flag') return 'F';
  if (piece.type === 'bomb') return '💣';
  if (piece.type === 'spy') return '1';
  if (piece.type === 'scout') return '2';
  if (piece.type === 'miner') return '3';
  if (piece.type === 'sergeant') return '4';
  if (piece.type === 'lieutenant') return '5';
  if (piece.type === 'captain') return '6';
  if (piece.type === 'major') return '7';
  if (piece.type === 'colonel') return '8';
  if (piece.type === 'general') return '9';
  return '10';
};

function createBoard(): Board {
  const board = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => null as BoardCell));

  const buildArmy = (side: Side) => {
    const rowOffset = side === 0 ? 0 : 6;
    ARMY_ORDER.forEach((type, index) => {
      const row = rowOffset + Math.floor(index / 10);
      const col = index % 10;
      const piece: Piece = {
        id: `${side}-${type}-${index}`,
        side,
        type,
        rank: PIECE_RANKS[type],
      };
      setCell(board, row, col, piece);
    });
  };

  buildArmy(0);
  buildArmy(1);

  return board;
}

function cloneBoard(board: Board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function getCell(board: Board, row: number, col: number) {
  return board[row]?.[col] ?? null;
}

function setCell(board: Board, row: number, col: number, value: BoardCell) {
  const rowCells = board[row];
  if (!rowCells) return;
  rowCells[col] = value;
}

function isInsideBoard(position: Position) {
  return position.row >= 0 && position.row < 10 && position.col >= 0 && position.col < 10;
}

function isClearPath(board: Board, from: Position, to: Position) {
  const stepRow = Math.sign(to.row - from.row);
  const stepCol = Math.sign(to.col - from.col);

  if (stepRow !== 0 && stepCol !== 0) return false;

  let row = from.row + stepRow;
  let col = from.col + stepCol;
  while (row !== to.row || col !== to.col) {
    if (board[row]?.[col]) return false;
    row += stepRow;
    col += stepCol;
  }

  return true;
}

function getLegalMoves(board: Board, from: Position, piece: Piece): Position[] {
  if (piece.type === 'flag' || piece.type === 'bomb') return [];

  const moves: Position[] = [];
  const directions = [
    { row: 1, col: 0 },
    { row: -1, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: -1 },
  ];

  if (piece.type === 'scout') {
    for (const direction of directions) {
      let row = from.row + direction.row;
      let col = from.col + direction.col;
      while (isInsideBoard({ row, col })) {
        const occupant = getCell(board, row, col);
        if (!occupant) {
          moves.push({ row, col });
          row += direction.row;
          col += direction.col;
          continue;
        }
        if (occupant.side !== piece.side) {
          moves.push({ row, col });
        }
        break;
      }
    }
    return moves;
  }

  for (const direction of directions) {
    const target = { row: from.row + direction.row, col: from.col + direction.col };
    if (!isInsideBoard(target)) continue;
    const occupant = getCell(board, target.row, target.col);
    if (!occupant) {
      moves.push(target);
      continue;
    }
    if (occupant.side !== piece.side) {
      moves.push(target);
    }
  }

  return moves;
}

function resolveBattle(attacker: Piece, defender: Piece): BattleResult {
  if (attacker.type === 'miner' && defender.type === 'bomb') return 'attacker';
  if (defender.type === 'miner' && attacker.type === 'bomb') return 'defender';
  if (attacker.type === 'spy' && defender.type === 'marshal') return 'attacker';
  if (defender.type === 'spy' && attacker.type === 'marshal') return 'defender';
  if (attacker.rank > defender.rank) return 'attacker';
  if (attacker.rank < defender.rank) return 'defender';
  return 'draw';
}

function getWinner(board: Board) {
  const playerOneFlag = board.some((row) =>
    row.some((cell) => cell?.type === 'flag' && cell.side === 0),
  );
  const playerTwoFlag = board.some((row) =>
    row.some((cell) => cell?.type === 'flag' && cell.side === 1),
  );

  if (!playerOneFlag && playerTwoFlag) return 1;
  if (!playerTwoFlag && playerOneFlag) return 0;

  const playerOnePieces = board.flat().some((cell) => cell && cell.side === 0 && cell.type !== 'flag');
  const playerTwoPieces = board.flat().some((cell) => cell && cell.side === 1 && cell.type !== 'flag');

  if (!playerOnePieces && playerTwoPieces) return 1;
  if (!playerTwoPieces && playerOnePieces) return 0;

  return null;
}

export default function StrategoGame() {
  const [board, setBoard] = useState<Board>(() => createBoard());
  const [turn, setTurn] = useState<Side>(0);
  const [selected, setSelected] = useState<Position | null>(null);

  const winner = getWinner(board);

  const handleReset = () => {
    setBoard(createBoard());
    setTurn(0);
    setSelected(null);
  };

  const handleCellClick = (row: number, col: number) => {
    if (winner !== null) return;

    const occupant = getCell(board, row, col);

    if (occupant && occupant.side === turn) {
      setSelected({ row, col });
      return;
    }

    if (!selected) return;

    const from = selected;
    const movingPiece = getCell(board, from.row, from.col);
    if (!movingPiece || movingPiece.side !== turn) return;

    const validMoves = getLegalMoves(board, from, movingPiece);
    const moveIsValid = validMoves.some((position) => position.row === row && position.col === col);
    if (!moveIsValid) return;

    const target = getCell(board, row, col);
    const nextBoard = cloneBoard(board);

    if (movingPiece.type === 'scout' && !target) {
      const pathValid = isClearPath(board, from, { row, col });
      if (!pathValid) {
        return;
      }
    }

    if (target && target.side !== movingPiece.side) {
      const result = resolveBattle(movingPiece, target);
      if (result === 'attacker') {
        setCell(nextBoard, from.row, from.col, null);
        setCell(nextBoard, row, col, movingPiece);
      } else if (result === 'defender') {
        setCell(nextBoard, from.row, from.col, null);
        setCell(nextBoard, row, col, target);
      } else {
        setCell(nextBoard, from.row, from.col, null);
        setCell(nextBoard, row, col, null);
      }
    } else {
      setCell(nextBoard, from.row, from.col, null);
      setCell(nextBoard, row, col, movingPiece);
    }

    setBoard(nextBoard);
    setSelected(null);
    setTurn((currentTurn) => (currentTurn === 0 ? 1 : 0));
  };

  const selectedPiece = selected ? getCell(board, selected.row, selected.col) : null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="text-center">
        <p role="status" aria-live="polite" className="font-semibold">
          {winner === null ? `Player ${turn + 1}'s turn` : `Player ${winner + 1} wins!`}
        </p>
        <p className="mt-1 text-sm text-subtle">
          {selectedPiece
            ? `Selected ${selectedPiece.type} for ${selectedPiece.side === 0 ? 'Player 1' : 'Player 2'}.`
            : 'Choose one of your pieces to move.'}
        </p>
      </Card>

      <Card className="mx-auto w-full max-w-2xl">
        <div className="grid grid-cols-10 gap-1 rounded-2xl bg-background p-1">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isSelected = selected?.row === rowIndex && selected?.col === colIndex;
              const isActive = cell && cell.side === turn;
              const isValidTarget =
                selectedPiece &&
                getLegalMoves(board, selected!, selectedPiece).some(
                  (move) => move.row === rowIndex && move.col === colIndex,
                );

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  type="button"
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  aria-label={
                    cell
                      ? `Player ${cell.side + 1} ${cell.type} at row ${rowIndex + 1} column ${colIndex + 1}`
                      : `Empty square row ${rowIndex + 1} column ${colIndex + 1}`
                  }
                  className={`flex aspect-square items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-primary bg-primary-soft text-primary'
                      : isValidTarget
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-surface'
                  } ${isActive ? 'ring-2 ring-primary/30' : ''}`}
                >
                  {cell ? (
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                        cell.side === 0
                          ? 'border-primary bg-primary-soft text-primary'
                          : 'border-accent bg-accent/15 text-accent'
                      }`}
                    >
                      {pieceBadge(cell)}
                    </span>
                  ) : null}
                </button>
              );
            }),
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset board
        </Button>
        <div className="rounded-2xl bg-surface p-3 text-sm text-subtle ring-1 ring-border">
          <p className="font-semibold text-foreground">Rules</p>
          <p>Higher rank wins in combat, scouts move in straight lines, and bombs stop attackers.</p>
        </div>
      </div>
    </div>
  );
}
