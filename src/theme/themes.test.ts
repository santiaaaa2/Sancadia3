import { describe, expect, it } from 'vitest';
import { themes } from '@/theme/themes';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const red = linear[0] ?? 0;
  const green = linear[1] ?? 0;
  const blue = linear[2] ?? 0;
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrast(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  const lighter = values[0] ?? 0;
  const darker = values[1] ?? 0;
  return (lighter + 0.05) / (darker + 0.05);
}

describe('theme contrast', () => {
  it.each(themes)('$name provides readable text and controls', (theme) => {
    const { tokens } = theme;
    const pairs: Array<[string, string]> = [
      [tokens.foreground, tokens.background],
      [tokens.foreground, tokens.surface],
      [tokens.subtle, tokens.background],
      [tokens.subtle, tokens.surface],
      [tokens.primary, tokens.background],
      [tokens.accent, tokens.background],
      [tokens['online-accent-foreground'], tokens['online-accent']],
      [tokens.danger, tokens.background],
      [tokens['primary-foreground'], tokens.primary],
      [tokens['primary-foreground'], tokens['primary-hover']],
      [tokens['danger-foreground'], tokens.danger],
      [tokens.primary, tokens['primary-soft']],
    ];
    for (const [foreground, background] of pairs) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
