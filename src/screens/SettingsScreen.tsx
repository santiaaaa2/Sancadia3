import ScreenHeader from '@/components/ScreenHeader';
import InstallAppButton from '@/components/settings/InstallAppButton';
import NationList from '@/components/settings/NationList';
import ResetDataCard from '@/components/settings/ResetDataCard';
import SettingButton from '@/components/settings/SettingButton';
import SettingSegmented from '@/components/settings/SettingSegmented';
import SettingSelect from '@/components/settings/SettingSelect';
import SettingSlider from '@/components/settings/SettingSlider';
import SettingTextInput from '@/components/settings/SettingTextInput';
import SettingThemePicker from '@/components/settings/SettingThemePicker';
import SettingToggle from '@/components/settings/SettingToggle';
import SettingValue from '@/components/settings/SettingValue';
import MultiplayerSettingsBlock from '@/components/settings/MultiplayerSettingsBlock';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingRow from '@/components/settings/SettingRow';
import { isNationId } from '@/games/nations';
import { supportsVibration } from '@/hooks/useFeedback';
import { useSettings } from '@/hooks/useSettings';
import type { Settings } from '@/lib/settings';
import {
  settingsSections,
  type SettingsRow as SettingsRowDefinition,
} from '@/screens/settings/sections';
import { themes } from '@/theme/themes';

type ToggleKey = Extract<SettingsRowDefinition, { type: 'toggle' }>['key'];

function isSettingValue<K extends keyof Settings>(
  key: K,
  value: string,
): value is Settings[K] & string {
  switch (key) {
    case 'language':
      return value === 'en' || value === 'es' || value === 'fr' || value === 'zh';
    case 'screenOrientation':
      return value === 'auto' || value === 'portrait' || value === 'landscape';
    case 'friendRequestPrivacy':
      return value === 'everyone' || value === 'friends-of-friends' || value === 'no-one';
    case 'graphicsQuality':
      return value === 'high' || value === 'medium' || value === 'battery-saver';
    case 'difficulty':
      return value === 'beginner' || value === 'professional' || value === 'expert';
    case 'animationSpeed':
      return value === 'off' || value === 'slow' || value === 'normal' || value === 'fast';
    default:
      return false;
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not set';
  return String(value);
}

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();

  const updateToggle = (key: ToggleKey, checked: boolean) => {
    const patch: Partial<Settings> = { [key]: checked };
    updateSettings(patch);
  };

  const renderRow = (row: SettingsRowDefinition, rowKey: string) => {
    switch (row.type) {
      case 'multiplayer':
        return <MultiplayerSettingsBlock key={rowKey} settings={settings} />;
      case 'nation-list':
        return <NationList key={rowKey} selected={settings.nation} />;
      case 'theme':
        return (
          <SettingThemePicker
            key={rowKey}
            status={row.status}
            value={settings.themeId}
            onChange={(value) => {
              const theme = themes.find((item) => item.id === value);
              if (theme) updateSettings({ themeId: theme.id });
            }}
          />
        );
      case 'select':
        return (
          <SettingSelect
            key={rowKey}
            label={row.label}
            description={row.description}
            status={row.status}
            options={row.options}
            value={String(settings[row.key])}
            onChange={(value) => {
              if (row.key === 'nation') {
                if (isNationId(value)) updateSettings({ nation: value });
              } else if (isSettingValue(row.key, value)) {
                updateSettings({ [row.key]: value });
              }
            }}
          />
        );
      case 'segmented':
        return (
          <SettingSegmented
            key={rowKey}
            label={row.label}
            description={row.description}
            status={row.status}
            options={row.options}
            value={String(settings[row.key])}
            onChange={(value) => {
              if (isSettingValue(row.key, value)) {
                updateSettings({ [row.key]: value });
              }
            }}
          />
        );
      case 'toggle':
        if (row.key === 'vibrationEnabled' && !supportsVibration()) {
          return (
            <SettingRow
              key={rowKey}
              label={row.label}
              description="Vibration is not supported by this browser."
              status={row.status}
            >
              <span aria-hidden="true" />
            </SettingRow>
          );
        }
        return (
          <SettingToggle
            key={rowKey}
            label={row.label}
            description={row.description}
            status={row.status}
            checked={settings[row.key]}
            onChange={(checked) => updateToggle(row.key, checked)}
          />
        );
      case 'slider':
        return (
          <SettingSlider
            key={rowKey}
            label={row.label}
            description={row.description}
            status={row.status}
            min={row.min}
            max={row.max}
            step={row.step}
            value={settings[row.key]}
            valueLabel={`${Math.round(settings[row.key] * 100)}%`}
            onChange={(value) => updateSettings({ [row.key]: value })}
          />
        );
      case 'text':
        return (
          <SettingTextInput
            key={rowKey}
            label={row.label}
            description={row.description}
            status={row.status}
            placeholder={row.placeholder}
            value={settings[row.key]}
            onChange={(value) => updateSettings({ [row.key]: value })}
          />
        );
      case 'value':
        return (
          <SettingValue
            key={rowKey}
            label={row.label}
            description={row.description}
            status={row.status}
            value={row.value ?? formatValue(settings[row.key])}
          />
        );
      case 'action':
        if (row.id === 'install-app') {
          return (
            <InstallAppButton
              key={rowKey}
              label={row.label}
              description={row.description}
              status={row.status}
            />
          );
        }
        if (row.id === 'reset-data') {
          return (
            <ResetDataCard
              key={rowKey}
              label={row.label}
              description={row.description}
              status={row.status}
            />
          );
        }
        return (
          <SettingButton
            key={rowKey}
            label={row.label}
            description={row.description}
            status={row.status}
            onClick={() => undefined}
          />
        );
    }
  };

  return (
    <>
      <ScreenHeader
        title="Settings"
        backTo="/"
        className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 backdrop-blur"
      />
      <div className="grid gap-3 pb-4">
        {settingsSections.map((section, index) => (
          <SettingsSection
            key={section.id}
            title={section.title}
            description={section.description}
            open={index === 0}
          >
            <div className="grid">
              {section.rows.map((row, rowIndex) => renderRow(row, `${section.id}-${rowIndex}`))}
            </div>
          </SettingsSection>
        ))}
      </div>
    </>
  );
}
