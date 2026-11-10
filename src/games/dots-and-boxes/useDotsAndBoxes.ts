import { useCallback, useState } from 'react';

const SIZE = 4;
export type Edge = `h-${number}-${number}` | `v-${number}-${number}`;
interface DotsState {
  edges: Set<Edge>;
  boxes: Array<Array<0 | 1 | null>>;
  player: 0 | 1;
  scores: [number, number];
  over: boolean;
}

function createGame(): DotsState {
  return {
    edges: new Set(),
    boxes: Array.from({ length: SIZE }, () => Array<0 | 1 | null>(SIZE).fill(null)),
    player: 0,
    scores: [0, 0],
    over: false,
  };
}

export function useDotsAndBoxes() {
  const [game, setGame] = useState(createGame);
  const drawEdge = useCallback((edge: Edge) => {
    setGame((state) => {
      if (state.over || state.edges.has(edge)) return state;
      const edges = new Set(state.edges).add(edge);
      const boxes = state.boxes.map((row) => [...row]);
      let claimed = 0;
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++) {
          if (boxes[r]![c] !== null) continue;
          const around: Edge[] = [
            `h-${r}-${c}`,
            `h-${r + 1}-${c}`,
            `v-${r}-${c}`,
            `v-${r}-${c + 1}`,
          ];
          if (around.every((item) => edges.has(item))) {
            boxes[r]![c] = state.player;
            claimed++;
          }
        }
      const scores: [number, number] = [...state.scores];
      scores[state.player] += claimed;
      const over = edges.size === 40;
      return {
        edges,
        boxes,
        scores,
        over,
        player: claimed ? state.player : state.player === 0 ? 1 : 0,
      };
    });
  }, []);
  return { ...game, size: SIZE, drawEdge, restart: () => setGame(createGame()) };
}
