import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { NationId } from '@/games/nations';

export type GameStatus = 'available' | 'coming-soon';
export type GameType = 'versus' | 'puzzle';
export type GameRegion = 'western' | 'chinese' | 'egyptian' | 'japanese' | 'dutch' | 'other';

export const CHINESE_GAME_IDS = [
  'xiangqi',
  'go',
  'chinesecheckers',
  'luzhanqi',
  'mahjong',
] as const;

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
  region: GameRegion;
  nations?: NationId[];
  capabilities: GameCapabilities;
  reconstructionNote?: string;
}

type GameDefinition = Omit<GameInfo, 'region'> & { region?: GameRegion };

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

const gameDefinitions: GameDefinition[] = [
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
    id: 'xiangqi',
    name: 'Xiangqi',
    description: 'Command an army across the river in Chinese chess.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '象',
    status: 'available',
    type: 'versus',
    nations: ['china'],
    region: 'chinese',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'seega',
    name: 'Seega',
    description: 'Place and move stones to surround and capture your opponent.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '⚫',
    status: 'coming-soon',
    type: 'versus',
    region: 'egyptian',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'egyptianmancala',
    name: 'Egyptian Mancala',
    description: 'Sow pebbles around the pits and capture from the opposite row.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '🫘',
    status: 'coming-soon',
    type: 'versus',
    region: 'egyptian',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'senet',
    name: 'Senet',
    description: 'Race your pieces along the path and bear them off the board.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '𓊖',
    status: 'coming-soon',
    type: 'versus',
    region: 'egyptian',
    reconstructionNote:
      'Senet’s original rules were not preserved. This game uses a modern, configurable reconstruction based on the Kendall-style ruleset specified for this build.',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'twentysquares',
    name: 'The Game of 20 Squares',
    description: 'Race pieces along the shared track and return them home.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '▦',
    status: 'coming-soon',
    type: 'versus',
    region: 'egyptian',
    reconstructionNote:
      'The original rules are incomplete. This game uses a modern, configurable Finkel-style reconstruction specified for this build.',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'houndsjackals',
    name: 'Hounds and Jackals',
    description: 'Race five pegs through the 58-hole board and its shortcuts.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '🐕',
    status: 'coming-soon',
    type: 'versus',
    region: 'egyptian',
    reconstructionNote:
      'The original rules are not known. Gameplay will be a clearly labelled, configurable modern reconstruction; its board layout and shortcuts require a documented source or an explicitly simplified version.',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'mehen',
    name: 'Mehen',
    description: 'Travel the coiled-snake track with marbles and a lion.',
    minPlayers: 2,
    maxPlayers: 4,
    icon: '🐍',
    status: 'coming-soon',
    type: 'versus',
    region: 'egyptian',
    reconstructionNote:
      'Mehen’s original rules are not preserved. This game will use a modern, configurable reconstruction, not a claim about the historical rules.',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'go',
    name: 'Go (Weiqi)',
    description: 'Place stones, capture groups, and surround territory.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '⚫',
    status: 'coming-soon',
    type: 'versus',
    nations: ['china'],
    region: 'chinese',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'chinesecheckers',
    name: 'Chinese Checkers (Tiaoqi)',
    description: 'Hop your marbles across the six-pointed star.',
    minPlayers: 2,
    maxPlayers: 6,
    icon: '🔵',
    status: 'coming-soon',
    type: 'versus',
    nations: ['china'],
    region: 'chinese',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'luzhanqi',
    name: 'Lu Zhan Qi (Army Chess)',
    description: 'Outmaneuver a hidden army with the help of a referee.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '🚩',
    status: 'coming-soon',
    type: 'versus',
    nations: ['china'],
    region: 'chinese',
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'mahjong',
    name: 'Mahjong',
    description: 'Build a winning hand from sets, pairs, and discards.',
    minPlayers: 4,
    maxPlayers: 4,
    icon: '🀄',
    status: 'coming-soon',
    type: 'versus',
    nations: ['china'],
    region: 'chinese',
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
    id: 'stratego',
    name: 'Stratego',
    description: 'Hide your army, probe the enemy, and capture the opposing flag.',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '🛡️',
    status: 'available',
    type: 'versus',
    nations: ['holland'],
    capabilities: TURN_BASED_CAPABILITIES,
  },
  {
    id: 'sjoelen',
    name: 'Sjoelen',
    description:
      'Throw discs at the Dutch shuffleboard and chase a high total across three rounds.',
    minPlayers: 1,
    maxPlayers: 1,
    icon: '🥍',
    status: 'available',
    type: 'puzzle',
    nations: ['holland'],
    capabilities: PUZZLE_CAPABILITIES,
  },
  {
    id: 'ganzenbord',
    name: 'Ganzenbord',
    description: 'Race around the Game of the Goose board and navigate its special spaces.',
    minPlayers: 2,
    maxPlayers: 4,
    icon: '🪿',
    status: 'available',
    type: 'versus',
    nations: ['holland'],
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
    status: 'available',
    type: 'puzzle',
    capabilities: PUZZLE_CAPABILITIES,
  },
];

export const games: GameInfo[] = gameDefinitions.map((game) => ({
  ...game,
  region: game.region ?? 'other',
}));

export function getGamesForNation(nationId: NationId, gameList: GameInfo[] = games): GameInfo[] {
  if (nationId === 'all') return gameList;
  return gameList.filter((game) => game.nations?.includes(nationId));
}

export function getGamesForRegion(region: GameRegion, gameList: GameInfo[] = games): GameInfo[] {
  return gameList.filter((game) => game.region === region);
}

export const gameComponents: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {
  'noughts-and-crosses': lazy(() => import('@/games/tictactoe/TicTacToeGame')),
  'connect-4': lazy(() => import('@/games/connect4/Connect4Game')),
  gomoku: lazy(() => import('@/games/gomoku/GomokuMatch')),
  reversi: lazy(() => import('@/games/reversi/ReversiGame')),
  latrunculi: lazy(() => import('@/games/latrunculi/LatrunculiGame')),
  stratego: lazy(() => import('@/games/stratego/StrategoGame')),
  sjoelen: lazy(() => import('@/games/sjoelen/SjoelenGame')),
  ganzenbord: lazy(() => import('@/games/ganzenbord/GanzenbordGame')),
  checkers: lazy(() => import('@/games/checkers/CheckersGame')),
  xiangqi: lazy(() => import('@/games/xiangqi/XiangqiGame')),
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
