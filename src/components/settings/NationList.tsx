import { Check } from 'lucide-react';
import { nations, type NationId } from '@/games/nations';

export default function NationList({ selected }: { selected: NationId }) {
  return (
    <ul
      aria-label="Nations"
      data-status="active"
      className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-3"
    >
      {nations.map((nation) => {
        const isSelected = selected === nation.id;
        return (
          <li
            key={nation.id}
            aria-current={isSelected ? 'true' : undefined}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium ${
              isSelected ? 'bg-primary-soft text-primary' : 'text-subtle'
            }`}
          >
            {isSelected && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
            <span aria-hidden="true" className="text-lg">
              {nation.flag}
            </span>
            <span className="min-w-0 break-words">{nation.name}</span>
          </li>
        );
      })}
    </ul>
  );
}
