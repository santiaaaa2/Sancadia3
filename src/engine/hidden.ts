export type HiddenPlayer = 0 | 1 | 2 | 3 | 4 | 5;
export type HiddenWinner = HiddenPlayer | 'draw' | null;

export interface HiddenGameEngine<State, Move, Observation> {
  id: string;
  initialState(): State;
  playerCount(state: State): number;
  currentPlayer(state: State): HiddenPlayer;
  legalMoves(state: State): Move[];
  applyMove(state: State, move: Move): State;
  isTerminal(state: State): boolean;
  winner(state: State): HiddenWinner;
  observe(state: State, player: HiddenPlayer): Observation;
  movesEqual?(a: Move, b: Move): boolean;
}

export function isHiddenPlayerCount(value: number): value is 2 | 3 | 4 | 5 | 6 {
  return Number.isInteger(value) && value >= 2 && value <= 6;
}
