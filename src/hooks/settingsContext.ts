import { createContext } from 'react';
import type { GameSettings, Settings } from '@/lib/settings';

export interface SettingsContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  updateGameSettings: (gameId: string, gameSettings: GameSettings) => void;
  resetGameSettings: (gameId: string) => void;
  resetSettings: () => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);
