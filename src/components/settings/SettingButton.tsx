import Button from '@/components/Button';
import SettingRow, { type SettingStatus } from '@/components/settings/SettingRow';
import useSettingStatusDescriptionId from '@/components/settings/useSettingStatusDescriptionId';
import type { ButtonVariant } from '@/lib/buttonStyles';

interface SettingButtonProps {
  label: string;
  description?: string;
  onClick: () => void;
  status: SettingStatus;
  variant?: ButtonVariant;
  disabled?: boolean;
}

export default function SettingButton({
  label,
  description,
  onClick,
  status,
  variant = 'secondary',
  disabled = false,
}: SettingButtonProps) {
  const preview = status !== 'active';
  const isDisabled = preview || disabled;
  const statusDescriptionId = useSettingStatusDescriptionId(status);
  return (
    <SettingRow
      label={label}
      description={description}
      status={status}
      statusDescriptionId={statusDescriptionId}
    >
      <Button
        variant={preview ? 'secondary' : variant}
        aria-label={label}
        aria-disabled={isDisabled}
        aria-describedby={statusDescriptionId}
        disabled={isDisabled}
        onClick={onClick}
        className="w-full disabled:bg-background disabled:text-subtle disabled:shadow-none sm:max-w-xs sm:justify-self-end"
      >
        {label}
      </Button>
    </SettingRow>
  );
}
