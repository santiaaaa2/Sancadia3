import SettingRow, { type SettingStatus } from '@/components/settings/SettingRow';
import useSettingStatusDescriptionId from '@/components/settings/useSettingStatusDescriptionId';

interface SettingSliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  valueLabel?: string;
  onChange: (value: number) => void;
  status: SettingStatus;
  disabled?: boolean;
  disabledMessage?: string;
}

export default function SettingSlider({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  valueLabel,
  onChange,
  status,
  disabled = false,
  disabledMessage,
}: SettingSliderProps) {
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
      <div className="flex min-h-11 w-full items-center gap-3 sm:max-w-xs sm:justify-self-end">
        <input
          type="range"
          aria-label={label}
          aria-disabled={isDisabled}
          aria-describedby={statusDescriptionId}
          disabled={isDisabled}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            if (!isDisabled) onChange(Number(event.currentTarget.value));
          }}
          className="h-11 min-w-0 flex-1 accent-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:accent-subtle disabled:cursor-not-allowed"
        />
        <output className="min-w-12 text-right text-sm font-semibold text-foreground">
          {valueLabel ?? value}
        </output>
      </div>
    </SettingRow>
  );
}
