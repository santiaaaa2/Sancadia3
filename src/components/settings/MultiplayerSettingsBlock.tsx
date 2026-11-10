import SettingButton from '@/components/settings/SettingButton';
import SettingSegmented from '@/components/settings/SettingSegmented';
import SettingSelect from '@/components/settings/SettingSelect';
import SettingSlider from '@/components/settings/SettingSlider';
import SettingToggle from '@/components/settings/SettingToggle';
import SettingValue from '@/components/settings/SettingValue';
import type { GameSettings, Settings } from '@/lib/settings';

interface MultiplayerSettingsBlockProps {
  settings: Settings;
  gameSettings?: GameSettings;
}

const rematchOptions = [
  { value: 'ask', label: 'Ask' },
  { value: 'accept', label: 'Always accept' },
  { value: 'decline', label: 'Always decline' },
];

const chatOptions = [
  { value: 'full-text', label: 'Full text (Not available in v1)', disabled: true },
  { value: 'preset-phrases', label: 'Preset phrases only (Recommended)' },
  { value: 'block-all', label: 'Block all chat' },
];

const friendRequestOptions = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'friends-of-friends', label: 'Friends of friends' },
  { value: 'no-one', label: 'No one' },
];

const regionOptions = [
  { value: 'any', label: 'Any' },
  { value: 'my-region-first', label: 'My region first' },
];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="mt-5 first:mt-0">
      <h3 className="mb-1 text-base font-bold text-foreground">{title}</h3>
      <div className="grid">{children}</div>
    </section>
  );
}

export default function MultiplayerSettingsBlock({
  settings,
  gameSettings,
}: MultiplayerSettingsBlockProps) {
  const noChange = () => undefined;
  const preview = 'preview' as const;
  const skillRange = gameSettings?.speedAndMode.opponentSkillRange ?? 200;

  return (
    <div>
      <Group title="Matchmaking & Privacy">
        <SettingSlider
          label="Skill-based filtering"
          description="Find opponents within this rating range. Requires an account."
          status={preview}
          min={50}
          max={500}
          step={50}
          value={skillRange}
          valueLabel={`±${skillRange}`}
          onChange={noChange}
        />
        <SettingToggle
          label="Let non-friends spectate"
          description="Allow non-friends to watch your matches. Requires an account."
          status={preview}
          checked={false}
          onChange={noChange}
        />
        <SettingToggle
          label="Let non-friends view my stats"
          description="Allow non-friends to view your stats. Requires an account."
          status={preview}
          checked={false}
          onChange={noChange}
        />
        <SettingToggle
          label="Let non-friends send random invites"
          description="Allow match invitations from non-friends. Requires an account."
          status={preview}
          checked={false}
          onChange={noChange}
        />
        <SettingSegmented
          label="Rematches"
          description="Choose how to handle a rematch request. Requires an account."
          status={preview}
          options={rematchOptions}
          value="ask"
          onChange={noChange}
        />
        <SettingSelect
          label="Region preference"
          description="Choose a preferred matchmaking region. Requires an account."
          status={preview}
          options={regionOptions}
          value="any"
          onChange={noChange}
        />
      </Group>

      <Group title="Communication & Social">
        <SettingSegmented
          label="Chat mode"
          description="Full text chat is not available in v1. Preset phrases are recommended."
          status={preview}
          options={chatOptions}
          value="preset-phrases"
          onChange={noChange}
        />
        <SettingToggle
          label="Mute emotes and reactions"
          description="Hide emotes and reactions from other players."
          status={preview}
          checked={false}
          onChange={noChange}
        />
        <SettingSelect
          label="Friend request permissions"
          description="Choose who can send you friend requests. Requires an account."
          status={preview}
          options={friendRequestOptions}
          value={settings.friendRequestPrivacy}
          onChange={noChange}
        />
      </Group>

      <Group title="Network & Fair Play">
        <SettingValue
          label="Disconnect auto-resign timer"
          description="A disconnected player automatically forfeits after this period."
          status={preview}
          value="60 seconds"
        />
        <SettingToggle
          label="Low-ping warning"
          description="Warn when a connection has high latency."
          status={preview}
          checked={false}
          onChange={noChange}
        />
        <SettingButton
          label="Report a player"
          description="Report misconduct. Requires an account."
          status={preview}
          onClick={noChange}
        />
        <SettingButton
          label="Blocked players list"
          description="View and manage blocked players. Requires an account."
          status={preview}
          onClick={noChange}
        />
      </Group>

      <Group title="Disconnect Recovery & Notifications">
        <SettingToggle
          label="Your turn push notifications"
          description="Get a push alert when it is your turn. Requires an account."
          status={preview}
          checked={settings.yourTurnAlerts}
          onChange={noChange}
        />
        <SettingToggle
          label="Email notifications"
          description="Get turn and match updates by email. Requires an account."
          status={preview}
          checked={settings.emailNotifications}
          onChange={noChange}
        />
        <SettingToggle
          label="Background connection keep-alive"
          description="Keep the connection active while the app is in the background."
          status={preview}
          checked={false}
          onChange={noChange}
        />
      </Group>
    </div>
  );
}
