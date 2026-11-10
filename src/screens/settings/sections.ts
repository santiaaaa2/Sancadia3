import { nations } from '@/games/nations';
import { difficultyOptions } from '@/lib/difficultyOptions';
import type { Settings } from '@/lib/settings';

type ToggleKey = {
  [K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

type SelectKey =
  'nation' | 'language' | 'screenOrientation' | 'friendRequestPrivacy' | 'graphicsQuality';

export type SettingsRow =
  | { type: 'nation-list'; key: 'nation' }
  | { type: 'multiplayer' }
  | { type: 'theme'; key: 'themeId'; status: 'active' }
  | {
      type: 'select';
      key: SelectKey;
      label: string;
      description: string;
      status: 'active' | 'preview';
      options: readonly { value: string; label: string }[];
    }
  | {
      type: 'segmented';
      key: 'difficulty' | 'animationSpeed';
      label: string;
      description: string;
      status: 'active' | 'preview';
      options: readonly { value: string; label: string }[];
    }
  | {
      type: 'toggle';
      key: ToggleKey;
      label: string;
      description: string;
      status: 'active' | 'preview';
    }
  | {
      type: 'slider';
      key: 'volume' | 'soundEffectsVolume' | 'backgroundMusicVolume';
      label: string;
      description: string;
      status: 'active' | 'preview';
      min: number;
      max: number;
      step: number;
    }
  | {
      type: 'text';
      key: 'displayName';
      label: string;
      description: string;
      status: 'preview';
      placeholder: string;
    }
  | {
      type: 'value';
      key: 'rating' | 'cloudSaveSyncStatus';
      label: string;
      description?: string;
      value?: string;
      status: 'preview';
    }
  | {
      type: 'action';
      id:
        | 'sign-in'
        | 'link-email'
        | 'sign-out'
        | 'privacy'
        | 'export-history'
        | 'import-data'
        | 'install-app'
        | 'reset-data';
      label: string;
      description?: string;
      status: 'active' | 'preview';
    };

export interface SettingsSectionDefinition {
  id: string;
  title: string;
  description?: string;
  rows: readonly SettingsRow[];
}

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'zh', label: '中文' },
] as const;

const animationSpeedOptions = [
  { value: 'off', label: 'Off' },
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
] as const;

export const settingsSections: readonly SettingsSectionDefinition[] = [
  {
    id: 'shire',
    title: 'Sancadia Shire',
    description: 'Explore games from each nation.',
    rows: [
      { type: 'nation-list', key: 'nation' },
      {
        type: 'select',
        key: 'nation',
        label: 'Nation',
        description: 'Filter the games list by nation.',
        status: 'active',
        options: nations.map(({ id, name, flag }) => ({
          value: id,
          label: `${flag} ${name}`,
        })),
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Profile',
    description: 'Account features are coming soon.',
    rows: [
      {
        type: 'text',
        key: 'displayName',
        label: 'Display name',
        description: 'Choose the name shown to other players.',
        status: 'preview',
        placeholder: 'Enter a display name',
      },
      {
        type: 'value',
        key: 'rating',
        label: 'Rating / ELO',
        description: 'Your competitive rating.',
        value: 'Not rated yet',
        status: 'preview',
      },
      {
        type: 'action',
        id: 'sign-in',
        label: 'Sign in',
        description: 'Sign in or create an account.',
        status: 'preview',
      },
      {
        type: 'action',
        id: 'link-email',
        label: 'Link email',
        description: 'Connect an email address to your account.',
        status: 'preview',
      },
      {
        type: 'value',
        key: 'cloudSaveSyncStatus',
        label: 'Cloud save sync',
        status: 'preview',
      },
      {
        type: 'action',
        id: 'sign-out',
        label: 'Sign out',
        status: 'preview',
      },
    ],
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Personalize the look and feel of the arcade.',
    rows: [
      { type: 'theme', key: 'themeId', status: 'active' },
      {
        type: 'toggle',
        key: 'darkMode',
        label: 'Dark mode',
        description: 'Use a dark color scheme.',
        status: 'preview',
      },
      {
        type: 'select',
        key: 'language',
        label: 'Language',
        description: 'Choose the display language.',
        status: 'preview',
        options: languageOptions,
      },
      {
        type: 'toggle',
        key: 'largeText',
        label: 'Large text',
        description: 'Increase text size throughout the arcade.',
        status: 'preview',
      },
      {
        type: 'toggle',
        key: 'highContrast',
        label: 'High contrast theme',
        description: 'Increase contrast across the interface.',
        status: 'preview',
      },
      {
        type: 'segmented',
        key: 'animationSpeed',
        label: 'Animation speed',
        description: 'Choose how quickly interface animations play.',
        status: 'preview',
        options: animationSpeedOptions,
      },
      {
        type: 'toggle',
        key: 'reducedMotionFollowsSystem',
        label: 'Reduced motion follows the system',
        description: 'Respect your device’s reduced-motion preference.',
        status: 'preview',
      },
    ],
  },
  {
    id: 'audio',
    title: 'Audio & Haptics',
    description: 'Manage sound and haptic feedback.',
    rows: [
      {
        type: 'toggle',
        key: 'soundEnabled',
        label: 'Sound',
        description: 'Play sound effects during games.',
        status: 'active',
      },
      {
        type: 'slider',
        key: 'volume',
        label: 'Master volume',
        description: 'Adjust the overall sound effect volume.',
        status: 'active',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        type: 'slider',
        key: 'soundEffectsVolume',
        label: 'Sound effects volume',
        description: 'Adjust individual game sound effects.',
        status: 'preview',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        type: 'toggle',
        key: 'backgroundMusicEnabled',
        label: 'Background music',
        description: 'Play music while using the arcade.',
        status: 'preview',
      },
      {
        type: 'slider',
        key: 'backgroundMusicVolume',
        label: 'Background music volume',
        description: 'Adjust the background music volume.',
        status: 'preview',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        type: 'toggle',
        key: 'vibrationEnabled',
        label: 'Haptic feedback',
        description: 'Feel a buzz on taps and wins when supported.',
        status: 'active',
      },
    ],
  },
  {
    id: 'board',
    title: 'Board & Interface',
    description: 'Set global board and interface defaults.',
    rows: [
      {
        type: 'toggle',
        key: 'showLegalMoveHighlights',
        label: 'Show legal-move highlights',
        description: 'Highlight available moves on the board.',
        status: 'preview',
      },
      {
        type: 'toggle',
        key: 'showLastMoveMarker',
        label: 'Show last-move marker',
        description: 'Mark the most recent move.',
        status: 'preview',
      },
      {
        type: 'toggle',
        key: 'showBoardCoordinates',
        label: 'Show board coordinates / notation',
        description: 'Display coordinates around game boards.',
        status: 'preview',
      },
      {
        type: 'toggle',
        key: 'useWesternSymbols',
        label: 'Show Western symbols instead of Chinese characters',
        description: 'Use Western text labels on traditional Chinese game pieces.',
        status: 'active',
      },
      {
        type: 'toggle',
        key: 'confirmMove',
        label: 'Confirm move button',
        description: 'Ask for confirmation before submitting a move.',
        status: 'preview',
      },
      {
        type: 'toggle',
        key: 'autoFlipBoard',
        label: 'Auto-flip board for local 2-player',
        description: 'Rotate the board for the next local player.',
        status: 'preview',
      },
      {
        type: 'select',
        key: 'screenOrientation',
        label: 'Screen orientation',
        description: 'Set a preferred orientation for play.',
        status: 'preview',
        options: [
          { value: 'auto', label: 'Auto' },
          { value: 'portrait', label: 'Portrait' },
          { value: 'landscape', label: 'Landscape' },
        ],
      },
    ],
  },
  {
    id: 'gameplay',
    title: 'Gameplay Defaults',
    description: 'Choose your default gameplay preferences.',
    rows: [
      {
        type: 'segmented',
        key: 'difficulty',
        label: 'Default difficulty',
        description: 'Choose the default challenge for computer opponents.',
        status: 'active',
        options: difficultyOptions,
      },
      {
        type: 'toggle',
        key: 'allowUndoSinglePlayer',
        label: 'Allow undo in single-player',
        description: 'Allow undoing a move against the computer.',
        status: 'preview',
      },
      {
        type: 'toggle',
        key: 'showHints',
        label: 'Show hints',
        description: 'Make hints available during games.',
        status: 'preview',
      },
      {
        type: 'toggle',
        key: 'verboseScreenReaderAnnouncements',
        label: 'Verbose screen-reader announcements',
        description: 'Include more detail in spoken game updates.',
        status: 'preview',
      },
    ],
  },
  {
    id: 'multiplayer',
    title: 'Multiplayer',
    description: 'Online play and multiplayer social settings are coming soon.',
    rows: [{ type: 'multiplayer' }],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Notification options are coming soon.',
    rows: [
      {
        type: 'toggle',
        key: 'pushNotifications',
        label: 'Master push notifications',
        description: 'Allow push notifications from the arcade.',
        status: 'preview',
      },
      {
        type: 'toggle',
        key: 'dailyChallengeReminders',
        label: 'Daily challenge reminders',
        description: 'Get a reminder when a daily challenge is available.',
        status: 'preview',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Social',
    description: 'Social and privacy controls are coming soon.',
    rows: [
      {
        type: 'toggle',
        key: 'shareAnonymousUsage',
        label: 'Share anonymous usage data',
        description: 'Help improve the arcade with anonymous usage data.',
        status: 'preview',
      },
      {
        type: 'action',
        id: 'privacy',
        label: 'Privacy policy',
        description: 'Read how your data is handled.',
        status: 'preview',
      },
    ],
  },
  {
    id: 'performance',
    title: 'Performance & Data',
    description: 'Manage performance and saved data.',
    rows: [
      {
        type: 'select',
        key: 'graphicsQuality',
        label: 'Graphics quality',
        description: 'Balance visual quality and battery life.',
        status: 'preview',
        options: [
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'battery-saver', label: 'Battery saver' },
        ],
      },
      {
        type: 'action',
        id: 'export-history',
        label: 'Export game history',
        description: 'Download your game history.',
        status: 'preview',
      },
      {
        type: 'action',
        id: 'import-data',
        label: 'Import data',
        description: 'Import previously exported arcade data.',
        status: 'preview',
      },
      {
        type: 'action',
        id: 'install-app',
        label: 'Install app',
        description: 'Add the arcade to your device.',
        status: 'active',
      },
      {
        type: 'action',
        id: 'reset-data',
        label: 'Reset all data',
        description: 'Clears your settings, scores, streaks and points.',
        status: 'active',
      },
    ],
  },
];
