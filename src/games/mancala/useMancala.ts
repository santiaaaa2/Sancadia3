import { useCallback, useState } from 'react';

interface MancalaState {
  pits: [number[], number[]];
  stores: [number, number];
  player: 0 | 1;
  over: boolean;
  lastSown: { side: 0 | 1; pit: number } | null;
  message: string;
}

function createGame(): MancalaState {
  return {
    pits: [Array(6).fill(4), Array(6).fill(4)],
    stores: [0, 0],
    player: 0,
    over: false,
    lastSown: null,
    message: 'Player 1’s turn.',
  };
}

export function useMancala() {
  const [game, setGame] = useState(createGame);
  const sow = useCallback((pit: number) => {
    setGame((state) => {
      if (state.over || pit < 0 || pit > 5 || state.pits[state.player][pit] === 0) return state;
      const pits: [number[], number[]] = [[...state.pits[0]], [...state.pits[1]]];
      const stores: [number, number] = [...state.stores];
      let stones = pits[state.player][pit]!;
      pits[state.player][pit] = 0;
      let position = state.player === 0 ? pit : 12 - pit;
      let lastSown: MancalaState['lastSown'] = null;
      while (stones > 0) {
        position = (position + (state.player === 0 ? 1 : 13)) % 14;
        if ((state.player === 0 && position === 13) || (state.player === 1 && position === 6))
          continue;
        stones--;
        if (position === 6 || position === 13) {
          const owner = position === 6 ? 0 : 1;
          stores[owner] = stores[owner]! + 1;
          lastSown = null;
        } else {
          const side: 0 | 1 = position <= 5 ? 0 : 1;
          const index = side === 0 ? position : 12 - position;
          pits[side][index] = pits[side][index]! + 1;
          lastSown = { side, pit: index };
        }
      }

      if (lastSown?.side === state.player && pits[state.player][lastSown.pit] === 1) {
        const ownCount = pits[state.player][lastSown.pit]!;
        const oppositePit = 5 - lastSown.pit;
        const opponentCount = pits[state.player === 0 ? 1 : 0][oppositePit]!;
        if (opponentCount > 0) {
          pits[state.player][lastSown.pit] = 0;
          pits[state.player === 0 ? 1 : 0][oppositePit] = 0;
          stores[state.player] = stores[state.player]! + ownCount + opponentCount;
        }
      }

      const sideEmpty: [boolean, boolean] = [
        pits[0].every((count) => count === 0),
        pits[1].every((count) => count === 0),
      ];
      const over: boolean = sideEmpty[0] || sideEmpty[1];
      if (over) {
        for (const side of [0, 1] as const) {
          stores[side] += pits[side].reduce((sum, count) => sum + count, 0);
          pits[side] = Array(6).fill(0);
        }
      }
      const landedInStore = state.player === 0 ? position === 6 : position === 13;
      const player = over || landedInStore ? state.player : state.player === 0 ? 1 : 0;
      return {
        pits,
        stores,
        over,
        lastSown,
        player,
        message: over
          ? 'The game is over.'
          : landedInStore
            ? `Player ${state.player + 1} gets another turn.`
            : `Player ${player + 1}’s turn.`,
      };
    });
  }, []);
  return { ...game, sow, restart: () => setGame(createGame()) };
}
