import { useState } from 'react';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';

export default function ReconstructedRulesBadge({
  gameName,
  note,
  className = '',
}: {
  gameName: string;
  note: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`About reconstructed rules for ${gameName}`}
        className={`min-h-11 rounded-full border border-accent/50 bg-accent/10 px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${className}`}
      >
        Reconstructed rules
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`${gameName}: Reconstructed rules`}
        description={note}
      >
        <Button onClick={() => setOpen(false)}>Close</Button>
      </Dialog>
    </>
  );
}
