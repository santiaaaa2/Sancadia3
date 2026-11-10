export type ThemeId = 'classic' | 'midnight' | 'sunset';

export type ThemeTokenName =
  | 'background'
  | 'surface'
  | 'foreground'
  | 'subtle'
  | 'border'
  | 'primary'
  | 'primary-hover'
  | 'primary-foreground'
  | 'primary-soft'
  | 'accent'
  | 'online-accent'
  | 'online-accent-foreground'
  | 'danger'
  | 'danger-foreground'
  | 'board-light'
  | 'board-dark'
  | 'board-line';

export interface Theme {
  id: ThemeId;
  name: string;
  colorScheme: 'light' | 'dark';
  tokens: Record<ThemeTokenName, string>;
}

export const themes: Theme[] = [
  {
    id: 'classic',
    name: 'Classic',
    colorScheme: 'light',
    tokens: {
      background: '#f7f8f5',
      surface: '#ffffff',
      foreground: '#1c2421',
      subtle: '#5b6661',
      border: '#e1e6e0',
      primary: '#047857',
      'primary-hover': '#065f46',
      'primary-foreground': '#ffffff',
      'primary-soft': '#ecfdf5',
      accent: '#a84b00',
      'online-accent': '#facc15',
      'online-accent-foreground': '#1c2421',
      danger: '#b91c1c',
      'danger-foreground': '#ffffff',
      'board-light': '#f3e9d2',
      'board-dark': '#c9a66b',
      'board-line': '#5b4636',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colorScheme: 'dark',
    tokens: {
      background: '#0b1220',
      surface: '#141c2e',
      foreground: '#e6ecf5',
      subtle: '#9aa7bd',
      border: '#26324a',
      primary: '#34d399',
      'primary-hover': '#6ee7b7',
      'primary-foreground': '#04261c',
      'primary-soft': '#14302c',
      accent: '#60a5fa',
      'online-accent': '#facc15',
      'online-accent-foreground': '#1c2421',
      danger: '#f87171',
      'danger-foreground': '#2a0a0a',
      'board-light': '#223049',
      'board-dark': '#1a2439',
      'board-line': '#3b4b6b',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colorScheme: 'light',
    tokens: {
      background: '#fff4ec',
      surface: '#ffffff',
      foreground: '#3b1f1a',
      subtle: '#7a5a52',
      border: '#f3d9cc',
      primary: '#c2410c',
      'primary-hover': '#9a3412',
      'primary-foreground': '#ffffff',
      'primary-soft': '#ffedd5',
      accent: '#a61b5b',
      'online-accent': '#facc15',
      'online-accent-foreground': '#1c2421',
      danger: '#b91c1c',
      'danger-foreground': '#ffffff',
      'board-light': '#fde3c8',
      'board-dark': '#f0b48a',
      'board-line': '#8a3b1f',
    },
  },
];

export function getTheme(id: ThemeId): Theme {
  return (
    themes.find((theme) => theme.id === id) ??
    themes[0] ?? {
      id: 'classic',
      name: 'Classic',
      colorScheme: 'light',
      tokens: {
        background: '#f7f8f5',
        surface: '#ffffff',
        foreground: '#1c2421',
        subtle: '#5b6661',
        border: '#e1e6e0',
        primary: '#047857',
        'primary-hover': '#065f46',
        'primary-foreground': '#ffffff',
        'primary-soft': '#ecfdf5',
        accent: '#a84b00',
        'online-accent': '#facc15',
        'online-accent-foreground': '#1c2421',
        danger: '#b91c1c',
        'danger-foreground': '#ffffff',
        'board-light': '#f3e9d2',
        'board-dark': '#c9a66b',
        'board-line': '#5b4636',
      },
    }
  );
}

function hexToRgbTriplet(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const [name, hex] of Object.entries(theme.tokens)) {
    root.style.setProperty(`--color-${name}`, hexToRgbTriplet(hex));
  }
  root.style.colorScheme = theme.colorScheme;
  root.dataset.theme = theme.id;
}
