import { useSettings } from '@/hooks/useSettings';

export type TraditionalPieceShape = 'circle' | 'diamond' | 'octagon';
export type TraditionalPieceColour = 'red' | 'black' | 'blue' | 'gold';

export interface TraditionalPieceDefinition {
  glyph: string;
  label: string;
  shape: TraditionalPieceShape;
  colourToken: TraditionalPieceColour;
  westernGlyph?: string;
}

const fillColours: Record<TraditionalPieceColour, string> = {
  red: 'rgb(var(--color-danger))',
  black: 'rgb(var(--color-foreground))',
  blue: 'rgb(var(--color-primary))',
  gold: 'rgb(var(--color-accent))',
};

const shapePaths: Record<TraditionalPieceShape, string> = {
  circle: 'M 50 7 A 43 43 0 1 1 50 93 A 43 43 0 1 1 50 7 Z',
  diamond: 'M 50 5 L 95 50 L 50 95 L 5 50 Z',
  octagon: 'M 30 5 H 70 L 95 30 V 70 L 70 95 H 30 L 5 70 V 30 Z',
};

export default function TraditionalPiece({ piece }: { piece: TraditionalPieceDefinition }) {
  const { settings } = useSettings();
  const text = settings.useWesternSymbols
    ? (piece.westernGlyph ?? piece.label.slice(0, 1))
    : piece.glyph;

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={piece.label}
      className="h-full w-full overflow-visible"
      focusable="false"
    >
      <path
        d={shapePaths[piece.shape]}
        fill={fillColours[piece.colourToken]}
        stroke="currentColor"
        strokeWidth="4"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x="50"
        y="52"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-background font-bold"
        fontSize="48"
      >
        {text}
      </text>
      <circle cx="87" cy="13" r="5" fill="currentColor" />
    </svg>
  );
}
