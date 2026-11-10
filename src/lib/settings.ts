import type { Difficulty } from '@/engine/difficulty';
import { isNationId, type NationId } from '@/games/nations';
import { themes, type ThemeId } from '@/theme/themes';

export const SETTINGS_VERSION = 7;

export type AnimationSpeed = 'off' | 'slow' | 'normal' | 'fast';
export type ScreenOrientation = 'auto' | 'portrait' | 'landscape';
export type FriendRequestPrivacy = 'everyone' | 'friends-of-friends' | 'no-one';
export type GraphicsQuality = 'high' | 'medium' | 'battery-saver';
export type Language = 'en' | 'es' | 'fr' | 'zh';
export type GameplayStyle = 'real-time' | 'asynchronous';
export type GameMode = 'computer' | 'two-player';
export type GameTimeControl =
  '1-minute' | '3-minutes' | '5-minutes' | '15-minutes' | '1-day' | '3-days' | '7-days';
export type GameChatMode = 'preset-reactions' | 'mute';
export type BoardZoomLevel = 1 | 1.25 | 1.5 | 2;

export interface GameSettings {
  speedAndMode: {
    useGlobalDefaults: boolean;
    gameplayStyle: GameplayStyle;
    timeControl: GameTimeControl;
    incrementSeconds: number;
    opponentSkillRange: number;
    difficulty: Difficulty;
    defaultMode: GameMode;
  };
  rules: {
    useGlobalDefaults: boolean;
    variant: string;
    handicapMode: boolean;
    drawRules: boolean;
    allowUndo: boolean;
  };
  visuals: {
    useGlobalDefaults: boolean;
    boardSkin: ThemeId;
    pieceStyle: ThemeId;
    legalMoveHighlights: boolean;
    lastMoveIndicator: boolean;
    threatWarnings: boolean;
    autoFlipBoard: boolean;
    animationSpeed: AnimationSpeed;
  };
  communication: {
    useGlobalDefaults: boolean;
    confirmMove: boolean;
    chatMode: GameChatMode;
  };
}

export interface Settings {
  themeId: ThemeId;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  volume: number;
  difficulty: Difficulty;
  nation: NationId;
  reducedMotion: boolean;
  highContrast: boolean;
  displayName: string;
  rating: number | null;
  cloudSaveSyncStatus: string;
  darkMode: boolean;
  language: Language;
  largeText: boolean;
  animationSpeed: AnimationSpeed;
  reducedMotionFollowsSystem: boolean;
  soundEffectsVolume: number;
  backgroundMusicEnabled: boolean;
  backgroundMusicVolume: number;
  showLegalMoveHighlights: boolean;
  showLastMoveMarker: boolean;
  showBoardCoordinates: boolean;
  useWesternSymbols: boolean;
  confirmMove: boolean;
  autoFlipBoard: boolean;
  screenOrientation: ScreenOrientation;
  allowUndoSinglePlayer: boolean;
  showHints: boolean;
  verboseScreenReaderAnnouncements: boolean;
  pushNotifications: boolean;
  dailyChallengeReminders: boolean;
  yourTurnAlerts: boolean;
  emailNotifications: boolean;
  friendRequestPrivacy: FriendRequestPrivacy;
  blockedPlayers: string[];
  shareAnonymousUsage: boolean;
  graphicsQuality: GraphicsQuality;
  gameSettings: Record<string, GameSettings>;
  boardZoomLevels: Record<string, BoardZoomLevel>;
}

const STORAGE_KEY = 'classic-games-arcade:settings';

export const DEFAULT_SETTINGS: Settings = {
  themeId: 'classic',
  soundEnabled: true,
  vibrationEnabled: true,
  volume: 0.5,
  difficulty: 'beginner',
  nation: 'all',
  reducedMotion: false,
  highContrast: false,
  displayName: '',
  rating: null,
  cloudSaveSyncStatus: 'Not connected',
  darkMode: false,
  language: 'en',
  largeText: false,
  animationSpeed: 'normal',
  reducedMotionFollowsSystem: false,
  soundEffectsVolume: 0.5,
  backgroundMusicEnabled: false,
  backgroundMusicVolume: 0.35,
  showLegalMoveHighlights: true,
  showLastMoveMarker: true,
  showBoardCoordinates: false,
  useWesternSymbols: false,
  confirmMove: false,
  autoFlipBoard: false,
  screenOrientation: 'auto',
  allowUndoSinglePlayer: true,
  showHints: true,
  verboseScreenReaderAnnouncements: false,
  pushNotifications: false,
  dailyChallengeReminders: false,
  yourTurnAlerts: false,
  emailNotifications: false,
  friendRequestPrivacy: 'everyone',
  blockedPlayers: [],
  shareAnonymousUsage: false,
  graphicsQuality: 'high',
  gameSettings: {},
  boardZoomLevels: {},
};

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  speedAndMode: {
    useGlobalDefaults: true,
    gameplayStyle: 'real-time',
    timeControl: '5-minutes',
    incrementSeconds: 0,
    opponentSkillRange: 200,
    difficulty: 'beginner',
    defaultMode: 'computer',
  },
  rules: {
    useGlobalDefaults: true,
    variant: 'american',
    handicapMode: false,
    drawRules: true,
    allowUndo: true,
  },
  visuals: {
    useGlobalDefaults: true,
    boardSkin: 'classic',
    pieceStyle: 'classic',
    legalMoveHighlights: true,
    lastMoveIndicator: true,
    threatWarnings: false,
    autoFlipBoard: false,
    animationSpeed: 'normal',
  },
  communication: {
    useGlobalDefaults: true,
    confirmMove: false,
    chatMode: 'preset-reactions',
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isThemeId(value: unknown): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'beginner' || value === 'professional' || value === 'expert';
}

function isBoardZoomLevel(value: unknown): value is BoardZoomLevel {
  return value === 1 || value === 1.25 || value === 1.5 || value === 2;
}

function isOneOf<const T extends readonly string[]>(
  value: unknown,
  options: T,
): value is T[number] {
  return typeof value === 'string' && options.some((option) => option === value);
}

function isVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

function parseGameSettings(value: unknown): GameSettings {
  if (!isRecord(value)) return DEFAULT_GAME_SETTINGS;
  const speedAndMode = isRecord(value.speedAndMode) ? value.speedAndMode : {};
  const rules = isRecord(value.rules) ? value.rules : {};
  const visuals = isRecord(value.visuals) ? value.visuals : {};
  const communication = isRecord(value.communication) ? value.communication : {};

  return {
    speedAndMode: {
      useGlobalDefaults:
        typeof speedAndMode.useGlobalDefaults === 'boolean'
          ? speedAndMode.useGlobalDefaults
          : DEFAULT_GAME_SETTINGS.speedAndMode.useGlobalDefaults,
      gameplayStyle: isOneOf(speedAndMode.gameplayStyle, ['real-time', 'asynchronous'])
        ? speedAndMode.gameplayStyle
        : DEFAULT_GAME_SETTINGS.speedAndMode.gameplayStyle,
      timeControl: isOneOf(speedAndMode.timeControl, [
        '1-minute',
        '3-minutes',
        '5-minutes',
        '15-minutes',
        '1-day',
        '3-days',
        '7-days',
      ])
        ? speedAndMode.timeControl
        : DEFAULT_GAME_SETTINGS.speedAndMode.timeControl,
      incrementSeconds:
        typeof speedAndMode.incrementSeconds === 'number' &&
        Number.isFinite(speedAndMode.incrementSeconds)
          ? Math.min(120, Math.max(0, speedAndMode.incrementSeconds))
          : DEFAULT_GAME_SETTINGS.speedAndMode.incrementSeconds,
      opponentSkillRange:
        typeof speedAndMode.opponentSkillRange === 'number' &&
        Number.isFinite(speedAndMode.opponentSkillRange)
          ? Math.min(500, Math.max(50, speedAndMode.opponentSkillRange))
          : DEFAULT_GAME_SETTINGS.speedAndMode.opponentSkillRange,
      difficulty: isDifficulty(speedAndMode.difficulty)
        ? speedAndMode.difficulty
        : DEFAULT_GAME_SETTINGS.speedAndMode.difficulty,
      defaultMode: isOneOf(speedAndMode.defaultMode, ['computer', 'two-player'])
        ? speedAndMode.defaultMode
        : DEFAULT_GAME_SETTINGS.speedAndMode.defaultMode,
    },
    rules: {
      useGlobalDefaults:
        typeof rules.useGlobalDefaults === 'boolean'
          ? rules.useGlobalDefaults
          : DEFAULT_GAME_SETTINGS.rules.useGlobalDefaults,
      variant: isOneOf(rules.variant, ['american', 'italian', 'international', 'standard'])
        ? rules.variant
        : DEFAULT_GAME_SETTINGS.rules.variant,
      handicapMode:
        typeof rules.handicapMode === 'boolean'
          ? rules.handicapMode
          : DEFAULT_GAME_SETTINGS.rules.handicapMode,
      drawRules:
        typeof rules.drawRules === 'boolean'
          ? rules.drawRules
          : DEFAULT_GAME_SETTINGS.rules.drawRules,
      allowUndo:
        typeof rules.allowUndo === 'boolean'
          ? rules.allowUndo
          : DEFAULT_GAME_SETTINGS.rules.allowUndo,
    },
    visuals: {
      useGlobalDefaults:
        typeof visuals.useGlobalDefaults === 'boolean'
          ? visuals.useGlobalDefaults
          : DEFAULT_GAME_SETTINGS.visuals.useGlobalDefaults,
      boardSkin: isThemeId(visuals.boardSkin)
        ? visuals.boardSkin
        : DEFAULT_GAME_SETTINGS.visuals.boardSkin,
      pieceStyle: isThemeId(visuals.pieceStyle)
        ? visuals.pieceStyle
        : DEFAULT_GAME_SETTINGS.visuals.pieceStyle,
      legalMoveHighlights:
        typeof visuals.legalMoveHighlights === 'boolean'
          ? visuals.legalMoveHighlights
          : DEFAULT_GAME_SETTINGS.visuals.legalMoveHighlights,
      lastMoveIndicator:
        typeof visuals.lastMoveIndicator === 'boolean'
          ? visuals.lastMoveIndicator
          : DEFAULT_GAME_SETTINGS.visuals.lastMoveIndicator,
      threatWarnings:
        typeof visuals.threatWarnings === 'boolean'
          ? visuals.threatWarnings
          : DEFAULT_GAME_SETTINGS.visuals.threatWarnings,
      autoFlipBoard:
        typeof visuals.autoFlipBoard === 'boolean'
          ? visuals.autoFlipBoard
          : DEFAULT_GAME_SETTINGS.visuals.autoFlipBoard,
      animationSpeed: isOneOf(visuals.animationSpeed, ['off', 'slow', 'normal', 'fast'])
        ? visuals.animationSpeed
        : DEFAULT_GAME_SETTINGS.visuals.animationSpeed,
    },
    communication: {
      useGlobalDefaults:
        typeof communication.useGlobalDefaults === 'boolean'
          ? communication.useGlobalDefaults
          : DEFAULT_GAME_SETTINGS.communication.useGlobalDefaults,
      confirmMove:
        typeof communication.confirmMove === 'boolean'
          ? communication.confirmMove
          : DEFAULT_GAME_SETTINGS.communication.confirmMove,
      chatMode: isOneOf(communication.chatMode, ['preset-reactions', 'mute'])
        ? communication.chatMode
        : DEFAULT_GAME_SETTINGS.communication.chatMode,
    },
  };
}

function parseGameSettingsMap(value: unknown): Record<string, GameSettings> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([gameId]) => gameId.length > 0)
      .map(([gameId, gameSettings]) => [gameId, parseGameSettings(gameSettings)]),
  );
}

function parseBoardZoomLevels(value: unknown): Record<string, BoardZoomLevel> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([gameId]) => gameId.length > 0)
      .map(([gameId, zoom]) => [gameId, isBoardZoomLevel(zoom) ? zoom : 1]),
  );
}

export function parseSettings(value: unknown): Settings {
  if (!isRecord(value)) return DEFAULT_SETTINGS;
  const version = value.version;
  if (
    version !== undefined &&
    version !== 1 &&
    version !== 2 &&
    version !== 3 &&
    version !== 4 &&
    version !== 5 &&
    version !== 6 &&
    version !== SETTINGS_VERSION
  ) {
    return DEFAULT_SETTINGS;
  }
  const nationWasIntroduced =
    typeof version === 'number' && version >= 2 && version <= SETTINGS_VERSION;
  const previewSettingsWereIntroduced =
    typeof version === 'number' && version >= 3 && version <= SETTINGS_VERSION;
  return {
    themeId: isThemeId(value.themeId) ? value.themeId : DEFAULT_SETTINGS.themeId,
    soundEnabled:
      typeof value.soundEnabled === 'boolean' ? value.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
    vibrationEnabled:
      typeof value.vibrationEnabled === 'boolean'
        ? value.vibrationEnabled
        : DEFAULT_SETTINGS.vibrationEnabled,
    volume: isVolume(value.volume, DEFAULT_SETTINGS.volume),
    difficulty: isDifficulty(value.difficulty) ? value.difficulty : DEFAULT_SETTINGS.difficulty,
    nation:
      nationWasIntroduced && isNationId(value.nation) ? value.nation : DEFAULT_SETTINGS.nation,
    reducedMotion:
      previewSettingsWereIntroduced && typeof value.reducedMotion === 'boolean'
        ? value.reducedMotion
        : DEFAULT_SETTINGS.reducedMotion,
    highContrast:
      previewSettingsWereIntroduced && typeof value.highContrast === 'boolean'
        ? value.highContrast
        : DEFAULT_SETTINGS.highContrast,
    displayName:
      typeof value.displayName === 'string' ? value.displayName : DEFAULT_SETTINGS.displayName,
    rating:
      value.rating === null || (typeof value.rating === 'number' && Number.isFinite(value.rating))
        ? value.rating
        : DEFAULT_SETTINGS.rating,
    cloudSaveSyncStatus:
      typeof value.cloudSaveSyncStatus === 'string'
        ? value.cloudSaveSyncStatus
        : DEFAULT_SETTINGS.cloudSaveSyncStatus,
    darkMode: typeof value.darkMode === 'boolean' ? value.darkMode : DEFAULT_SETTINGS.darkMode,
    language: isOneOf(value.language, ['en', 'es', 'fr', 'zh'])
      ? value.language
      : DEFAULT_SETTINGS.language,
    largeText: typeof value.largeText === 'boolean' ? value.largeText : DEFAULT_SETTINGS.largeText,
    animationSpeed: isOneOf(value.animationSpeed, ['off', 'slow', 'normal', 'fast'])
      ? value.animationSpeed
      : DEFAULT_SETTINGS.animationSpeed,
    reducedMotionFollowsSystem:
      typeof value.reducedMotionFollowsSystem === 'boolean'
        ? value.reducedMotionFollowsSystem
        : DEFAULT_SETTINGS.reducedMotionFollowsSystem,
    soundEffectsVolume: isVolume(value.soundEffectsVolume, DEFAULT_SETTINGS.soundEffectsVolume),
    backgroundMusicEnabled:
      typeof value.backgroundMusicEnabled === 'boolean'
        ? value.backgroundMusicEnabled
        : DEFAULT_SETTINGS.backgroundMusicEnabled,
    backgroundMusicVolume: isVolume(
      value.backgroundMusicVolume,
      DEFAULT_SETTINGS.backgroundMusicVolume,
    ),
    showLegalMoveHighlights:
      typeof value.showLegalMoveHighlights === 'boolean'
        ? value.showLegalMoveHighlights
        : DEFAULT_SETTINGS.showLegalMoveHighlights,
    showLastMoveMarker:
      typeof value.showLastMoveMarker === 'boolean'
        ? value.showLastMoveMarker
        : DEFAULT_SETTINGS.showLastMoveMarker,
    showBoardCoordinates:
      typeof value.showBoardCoordinates === 'boolean'
        ? value.showBoardCoordinates
        : DEFAULT_SETTINGS.showBoardCoordinates,
    useWesternSymbols:
      typeof value.useWesternSymbols === 'boolean'
        ? value.useWesternSymbols
        : DEFAULT_SETTINGS.useWesternSymbols,
    confirmMove:
      typeof value.confirmMove === 'boolean' ? value.confirmMove : DEFAULT_SETTINGS.confirmMove,
    autoFlipBoard:
      typeof value.autoFlipBoard === 'boolean'
        ? value.autoFlipBoard
        : DEFAULT_SETTINGS.autoFlipBoard,
    screenOrientation: isOneOf(value.screenOrientation, ['auto', 'portrait', 'landscape'])
      ? value.screenOrientation
      : DEFAULT_SETTINGS.screenOrientation,
    allowUndoSinglePlayer:
      typeof value.allowUndoSinglePlayer === 'boolean'
        ? value.allowUndoSinglePlayer
        : DEFAULT_SETTINGS.allowUndoSinglePlayer,
    showHints: typeof value.showHints === 'boolean' ? value.showHints : DEFAULT_SETTINGS.showHints,
    verboseScreenReaderAnnouncements:
      typeof value.verboseScreenReaderAnnouncements === 'boolean'
        ? value.verboseScreenReaderAnnouncements
        : DEFAULT_SETTINGS.verboseScreenReaderAnnouncements,
    pushNotifications:
      typeof value.pushNotifications === 'boolean'
        ? value.pushNotifications
        : DEFAULT_SETTINGS.pushNotifications,
    dailyChallengeReminders:
      typeof value.dailyChallengeReminders === 'boolean'
        ? value.dailyChallengeReminders
        : DEFAULT_SETTINGS.dailyChallengeReminders,
    yourTurnAlerts:
      typeof value.yourTurnAlerts === 'boolean'
        ? value.yourTurnAlerts
        : DEFAULT_SETTINGS.yourTurnAlerts,
    emailNotifications:
      typeof value.emailNotifications === 'boolean'
        ? value.emailNotifications
        : DEFAULT_SETTINGS.emailNotifications,
    friendRequestPrivacy: isOneOf(value.friendRequestPrivacy, [
      'everyone',
      'friends-of-friends',
      'no-one',
    ])
      ? value.friendRequestPrivacy
      : DEFAULT_SETTINGS.friendRequestPrivacy,
    blockedPlayers:
      Array.isArray(value.blockedPlayers) &&
      value.blockedPlayers.every((player): player is string => typeof player === 'string')
        ? value.blockedPlayers
        : DEFAULT_SETTINGS.blockedPlayers,
    shareAnonymousUsage:
      typeof value.shareAnonymousUsage === 'boolean'
        ? value.shareAnonymousUsage
        : DEFAULT_SETTINGS.shareAnonymousUsage,
    graphicsQuality: isOneOf(value.graphicsQuality, ['high', 'medium', 'battery-saver'])
      ? value.graphicsQuality
      : DEFAULT_SETTINGS.graphicsQuality,
    gameSettings:
      typeof version === 'number' && version >= 5 ? parseGameSettingsMap(value.gameSettings) : {},
    boardZoomLevels:
      typeof version === 'number' && version >= 7
        ? parseBoardZoomLevels(value.boardZoomLevels)
        : {},
  };
}

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_SETTINGS;
    const stored: unknown = JSON.parse(raw);
    const settings = parseSettings(stored);
    if (isRecord(stored) && stored.version !== SETTINGS_VERSION) saveSettings(settings);
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...settings, version: SETTINGS_VERSION }),
    );
  } catch {
    // Storage may be unavailable (private mode, quota); settings still apply for this visit.
  }
}

export function clearSettings() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
