import type { GameEngine, Player, Winner } from '@/engine/types';

export const BOARD_SIZE = 5;
export const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;
export const CENTRE_SQUARE = 12;

export type SeegaPhase = 'placement' | 'movement';

export interface SeegaRuleset {
  stonesPerPlayer: number;
  stonesPerTurn: number;
  firstMover: 'last-placement' | Player;
  blockedRule: boolean;
  centreRestricted: boolean;
  noCaptureMoveLimit: number;
  repetitionLimit: number;
}

export const DEFAULT_SEEGA_RULESET: Readonly<SeegaRuleset> = {
  stonesPerPlayer: 12,
  stonesPerTurn: 2,
  firstMover: 'last-placement',
  blockedRule: true,
  centreRestricted: true,
  noCaptureMoveLimit: 50,
  repetitionLimit: 3,
};

export interface SeegaState {
  readonly board: readonly (Player | null)[];
  readonly phase: SeegaPhase;
  readonly turn: Player;
  readonly placementsMade: number;
  readonly placementsInTurn: number;
  readonly lastPlacementPlayer: Player | null;
  readonly noCaptureMoves: number;
  readonly movementMoves: number;
  readonly history: readonly string[];
  readonly lastMove: SeegaMove | null;
  readonly ruleset: Readonly<SeegaRuleset>;
}

export interface SeegaPathMove {
  readonly from: number;
  readonly path: readonly number[];
}

export interface SeegaBlockedMove {
  readonly type: 'blocked-remove';
  readonly at: number;
}

export type SeegaMove = SeegaPathMove | SeegaBlockedMove;

function otherPlayer(player: Player): Player {
  return player === 0 ? 1 : 0;
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function index(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

function rowOf(square: number): number {
  return Math.floor(square / BOARD_SIZE);
}

function colOf(square: number): number {
  return square % BOARD_SIZE;
}

function orthogonalNeighbors(square: number): number[] {
  const row = rowOf(square);
  const col = colOf(square);
  return [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ]
    .filter(([nextRow, nextCol]) => inBounds(nextRow!, nextCol!))
    .map(([nextRow, nextCol]) => index(nextRow!, nextCol!));
}

function adjacentSquares(square: number): number[] {
  const row = rowOf(square);
  const col = colOf(square);
  const adjacent: number[] = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
      if (rowOffset === 0 && colOffset === 0) continue;
      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;
      if (inBounds(nextRow, nextCol)) adjacent.push(index(nextRow, nextCol));
    }
  }
  return adjacent;
}

function positionKey(board: readonly (Player | null)[], phase: SeegaPhase, turn: Player): string {
  return `${phase}:${turn}:${board.map((player) => (player === null ? '.' : player)).join('')}`;
}

function countStones(board: readonly (Player | null)[], player: Player): number {
  return board.filter((owner) => owner === player).length;
}

function capturesFrom(board: readonly (Player | null)[], square: number, player: Player): number[] {
  const captured: number[] = [];
  for (const neighbor of orthogonalNeighbors(square)) {
    const enemy = board[neighbor];
    if (enemy !== otherPlayer(player)) continue;
    const beyondRow = rowOf(neighbor) + (rowOf(neighbor) - rowOf(square));
    const beyondCol = colOf(neighbor) + (colOf(neighbor) - colOf(square));
    if (!inBounds(beyondRow, beyondCol)) continue;
    if (board[index(beyondRow, beyondCol)] === player) captured.push(neighbor);
  }
  return captured;
}

interface StepResult {
  board: Array<Player | null>;
  captured: number;
}

function stepBoard(
  source: readonly (Player | null)[],
  from: number,
  to: number,
  player: Player,
): StepResult {
  const board = [...source];
  board[from] = null;
  board[to] = player;
  const captured = capturesFrom(board, to, player);
  for (const square of captured) board[square] = null;
  return { board, captured: captured.length };
}

function movementMovesFor(state: SeegaState, player: Player): SeegaPathMove[] {
  const moves: SeegaPathMove[] = [];
  for (let from = 0; from < BOARD_CELLS; from++) {
    if (state.board[from] !== player) continue;
    for (const to of orthogonalNeighbors(from)) {
      if (state.board[to] !== null) continue;
      const firstStep = stepBoard(state.board, from, to, player);
      if (firstStep.captured === 0) {
        moves.push({ from, path: [to] });
        continue;
      }

      const firstPath = [to];
      const searchChains = (
        board: readonly (Player | null)[],
        current: number,
        path: readonly number[],
        visited: ReadonlySet<number>,
      ) => {
        let continued = false;
        for (const next of orthogonalNeighbors(current)) {
          if (board[next] !== null || visited.has(next)) continue;
          const nextStep = stepBoard(board, current, next, player);
          if (nextStep.captured === 0) continue;
          continued = true;
          const nextPath = [...path, next];
          searchChains(nextStep.board, next, nextPath, new Set([...visited, next]));
        }
        if (!continued) moves.push({ from, path: [...path] });
      };
      searchChains(firstStep.board, to, firstPath, new Set([from, to]));
    }
  }
  return moves;
}

function blockedRemovalMoves(state: SeegaState, blockedPlayer: Player): SeegaBlockedMove[] {
  if (!state.ruleset.blockedRule) return [];
  const remover = otherPlayer(blockedPlayer);
  const removals: SeegaBlockedMove[] = [];
  for (let square = 0; square < BOARD_CELLS; square++) {
    if (state.board[square] !== remover) continue;
    const board = [...state.board];
    board[square] = null;
    if (movementMovesFor({ ...state, board }, blockedPlayer).length > 0) {
      removals.push({ type: 'blocked-remove', at: square });
    }
  }
  return removals;
}

function allLegalMoves(state: SeegaState): SeegaMove[] {
  if (state.phase === 'placement') {
    const placements: SeegaMove[] = [];
    for (let square = 0; square < BOARD_CELLS; square++) {
      if (state.board[square] !== null) continue;
      if (state.ruleset.centreRestricted && square === CENTRE_SQUARE) continue;
      placements.push({ from: square, path: [] });
    }
    return placements;
  }
  const moves = movementMovesFor(state, state.turn);
  if (moves.length > 0) return moves;

  const removals = blockedRemovalMoves(state, state.turn);
  if (removals.length > 0) return removals;

  if (state.ruleset.blockedRule) {
    return movementMovesFor(state, otherPlayer(state.turn));
  }
  return [];
}

function isDraw(state: SeegaState): boolean {
  if (state.phase !== 'movement') return false;
  const key = positionKey(state.board, state.phase, state.turn);
  return (
    state.noCaptureMoves >= state.ruleset.noCaptureMoveLimit ||
    state.history.filter((position) => position === key).length >= state.ruleset.repetitionLimit
  );
}

export function getLegalMovesFor(state: SeegaState, player: Player): SeegaMove[] {
  if (state.phase === 'placement') {
    if (state.turn !== player) return [];
    return allLegalMoves(state);
  }
  const moves = movementMovesFor(state, player);
  if (moves.length > 0) return moves;
  if (player !== state.turn) return [];
  const removals = blockedRemovalMoves(state, player);
  if (removals.length > 0) return removals;
  if (state.ruleset.blockedRule) return movementMovesFor(state, otherPlayer(player));
  return [];
}

export function countMoveCaptures(
  state: SeegaState,
  move: SeegaMove,
  player: Player = state.turn,
): number {
  if ('type' in move || move.path.length === 0) return 0;
  let board = [...state.board];
  let from = move.from;
  let captured = 0;
  for (const to of move.path) {
    const result = stepBoard(board, from, to, player);
    board = result.board;
    from = to;
    captured += result.captured;
  }
  return captured;
}

export function createInitialSeegaState(
  ruleset: Readonly<SeegaRuleset> = DEFAULT_SEEGA_RULESET,
): SeegaState {
  const board: Array<Player | null> = Array.from({ length: BOARD_CELLS }, () => null);
  return {
    board,
    phase: 'placement',
    turn: 0,
    placementsMade: 0,
    placementsInTurn: 0,
    lastPlacementPlayer: null,
    noCaptureMoves: 0,
    movementMoves: 0,
    history: [],
    lastMove: null,
    ruleset: { ...ruleset },
  };
}

export const seega: GameEngine<SeegaState, SeegaMove> = {
  id: 'seega',
  initialState: () => createInitialSeegaState(),
  currentPlayer: (state) => {
    if (state.phase === 'placement' || movementMovesFor(state, state.turn).length > 0) {
      return state.turn;
    }
    const opponent = otherPlayer(state.turn);
    if (
      blockedRemovalMoves(state, state.turn).length > 0 ||
      movementMovesFor(state, opponent).length > 0
    ) {
      return opponent;
    }
    return state.turn;
  },
  legalMoves(state) {
    if (isDraw(state) || this.winner(state) !== null) return [];
    if (state.phase === 'placement') return allLegalMoves(state);
    const currentPlayer = this.currentPlayer(state);
    if (currentPlayer !== state.turn) {
      const removals = blockedRemovalMoves(state, state.turn);
      return removals.length > 0 ? removals : movementMovesFor(state, currentPlayer);
    }
    return movementMovesFor(state, state.turn);
  },
  applyMove(state, move) {
    if (!this.legalMoves(state).some((candidate) => this.movesEqual!(candidate, move))) {
      throw new Error('Illegal Seega move.');
    }

    if (state.phase === 'placement') {
      if ('type' in move) throw new Error('Illegal Seega placement move.');
      const board = [...state.board];
      board[move.from] = state.turn;
      const placementsMade = state.placementsMade + 1;
      const placementsInTurn = state.placementsInTurn + 1;
      const lastPlacementPlayer = state.turn;
      const isComplete = placementsMade === state.ruleset.stonesPerPlayer * 2;
      const phase: SeegaPhase = isComplete ? 'movement' : 'placement';
      const turn = isComplete
        ? state.ruleset.firstMover === 'last-placement'
          ? state.turn
          : state.ruleset.firstMover
        : placementsInTurn < state.ruleset.stonesPerTurn
          ? state.turn
          : otherPlayer(state.turn);
      return {
        ...state,
        board,
        phase,
        turn,
        placementsMade,
        placementsInTurn:
          isComplete || placementsInTurn >= state.ruleset.stonesPerTurn ? 0 : placementsInTurn,
        lastPlacementPlayer,
        lastMove: { from: move.from, path: [] },
        history: isComplete ? [positionKey(board, phase, turn)] : state.history,
      };
    }

    const actor = this.currentPlayer(state);
    if ('type' in move) {
      const board = [...state.board];
      board[move.at] = null;
      const next: SeegaState = {
        ...state,
        board,
        noCaptureMoves: state.noCaptureMoves + 1,
        movementMoves: state.movementMoves + 1,
        lastMove: move,
        history: [...state.history, positionKey(board, state.phase, state.turn)],
      };
      return next;
    }

    let board = [...state.board];
    let from = move.from;
    let captures = 0;
    for (const to of move.path) {
      const result = stepBoard(board, from, to, actor);
      board = result.board;
      captures += result.captured;
      from = to;
    }
    const turn = actor === state.turn ? otherPlayer(actor) : state.turn;
    const next: SeegaState = {
      ...state,
      board,
      turn,
      noCaptureMoves: captures > 0 ? 0 : state.noCaptureMoves + 1,
      movementMoves: state.movementMoves + 1,
      lastMove: { from: move.from, path: [...move.path] },
      history: [...state.history, positionKey(board, state.phase, turn)],
    };
    return next;
  },
  isTerminal(state) {
    return this.winner(state) !== null;
  },
  winner(state): Winner {
    if (state.phase !== 'movement') return null;
    const stones0 = countStones(state.board, 0);
    const stones1 = countStones(state.board, 1);
    if (stones0 === 0) return 1;
    if (stones1 === 0) return 0;
    if (isDraw(state)) return 'draw';

    const moves0 = movementMovesFor(state, 0);
    const moves1 = movementMovesFor(state, 1);
    if (moves0.length === 0 && moves1.length === 0) {
      if (
        !state.ruleset.blockedRule ||
        (blockedRemovalMoves(state, 0).length === 0 && blockedRemovalMoves(state, 1).length === 0)
      ) {
        return 'draw';
      }
    }
    return null;
  },
  movesEqual(left, right) {
    if ('type' in left || 'type' in right) {
      return 'type' in left && 'type' in right && left.type === right.type && left.at === right.at;
    }
    return (
      left.from === right.from &&
      left.path.length === right.path.length &&
      left.path.every((square, index) => square === right.path[index])
    );
  },
  candidateMoves(state) {
    const moves = this.legalMoves(state);
    if (state.phase !== 'placement') return moves;
    const occupied = state.board.flatMap((owner, square) => (owner === null ? [] : [square]));
    if (occupied.length === 0) return moves;
    const adjacent = new Set(occupied.flatMap(adjacentSquares));
    const pruned = moves.filter(
      (move): move is SeegaPathMove => !('type' in move) && adjacent.has(move.from),
    );
    return pruned.length > 0 ? pruned : moves;
  },
  orderMoves(state, moves) {
    const actor = this.currentPlayer(state);
    return [...moves].sort(
      (first, second) =>
        countMoveCaptures(state, second, actor) - countMoveCaptures(state, first, actor),
    );
  },
};
