import SettingRow, { type SettingStatus } from '@/components/settings/SettingRow';
import useSettingStatusDescriptionId from '@/components/settings/useSettingStatusDescriptionId';

interface SettingValueProps {
  label: string;
  description?: string;
  value: string;
  status: SettingStatus;
}

export default function SettingValue({ label, description, value, status }: SettingValueProps) {
  const statusDescriptionId = useSettingStatusDescriptionId(status);
  return (
    <SettingRow
      label={label}
      description={description}
      status={status}
      statusDescriptionId={statusDescriptionId}
    >
      <output
        aria-label={label}
        aria-describedby={statusDescriptionId}
        className="min-h-11 break-words py-3 text-sm text-subtle sm:text-right"
      >
        {value}
      </output>
    </SettingRow>
  );
}
