import { Check } from 'lucide-react';
import SettingRow, { type SettingStatus } from '@/components/settings/SettingRow';
import useSettingStatusDescriptionId from '@/components/settings/useSettingStatusDescriptionId';
import { themes } from '@/theme/themes';

interface SettingThemePickerProps {
  value: string;
  onChange: (themeId: string) => void;
  status: SettingStatus;
  label?: string;
  description?: string;
  disabled?: boolean;
  disabledMessage?: string;
}

const swatchTokens = ['background', 'primary', 'accent', 'board-light', 'board-dark'] as const;

export default function SettingThemePicker({
  value,
  onChange,
  status,
  label = 'Theme',
  description = 'Apply a color theme across the arcade.',
  disabled = false,
  disabledMessage,
}: SettingThemePickerProps) {
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
      <div
        role="radiogroup"
        aria-label={label}
        aria-disabled={isDisabled}
        className="grid w-full grid-cols-3 gap-2 sm:max-w-xs sm:justify-self-end"
      >
        {themes.map((theme) => {
          const selected = value === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-label={theme.name}
              aria-checked={selected}
              aria-disabled={isDisabled}
              aria-describedby={statusDescriptionId}
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) onChange(theme.id);
              }}
              className={`grid min-h-11 min-w-0 content-center justify-items-center gap-1 rounded-xl px-1 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:cursor-not-allowed ${
                selected && !isDisabled
                  ? 'bg-primary-soft text-primary ring-2 ring-primary'
                  : 'bg-background text-subtle ring-1 ring-border'
              }`}
            >
              <span className="flex items-center gap-1" aria-hidden="true">
                {swatchTokens.map((token) => (
                  <span
                    key={token}
                    className="h-3 w-3 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: theme.tokens[token] }}
                  />
                ))}
              </span>
              <span className="flex min-w-0 max-w-full items-center gap-1">
                {selected && <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{theme.name}</span>
              </span>
            </button>
          );
        })}
      </div>
    </SettingRow>
  );
}
