import SettingRow, { type SettingStatus } from '@/components/settings/SettingRow';
import useSettingStatusDescriptionId from '@/components/settings/useSettingStatusDescriptionId';

interface SettingTextInputProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  status: SettingStatus;
  placeholder?: string;
}

export default function SettingTextInput({
  label,
  description,
  value,
  onChange,
  status,
  placeholder,
}: SettingTextInputProps) {
  const preview = status === 'preview';
  const statusDescriptionId = useSettingStatusDescriptionId(status);
  return (
    <SettingRow
      label={label}
      description={description}
      status={status}
      statusDescriptionId={statusDescriptionId}
    >
      <input
        type="text"
        aria-label={label}
        aria-disabled={preview}
        aria-describedby={statusDescriptionId}
        disabled={preview}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          if (!preview) onChange(event.currentTarget.value);
        }}
        className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-foreground placeholder:text-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:text-subtle sm:max-w-xs sm:justify-self-end"
      />
    </SettingRow>
  );
}
