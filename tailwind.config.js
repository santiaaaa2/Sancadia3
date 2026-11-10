/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: token('background'),
        surface: token('surface'),
        foreground: token('foreground'),
        subtle: token('subtle'),
        border: token('border'),
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          foreground: token('primary-foreground'),
          soft: token('primary-soft'),
        },
        accent: {
          DEFAULT: token('accent'),
          subtle: token('subtle'),
        },
        online: {
          accent: token('online-accent'),
          'accent-foreground': token('online-accent-foreground'),
        },
        danger: {
          DEFAULT: token('danger'),
          foreground: token('danger-foreground'),
        },
        board: {
          light: token('board-light'),
          dark: token('board-dark'),
          line: token('board-line'),
        },
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'drop-piece': {
          from: { transform: 'translateY(var(--drop-from, -300%))' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out both',
        'drop-piece': 'drop-piece 450ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
