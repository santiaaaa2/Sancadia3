import { describe, expect, it } from 'vitest';
import { aiRegistry } from '@/games/aiRegistry';
import { isNationId } from '@/games/nations';
import { games, gameComponents, getGamesForNation, type GameInfo } from '@/games/registry';
import { rulesContent } from '@/games/rulesContent';

describe('game registry consistency', () => {
  it('has a rules entry for every game and no rules for unregistered game ids', () => {
    expect(Object.keys(rulesContent).sort()).toEqual(games.map((game) => game.id).sort());
  });

  it('has worker AI entries for every available engine-based versus game', () => {
    const workerAiGames = games.filter((game) =>
      ['noughts-and-crosses', 'connect-4', 'gomoku', 'reversi', 'checkers', 'latrunculi'].includes(
        game.id,
      ),
    );

    for (const game of workerAiGames) {
      expect(aiRegistry, `${game.id} is missing from aiRegistry`).toHaveProperty(game.id);
    }
  });

  it('makes all seven mini-games playable', () => {
    const expectedStatuses = {
      'dots-and-boxes': 'available',
      mancala: 'available',
      dominoes: 'available',
      ludo: 'available',
      snake: 'available',
      '2048': 'available',
      minesweeper: 'available',
    };

    for (const [id, status] of Object.entries(expectedStatuses)) {
      expect(games.find((game) => game.id === id)?.status, id).toBe(status);
      expect(gameComponents, `${id} must have a playable component`).toHaveProperty(id);
    }
  });

  it('uses only nation IDs that exist in the nation list', () => {
    for (const game of games) {
      for (const nationId of game.nations ?? []) {
        expect(isNationId(nationId), `${game.id} uses unknown nation "${nationId}"`).toBe(true);
      }
    }
  });

  it('lists LATRUNCULI under Italy', () => {
    expect(getGamesForNation('italy').map((game) => game.id)).toContain('latrunculi');
    expect(gameComponents).toHaveProperty('latrunculi');
  });

  it('filters all game statuses by nation and shows every game for all nations', () => {
    const comingSoonGame: GameInfo = {
      ...games[0]!,
      id: 'future-game',
      status: 'coming-soon',
      nations: ['france'],
    };
    const gameList = [...games, comingSoonGame];

    expect(getGamesForNation('all', gameList)).toHaveLength(gameList.length);
    expect(getGamesForNation('france', gameList).map((game) => game.id)).toContain('future-game');
    expect(getGamesForNation('china', gameList).map((game) => game.id)).not.toContain(
      'future-game',
    );
  });
});
