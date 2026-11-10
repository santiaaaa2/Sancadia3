import { useCallback, useEffect, useState } from 'react';

export type Domino = readonly [number, number];
export type DominoSide = 'left' | 'right';

interface DominoesState {
  hands: [Domino[], Domino[]];
  line: Domino[];
  boneyard: Domino[];
  player: 0 | 1;
  message: string;
  winner: 0 | 1 | 'draw' | null;
}

function createGame(): DominoesState {
  const tiles: Domino[] = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) tiles.push([a, b]);
  }
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j]!, tiles[i]!];
  }
  return {
    hands: [tiles.slice(0, 7), tiles.slice(7, 14)],
    line: [],
    boneyard: tiles.slice(14),
    player: 0,
    message: 'Your turn: play a matching tile or draw.',
    winner: null,
  };
}

function canPlay(tile: Domino, line: Domino[], side: DominoSide): boolean {
  if (!line.length) return true;
  return side === 'left' ? tile.includes(line[0]![0]) : tile.includes(line[line.length - 1]![1]);
}

function placeTile(state: DominoesState, index: number, side: DominoSide): DominoesState {
  if (state.winner !== null || state.player !== 0) return state;
  const tile = state.hands[0][index];
  if (!tile || !canPlay(tile, state.line, side)) return state;
  const line = [...state.line];
  let oriented = tile;
  if (line.length) {
    if (side === 'left') {
      const end = line[0]![0];
      oriented = tile[0] === end ? tile : [tile[1], tile[0]];
      line.unshift(oriented);
    } else {
      const end = line[line.length - 1]![1];
      oriented = tile[0] === end ? tile : [tile[1], tile[0]];
      line.push(oriented);
    }
  } else {
    line.push(tile);
  }
  const hands: [Domino[], Domino[]] = [[...state.hands[0]], [...state.hands[1]]];
  hands[0].splice(index, 1);
  return finishTurn({ ...state, line, hands }, 0, 'You played a tile.');
}

function finishTurn(state: DominoesState, player: 0 | 1, message: string): DominoesState {
  const emptyHand = state.hands.findIndex((hand) => hand.length === 0);
  if (emptyHand !== -1) {
    return {
      ...state,
      winner: emptyHand as 0 | 1,
      message: emptyHand === 0 ? 'You win!' : 'The computer wins.',
    };
  }
  if (
    state.boneyard.length === 0 &&
    state.hands.every(
      (hand) =>
        !hand.some(
          (tile) => canPlay(tile, state.line, 'left') || canPlay(tile, state.line, 'right'),
        ),
    )
  ) {
    const totals = state.hands.map((hand) =>
      hand.reduce((sum, tile) => sum + tile[0] + tile[1], 0),
    );
    return {
      ...state,
      winner: totals[0] === totals[1] ? 'draw' : totals[0]! < totals[1]! ? 0 : 1,
      message: 'No more moves. The lower pip count wins.',
    };
  }
  const next = (player === 0 ? 1 : 0) as 0 | 1;
  return { ...state, player: next, message: next === 0 ? message : 'Computer is thinking…' };
}

export function useDominoes() {
  const [game, setGame] = useState(createGame);

  const play = useCallback((index: number, side: DominoSide) => {
    setGame((state) => placeTile(state, index, side));
  }, []);

  const draw = useCallback(() => {
    setGame((state) => {
      if (state.winner !== null || state.player !== 0 || !state.boneyard.length) return state;
      const tile = state.boneyard[0]!;
      return {
        ...state,
        hands: [[...state.hands[0], tile], state.hands[1]],
        boneyard: state.boneyard.slice(1),
        message: 'You drew a tile. Play it if it fits.',
      };
    });
  }, []);

  useEffect(() => {
    if (game.player !== 1 || game.winner !== null) return;
    const timeout = window.setTimeout(() => {
      setGame((state) => {
        if (state.player !== 1 || state.winner !== null) return state;
        const options = state.hands[1]
          .map((tile, index) => ({ tile, index }))
          .filter(
            ({ tile }) => canPlay(tile, state.line, 'left') || canPlay(tile, state.line, 'right'),
          )
          .sort((a, b) => b.tile[0] + b.tile[1] - a.tile[0] - a.tile[1]);
        if (options.length) {
          const { tile, index } = options[0]!;
          const side: DominoSide =
            state.line.length && tile.includes(state.line[0]![0]) ? 'left' : 'right';
          const line = [...state.line];
          if (!line.length) line.push(tile);
          else if (side === 'left') {
            const end = line[0]![0];
            line.unshift(tile[0] === end ? tile : [tile[1], tile[0]]);
          } else {
            const end = line[line.length - 1]![1];
            line.push(tile[0] === end ? tile : [tile[1], tile[0]]);
          }
          const hands: [Domino[], Domino[]] = [state.hands[0], [...state.hands[1]]];
          hands[1].splice(index, 1);
          return finishTurn({ ...state, line, hands }, 1, 'Your turn.');
        }
        if (state.boneyard.length) {
          return {
            ...state,
            hands: [state.hands[0], [...state.hands[1], state.boneyard[0]!]],
            boneyard: state.boneyard.slice(1),
            message: 'Computer drew a tile.',
          };
        }
        return finishTurn(state, 1, 'Computer passed. Your turn.');
      });
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [game.player, game.winner, game.line, game.hands, game.boneyard]);

  return { ...game, play, draw, restart: () => setGame(createGame()) };
}
