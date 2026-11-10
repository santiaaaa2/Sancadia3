import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SettingsProvider from '@/components/SettingsProvider';
import TraditionalPiece from '@/components/TraditionalPiece';

describe('TraditionalPiece', () => {
  it('renders the Chinese glyph by default and the Western fallback when enabled', () => {
    window.localStorage.setItem(
      'classic-games-arcade:settings',
      JSON.stringify({ version: 6, useWesternSymbols: true }),
    );
    render(
      <SettingsProvider>
        <TraditionalPiece
          piece={{
            glyph: '帥',
            label: 'Red general',
            shape: 'diamond',
            colourToken: 'red',
            westernGlyph: 'G',
          }}
        />
      </SettingsProvider>,
    );

    expect(screen.getByRole('img', { name: 'Red general' })).toBeTruthy();
    expect(screen.getByText('G')).toBeTruthy();
  });
});
