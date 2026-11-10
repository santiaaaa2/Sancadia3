import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ScreenHeaderProps {
  title: string;
  backTo?: string;
  className?: string;
}

export default function ScreenHeader({ title, backTo, className }: ScreenHeaderProps) {
  return (
    <header className={`flex min-h-11 items-center gap-3 pb-6 pt-2 ${className ?? ''}`.trim()}>
      {backTo && (
        <Link
          to={backTo}
          aria-label="Go back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-foreground shadow-sm ring-1 ring-border transition duration-200 hover:bg-primary-soft active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
      )}
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    </header>
  );
}
