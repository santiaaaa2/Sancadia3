export const BOARD_SIZE = 63;
export const GOOSE_SPACES = new Set([9, 18, 27, 36, 45, 54]);

export type PlayerCount = 2 | 3 | 4;

export interface GanzenbordState {
  playerCount: PlayerCount;
  positions: number[];
  waitTurns: number[];
  turn: number;
  lastRoll: number | null;
  winner: number | null;
  message: string;
}

interface LandingResult {
  position: number;
  waitTurns: number;
  message: string;
}

export function isPlayerCount(value: number): value is PlayerCount {
  return value === 2 || value === 3 || value === 4;
}

export function createInitialState(playerCount: PlayerCount = 2): GanzenbordState {
  return {
    playerCount,
    positions: Array.from({ length: playerCount }, () => 0),
    waitTurns: Array.from({ length: playerCount }, () => 0),
    turn: 0,
    lastRoll: null,
    winner: null,
    message: 'Player 1 starts at Start.',
  };
}

function getLandingResult(start: number, roll: number): LandingResult {
  let position = start + roll;
  if (position > BOARD_SIZE) position = BOARD_SIZE - (position - BOARD_SIZE);

  while (GOOSE_SPACES.has(position) && position < BOARD_SIZE) {
    position += roll;
    if (position > BOARD_SIZE) position = BOARD_SIZE - (position - BOARD_SIZE);
  }

  if (position === 6) return { position: 12, waitTurns: 0, message: 'crosses the bridge to 12' };
  if (position === 19)
    return { position, waitTurns: 1, message: 'rests at the inn and misses one turn' };
  if (position === 31)
    return { position, waitTurns: 2, message: 'is held at the well for two turns' };
  if (position === 42)
    return { position: 39, waitTurns: 0, message: 'gets lost in the maze and returns to 39' };
  if (position === 52)
    return { position, waitTurns: 2, message: 'is held in prison for two turns' };
  if (position === 58)
    return { position: 0, waitTurns: 0, message: 'lands on Death and returns to Start' };
  if (position === BOARD_SIZE) return { position, waitTurns: 0, message: 'reaches the finish' };
  return { position, waitTurns: 0, message: `lands on space ${position}` };
}

export function takeTurn(state: GanzenbordState, roll: number): GanzenbordState {
  if (state.winner !== null) return state;

  const playerWait = state.waitTurns[state.turn] ?? 0;
  if (playerWait > 0) {
    const waitTurns = [...state.waitTurns];
    waitTurns[state.turn] = playerWait - 1;
    return {
      ...state,
      waitTurns,
      lastRoll: null,
      turn: (state.turn + 1) % state.playerCount,
      message: `Player ${state.turn + 1} misses a turn (${playerWait - 1} waiting turn${playerWait - 1 === 1 ? '' : 's'} remain).`,
    };
  }

  if (!Number.isInteger(roll) || roll < 1 || roll > 6) {
    throw new RangeError('A die roll must be an integer from 1 to 6.');
  }

  const result = getLandingResult(state.positions[state.turn] ?? 0, roll);
  const positions = [...state.positions];
  positions[state.turn] = result.position;
  const waitTurns = [...state.waitTurns];
  waitTurns[state.turn] = result.waitTurns;
  const message = `Player ${state.turn + 1} rolls ${roll} and ${result.message}.`;

  return {
    ...state,
    positions,
    waitTurns,
    lastRoll: roll,
    winner: result.position === BOARD_SIZE ? state.turn : null,
    turn: result.position === BOARD_SIZE ? state.turn : (state.turn + 1) % state.playerCount,
    message: result.position === BOARD_SIZE ? `${message.slice(0, -1)}!` : message,
  };
}
