import { describe, expect, it } from 'vitest';
import { isNationId } from '@/games/nations';
import { games, getGamesForNation, type GameInfo } from '@/games/registry';
import { rulesContent } from '@/games/rulesContent';

describe('game nation registry', () => {
  it('has a rules entry for every game and no rules for unregistered game ids', () => {
    expect(Object.keys(rulesContent).sort()).toEqual(games.map((game) => game.id).sort());
  });

  it('uses only nation IDs that exist in the nation list', () => {
    for (const game of games) {
      for (const nationId of game.nations ?? []) {
        expect(isNationId(nationId), `${game.id} uses unknown nation "${nationId}"`).toBe(true);
      }
    }
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
