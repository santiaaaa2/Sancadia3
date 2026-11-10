import SettingRow, { type SettingStatus } from '@/components/settings/SettingRow';
import useSettingStatusDescriptionId from '@/components/settings/useSettingStatusDescriptionId';

interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  status: SettingStatus;
  disabled?: boolean;
  disabledMessage?: string;
}

export default function SettingToggle({
  label,
  description,
  checked,
  onChange,
  status,
  disabled = false,
  disabledMessage,
}: SettingToggleProps) {
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
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        aria-disabled={isDisabled}
        aria-describedby={statusDescriptionId}
        disabled={isDisabled}
        onClick={() => {
          if (!isDisabled) onChange(!checked);
        }}
        className="flex min-h-11 w-full items-center justify-between gap-4 rounded-xl text-left text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:cursor-not-allowed sm:justify-end"
      >
        <span className="text-sm text-subtle">{checked ? 'On' : 'Off'}</span>
        <span
          aria-hidden="true"
          className={`relative h-8 w-14 shrink-0 rounded-full ring-1 ring-border ${
            checked && !isDisabled ? 'bg-primary' : 'bg-background'
          }`}
        >
          <span
            className={`absolute left-1 top-1 h-6 w-6 rounded-full shadow ${
              checked && !isDisabled
                ? 'translate-x-6 bg-primary-foreground'
                : 'translate-x-0 bg-subtle'
            }`}
          />
        </span>
      </button>
    </SettingRow>
  );
}
