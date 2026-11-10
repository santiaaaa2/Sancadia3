import { useCallback, useState } from 'react';

interface LudoState {
  count: number;
  tokens: number[][];
  turn: number;
  dice: number | null;
  rolling: boolean;
  winner: number | null;
  message: string;
}

function createGame(count: number): LudoState {
  return {
    count,
    tokens: Array.from({ length: count }, () => Array(4).fill(-1)),
    turn: 0,
    dice: null,
    rolling: false,
    winner: null,
    message: 'Roll the die to begin.',
  };
}

export function useLudo() {
  const [game, setGame] = useState(() => createGame(2));
  const start = useCallback((count: number) => setGame(createGame(count)), []);
  const roll = useCallback(() => {
    if (game.rolling || game.dice !== null || game.winner !== null) return;
    setGame((state) => ({
      ...state,
      rolling: true,
      message: `Player ${state.turn + 1} is rolling…`,
    }));
    window.setTimeout(() => {
      setGame((state) => {
        const dice = Math.floor(Math.random() * 6) + 1;
        const canMove = state.tokens[state.turn]!.some((position) =>
          position === -1 ? dice === 6 : position + dice <= 57,
        );
        if (!canMove) {
          const next = dice === 6 ? state.turn : (state.turn + 1) % state.count;
          return {
            ...state,
            rolling: false,
            dice: null,
            turn: next,
            message: `No token can move. Player ${next + 1}’s turn.`,
          };
        }
        return {
          ...state,
          rolling: false,
          dice,
          message: `Player ${state.turn + 1} rolled ${dice}. Choose a token.`,
        };
      });
    }, 450);
  }, [game.rolling, game.dice, game.winner]);
  const moveToken = useCallback((tokenIndex: number) => {
    setGame((state) => {
      if (state.dice === null || state.winner !== null) return state;
      const current = state.tokens[state.turn]![tokenIndex];
      if (
        current === undefined ||
        (current === -1 && state.dice !== 6) ||
        (current >= 0 && current + state.dice > 57)
      )
        return state;
      const progress = current === -1 ? 0 : current + state.dice;
      const tokens = state.tokens.map((row) => [...row]);
      tokens[state.turn]![tokenIndex] = progress;
      if (progress < 52) {
        const landed = (state.turn * 13 + progress) % 52;
        const safe = [0, 8, 13, 21, 26, 34, 39, 47].includes(landed);
        if (!safe) {
          tokens.forEach((row, player) => {
            if (player === state.turn) return;
            row.forEach((position, index) => {
              if (position >= 0 && position < 52 && (player * 13 + position) % 52 === landed)
                row[index] = -1;
            });
          });
        }
      }
      const winner = tokens[state.turn]!.every((position) => position === 57) ? state.turn : null;
      const extraTurn = state.dice === 6 && winner === null;
      const turn = winner !== null || extraTurn ? state.turn : (state.turn + 1) % state.count;
      return {
        ...state,
        tokens,
        winner,
        turn,
        dice: null,
        message:
          winner !== null
            ? `Player ${winner + 1} reached home!`
            : extraTurn
              ? `Player ${state.turn + 1} rolled a six — roll again.`
              : `Player ${turn + 1}’s turn.`,
      };
    });
  }, []);
  return { ...game, start, roll, moveToken };
}
