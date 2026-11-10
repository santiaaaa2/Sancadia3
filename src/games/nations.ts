export const nations = [
  { id: 'all', name: 'All nations', flag: '🌍' },
  { id: 'france', name: 'France', flag: '🇫🇷' },
  {
    id: 'england',
    name: 'England',
    flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  },
  { id: 'italy', name: 'Italy', flag: '🇮🇹' },
  { id: 'spain', name: 'Spain', flag: '🇪🇸' },
  { id: 'portugal', name: 'Portugal', flag: '🇵🇹' },
  { id: 'holland', name: 'Holland', flag: '🇳🇱' },
  { id: 'china', name: 'China', flag: '🇨🇳' },
  { id: 'india', name: 'India', flag: '🇮🇳' },
] as const;

export type NationId = (typeof nations)[number]['id'];

export function getNation(id: NationId) {
  return nations.find((nation) => nation.id === id) ?? nations[0];
}

export function isNationId(value: unknown): value is NationId {
  return typeof value === 'string' && nations.some((nation) => nation.id === value);
}
