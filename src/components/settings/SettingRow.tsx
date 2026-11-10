import { useId, type ReactNode } from 'react';
import ComingSoonBadge from '@/components/settings/ComingSoonBadge';

export type SettingStatus = 'active' | 'preview' | 'unavailable';

interface SettingRowProps {
  label: string;
  description?: string;
  status: SettingStatus;
  disabledMessage?: string;
  statusDescriptionId?: string;
  children: ReactNode;
}

export default function SettingRow({
  label,
  description,
  status,
  disabledMessage,
  statusDescriptionId,
  children,
}: SettingRowProps) {
  const generatedId = useId();
  const descriptionId = statusDescriptionId ?? generatedId;

  return (
    <div
      className="grid gap-3 border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.9fr)] sm:items-center"
      data-status={status}
    >
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{label}</span>
          {status === 'preview' && <ComingSoonBadge id={descriptionId} />}
          {status === 'unavailable' && (
            <span id={descriptionId} className="text-sm font-medium text-subtle">
              Not available for this game
            </span>
          )}
        </div>
        {description && <span className="text-sm text-subtle">{description}</span>}
        {disabledMessage && <span className="text-sm text-subtle">{disabledMessage}</span>}
      </div>
      {children}
    </div>
  );
}
