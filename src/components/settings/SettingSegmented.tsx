import { Check } from 'lucide-react';
import SettingRow, { type SettingStatus } from '@/components/settings/SettingRow';
import useSettingStatusDescriptionId from '@/components/settings/useSettingStatusDescriptionId';
import type { SettingOption } from '@/components/settings/SettingSelect';

interface SettingSegmentedProps {
  label: string;
  description?: string;
  value: string;
  options: readonly SettingOption[];
  onChange: (value: string) => void;
  status: SettingStatus;
  disabled?: boolean;
  disabledMessage?: string;
}

export default function SettingSegmented({
  label,
  description,
  value,
  options,
  onChange,
  status,
  disabled = false,
  disabledMessage,
}: SettingSegmentedProps) {
  const isDisabled = status !== 'active' || disabled;
  const statusDescriptionId = useSettingStatusDescriptionId(status);
  if (options.length < 2 || options.length > 4) {
    throw new Error('SettingSegmented requires between 2 and 4 options.');
  }
  return (
    <SettingRow
      label={label}
      description={description}
      status={status}
      disabledMessage={disabledMessage}
      statusDescriptionId={statusDescriptionId}
    >
      <div
        role="radiogroup"
        aria-label={label}
        aria-disabled={isDisabled}
        className="grid w-full grid-cols-2 gap-2 sm:max-w-xs sm:justify-self-end"
      >
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-label={option.label}
              aria-checked={selected}
              aria-disabled={isDisabled || option.disabled === true}
              aria-describedby={statusDescriptionId}
              disabled={isDisabled || option.disabled}
              onClick={() => {
                if (!isDisabled && !option.disabled) onChange(option.value);
              }}
              className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 whitespace-normal break-words rounded-xl px-3 text-sm font-semibold ring-1 ring-border focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:cursor-not-allowed ${
                selected && !isDisabled
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground'
              }`}
            >
              {selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </SettingRow>
  );
}
