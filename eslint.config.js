import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/engine/**/*.{ts,tsx}', 'src/games/**/{rules,ai}.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                '@/components/**',
                '@/screens/**',
                '@/hooks/**',
                '**/components/**',
                '**/screens/**',
                '**/hooks/**',
              ],
              message: 'Keep engines, game rules, and AI independent of the UI.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/games/{xiangqi,go,chinesecheckers,luzhanqi,mahjong}/{rules,ai}.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Use an injected random source so game logic is deterministic in tests.',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Use an injected clock so game logic is deterministic in tests.',
        },
      ],
    },
  },
);
