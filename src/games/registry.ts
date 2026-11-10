import type { ComponentType } from 'react';
import BullsCowsGame from '@/games/bullscows/BullsCowsGame';
import CheckersGame from '@/games/checkers/CheckersGame';
import Connect4Game from '@/games/connect4/Connect4Game';
import GomokuMatch from '@/games/gomoku/GomokuMatch';
import HangmanGame from '@/games/hangman/HangmanGame';
import MastermindGame from '@/games/mastermind/MastermindGame';
import ReversiGame from '@/games/reversi/ReversiGame';
import BattleshipsGame from '@/games/battleships/BattleshipsGame';
import TicTacToeGame from '@/games/tictactoe/TicTacToeGame';
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
    status: 'coming-soon',
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
    status: 'coming-soon',
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
    status: 'coming-soon',
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
    status: 'coming-soon',
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
    status: 'coming-soon',
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
    status: 'coming-soon',
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

export const gameComponents: Partial<Record<string, ComponentType>> = {
  'noughts-and-crosses': TicTacToeGame,
  'connect-4': Connect4Game,
  gomoku: GomokuMatch,
  reversi: ReversiGame,
  checkers: CheckersGame,
  battleships: BattleshipsGame,
  mastermind: MastermindGame,
  bullscows: BullsCowsGame,
  hangman: HangmanGame,
};
