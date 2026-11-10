import SettingRow, { type SettingStatus } from '@/components/settings/SettingRow';
import useSettingStatusDescriptionId from '@/components/settings/useSettingStatusDescriptionId';

export interface SettingOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SettingSelectProps {
  label: string;
  description?: string;
  value: string;
  options: readonly SettingOption[];
  onChange: (value: string) => void;
  status: SettingStatus;
  disabled?: boolean;
  disabledMessage?: string;
}

export default function SettingSelect({
  label,
  description,
  value,
  options,
  onChange,
  status,
  disabled = false,
  disabledMessage,
}: SettingSelectProps) {
  const isDisabled = status !== 'active' || disabled;
  const statusDescriptionId = useSettingStatusDescriptionId(status);
  return (
    <SettingRow
      label={label}
      description={description}
      status={status}
      disabledMessage={disabledMessage}
      statusDescriptionId={statusDescriptionId}
    >
      <select
        aria-label={label}
        aria-disabled={isDisabled}
        aria-describedby={statusDescriptionId}
        disabled={isDisabled}
        value={value}
        onChange={(event) => {
          if (!isDisabled) onChange(event.currentTarget.value);
        }}
        className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:text-subtle sm:max-w-xs sm:justify-self-end"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </SettingRow>
  );
}
