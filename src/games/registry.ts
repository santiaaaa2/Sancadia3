import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { NationId } from '@/games/nations';

export type GameStatus = 'available' | 'coming-soon';
export type GameType = 'versus' | 'puzzle';

export interface GameCapabilities {
  hasVariants: boolean;
  hasDrawRules: boolean;
  hasHandicap: boolean;
  isRealTimeCapable: boolean;
}

export interface GameInfo {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  icon: string;
  status: GameStatus;
  type?: GameType;
  nations?: NationId[];
  capabilities: GameCapabilities;
}

const TURN_BASED_CAPABILITIES: GameCapabilities = {
  hasVariants: false,
  hasDrawRules: true,
  hasHandicap: false,
  isRealTimeCapable: true,
};

const PUZZLE_CAPABILITIES: GameCapabilities = {
  hasVariants: false,
  hasDrawRules: false,
  hasHandicap: false,
  isRealTimeCapable: false,
};

export const games: GameInfo[] = [
  {
    id: 'noughts-and-crosses',
    name: 'Noughts and Crosses',
    description: 'Get three in a row before your opponent.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '❌',
    status: 'available',
    nations: ['france', 'england', 'italy'],
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'connect-4',
    name: 'Connect 4',
    description: 'Drop discs and line up four to win.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '🔴',
    status: 'available',
    nations: ['spain', 'portugal', 'china'],
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'gomoku',
    name: 'Gomoku',
    description: 'Five in a row on an open board.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '⚫',
    status: 'available',
    nations: ['india', 'france', 'china'],
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'reversi',
    name: 'Reversi',
    description: 'Flip your opponent’s discs to take the board.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '⚪',
    status: 'available',
    nations: ['italy', 'spain', 'india'],
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'latrunculi',
    name: 'LATRUNCULI',
    description: 'Command Roman stone armies in this ancient game of movement and capture.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '🏛️',
    status: 'available',
    type: 'versus',
    nations: ['italy'],
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'checkers',
    name: 'Checkers',
    description: 'Jump, capture, and crown your kings.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '🏁',
    status: 'available',
    nations: ['england', 'france', 'portugal'],
    capabilities: { ...TURN_BASED_CAPABILITIES, hasVariants: true, hasHandicap: true },
  },
  {
    id: 'battleships',
    name: 'Battleships',
    description: 'Hunt down the enemy fleet.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '🚢',
    status: 'available',
    type: 'versus',
    nations: ['china', 'india', 'england'],
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'mastermind',
    name: 'Mastermind',
    description: 'Decode the hidden code before your attempts run out.',
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🎯',
    status: 'available',
    type: 'puzzle',
    nations: ['italy', 'portugal', 'china'],
    capabilities: PUZZLE_CAPABILITIES,
  },
  {
    id: 'bullscows',
    name: 'Bulls and Cows',
    description: 'Use bulls and cows to crack the right number pattern.',
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🐮',
    status: 'available',
    type: 'puzzle',
    nations: ['spain', 'india', 'france'],
    capabilities: PUZZLE_CAPABILITIES,
  },
  {
    id: 'hangman',
    name: 'Hangman',
    description: 'Uncover the hidden word before the gallows fills in.',
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🪢',
    status: 'available',
    type: 'puzzle',
    nations: ['portugal', 'england', 'spain'],
    capabilities: PUZZLE_CAPABILITIES,
  },
  {
    id: 'dots-and-boxes',
    name: 'Dots and Boxes',
    description: 'Draw lines and claim the most boxes.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '🔲',
    status: 'available',
    type: 'versus',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'mancala',
    name: 'Mancala',
    description: 'Sow seeds around the pits and collect the most.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '🫘',
    status: 'available',
    type: 'versus',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'dominoes',
    name: 'Dominoes',
    description: 'Match tile ends and empty your hand.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '🁣',
    status: 'available',
    type: 'versus',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'ludo',
    name: 'Ludo',
    description: 'Race all four tokens around the board and home.',
    minPlayers: 2,
    maxPlayers: 4,
    icon: '🎲',
    status: 'available',
    type: 'versus',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Guide the snake to food without hitting a wall or itself.',
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🐍',
    status: 'available',
    type: 'puzzle',
    capabilities: PUZZLE_CAPABILITIES,
  },
  {
    id: '2048',
    name: '2048',
    description: 'Slide and merge tiles to reach 2048.',
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🔢',
    status: 'available',
    type: 'puzzle',
    capabilities: PUZZLE_CAPABILITIES,
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    description: 'Use number clues to reveal every safe square.',
    minPlayers: 1,
    maxPlayers: 1,
    icon: '💣',
    status: 'coming-soon',
    type: 'puzzle',
    capabilities: PUZZLE_CAPABILITIES,
  },
];

export function getGamesForNation(nationId: NationId, gameList: GameInfo[] = games) {
  if (nationId === 'all') return gameList;
  return gameList.filter((game) => game.nations?.includes(nationId));
}

export const gameComponents: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {
  'noughts-and-crosses': lazy(() => import('@/games/tictactoe/TicTacToeGame')),
  'connect-4': lazy(() => import('@/games/connect4/Connect4Game')),
  gomoku: lazy(() => import('@/games/gomoku/GomokuMatch')),
  reversi: lazy(() => import('@/games/reversi/ReversiGame')),
  latrunculi: lazy(() => import('@/games/latrunculi/LatrunculiGame')),
  checkers: lazy(() => import('@/games/checkers/CheckersGame')),
  battleships: lazy(() => import('@/games/battleships/BattleshipsGame')),
  mastermind: lazy(() => import('@/games/mastermind/MastermindGame')),
  bullscows: lazy(() => import('@/games/bullscows/BullsCowsGame')),
  hangman: lazy(() => import('@/games/hangman/HangmanGame')),
  dominoes: lazy(() => import('@/games/dominoes/DominoesGame')),
  'dots-and-boxes': lazy(() => import('@/games/dots-and-boxes/DotsAndBoxesGame')),
  mancala: lazy(() => import('@/games/mancala/MancalaGame')),
  ludo: lazy(() => import('@/games/ludo/LudoGame')),
  snake: lazy(() => import('@/games/snake/SnakeGame')),
  '2048': lazy(() => import('@/games/2048/Game2048')),
  minesweeper: lazy(() => import('@/games/minesweeper/MinesweeperGame')),
};
