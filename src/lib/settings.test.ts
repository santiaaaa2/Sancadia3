import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_GAME_SETTINGS,
  DEFAULT_SETTINGS,
  SETTINGS_VERSION,
  loadSettings,
  parseSettings,
  saveSettings,
} from '@/lib/settings';

describe('settings persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('migrates existing unversioned settings and defaults the nation to all', () => {
    expect(
      parseSettings({
        themeId: 'midnight',
        soundEnabled: false,
        vibrationEnabled: true,
        volume: 0.8,
        difficulty: 'expert',
      }),
    ).toEqual({
      ...DEFAULT_SETTINGS,
      themeId: 'midnight',
      soundEnabled: false,
      volume: 0.8,
      difficulty: 'expert',
    });
  });

  it('defaults the nation for older versions and unknown or corrupted nation values', () => {
    expect(parseSettings({ version: 1, nation: 'france' }).nation).toBe('all');
    expect(parseSettings({ version: 2, nation: 'france' }).nation).toBe('france');
    expect(parseSettings({ version: SETTINGS_VERSION, nation: 'unknown' }).nation).toBe('all');
    expect(parseSettings({ version: SETTINGS_VERSION, nation: null }).nation).toBe('all');
    expect(parseSettings({ version: 99, nation: 'france' })).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(['corrupt'])).toEqual(DEFAULT_SETTINGS);
  });

  it('migrates version 2 settings without losing existing values', () => {
    window.localStorage.setItem(
      'classic-games-arcade:settings',
      JSON.stringify({
        version: 2,
        themeId: 'sunset',
        soundEnabled: false,
        vibrationEnabled: false,
        volume: 0.3,
        difficulty: 'professional',
        nation: 'india',
      }),
    );

    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      themeId: 'sunset',
      soundEnabled: false,
      vibrationEnabled: false,
      volume: 0.3,
      difficulty: 'professional',
      nation: 'india',
    });
    expect(
      JSON.parse(window.localStorage.getItem('classic-games-arcade:settings') ?? '{}').version,
    ).toBe(SETTINGS_VERSION);
  });

  it('migrates version 4 settings and initializes per-game settings without losing global values', () => {
    window.localStorage.setItem(
      'classic-games-arcade:settings',
      JSON.stringify({
        version: 4,
        themeId: 'sunset',
        difficulty: 'expert',
        nation: 'india',
      }),
    );

    expect(loadSettings()).toMatchObject({
      themeId: 'sunset',
      difficulty: 'expert',
      nation: 'india',
      gameSettings: {},
    });
    expect(
      JSON.parse(window.localStorage.getItem('classic-games-arcade:settings') ?? '{}').version,
    ).toBe(SETTINGS_VERSION);
  });

  it('migrates version 5 preferences and keeps per-game settings', () => {
    const stored = {
      version: 5,
      nation: 'china',
      useWesternSymbols: true,
      gameSettings: { gomoku: DEFAULT_GAME_SETTINGS },
    };

    expect(parseSettings(stored)).toMatchObject({
      nation: 'china',
      useWesternSymbols: true,
      gameSettings: { gomoku: DEFAULT_GAME_SETTINGS },
    });
  });

  it('migrates version 6 settings and safely validates per-game zoom levels', () => {
    expect(
      parseSettings({
        version: 6,
        nation: 'china',
        boardZoomLevels: { senet: 2 },
      }).boardZoomLevels,
    ).toEqual({});

    expect(
      parseSettings({
        version: SETTINGS_VERSION,
        boardZoomLevels: {
          seega: 1.5,
          senet: 9,
          malformed: 'zoom',
        },
      }).boardZoomLevels,
    ).toEqual({ seega: 1.5, senet: 1, malformed: 1 });
  });

  it('persists and validates game-specific settings independently of global settings', () => {
    const gameSettings: typeof DEFAULT_SETTINGS.gameSettings = {
      checkers: {
        ...DEFAULT_GAME_SETTINGS,
        speedAndMode: {
          ...DEFAULT_GAME_SETTINGS.speedAndMode,
          useGlobalDefaults: false,
          gameplayStyle: 'asynchronous',
          timeControl: '7-days',
          incrementSeconds: 30,
          opponentSkillRange: 500,
          difficulty: 'expert',
          defaultMode: 'two-player',
        },
      },
    };
    saveSettings({ ...DEFAULT_SETTINGS, gameSettings });

    expect(loadSettings().gameSettings.checkers?.speedAndMode).toMatchObject({
      useGlobalDefaults: false,
      gameplayStyle: 'asynchronous',
      timeControl: '7-days',
      incrementSeconds: 30,
      opponentSkillRange: 500,
      difficulty: 'expert',
      defaultMode: 'two-player',
    });
    expect(loadSettings().difficulty).toBe(DEFAULT_SETTINGS.difficulty);

    expect(
      parseSettings({
        version: SETTINGS_VERSION,
        gameSettings: {
          checkers: {
            speedAndMode: {
              useGlobalDefaults: false,
              incrementSeconds: 999,
              opponentSkillRange: 1,
              difficulty: 'impossible',
            },
          },
        },
      }).gameSettings.checkers?.speedAndMode,
    ).toMatchObject({
      incrementSeconds: 120,
      opponentSkillRange: 50,
      difficulty: DEFAULT_SETTINGS.difficulty,
    });
  });

  it('persists new preview preferences without applying them to the arcade', () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      reducedMotion: true,
      highContrast: true,
      language: 'fr',
      darkMode: true,
      backgroundMusicEnabled: true,
      friendRequestPrivacy: 'friends-of-friends',
      graphicsQuality: 'battery-saver',
      displayName: 'Player',
      blockedPlayers: ['player-id'],
    });

    expect(loadSettings()).toMatchObject({
      reducedMotion: true,
      highContrast: true,
      language: 'fr',
      darkMode: true,
      backgroundMusicEnabled: true,
      friendRequestPrivacy: 'friends-of-friends',
      graphicsQuality: 'battery-saver',
      displayName: 'Player',
      blockedPlayers: ['player-id'],
    });
  });

  it('defaults malformed expanded values without discarding valid settings', () => {
    expect(
      parseSettings({
        version: SETTINGS_VERSION,
        nation: 'india',
        language: 'Klingon',
        animationSpeed: 'warp',
        screenOrientation: 90,
        friendRequestPrivacy: 'anyone',
        graphicsQuality: 'ultra',
        soundEffectsVolume: 'loud',
        backgroundMusicVolume: Number.NaN,
        blockedPlayers: ['valid', 42],
      }),
    ).toMatchObject({
      ...DEFAULT_SETTINGS,
      nation: 'india',
    });
  });

  it('loads corrupt JSON safely and saves the bumped version', () => {
    window.localStorage.setItem('classic-games-arcade:settings', '{broken');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);

    saveSettings({ ...DEFAULT_SETTINGS, nation: 'france' });
    expect(
      JSON.parse(window.localStorage.getItem('classic-games-arcade:settings') ?? '{}'),
    ).toMatchObject({
      version: SETTINGS_VERSION,
      nation: 'france',
    });
    expect(loadSettings().nation).toBe('france');
  });
});
