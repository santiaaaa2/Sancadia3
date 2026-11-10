import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Button from '@/components/Button';
import ScreenHeader from '@/components/ScreenHeader';
import Dialog from '@/components/Dialog';
import SettingButton from '@/components/settings/SettingButton';
import SettingSegmented from '@/components/settings/SettingSegmented';
import SettingSelect, { type SettingOption } from '@/components/settings/SettingSelect';
import SettingSlider from '@/components/settings/SettingSlider';
import SettingThemePicker from '@/components/settings/SettingThemePicker';
import SettingToggle from '@/components/settings/SettingToggle';
import SettingsSection from '@/components/settings/SettingsSection';
import MultiplayerSettingsBlock from '@/components/settings/MultiplayerSettingsBlock';
import { games } from '@/games/registry';
import { useSettings } from '@/hooks/useSettings';
import { difficultyOptions } from '@/lib/difficultyOptions';
import {
  DEFAULT_GAME_SETTINGS,
  type AnimationSpeed,
  type GameChatMode,
  type GameSettings,
  type GameTimeControl,
  type GameplayStyle,
} from '@/lib/settings';
import { themes } from '@/theme/themes';

const realTimeOptions: SettingOption[] = [
  { value: '1-minute', label: '1 minute' },
  { value: '3-minutes', label: '3 minutes' },
  { value: '5-minutes', label: '5 minutes' },
  { value: '15-minutes', label: '15 minutes' },
];

const asynchronousOptions: SettingOption[] = [
  { value: '1-day', label: '1 day per move' },
  { value: '3-days', label: '3 days per move' },
  { value: '7-days', label: '7 days per move' },
];

const animationOptions: SettingOption[] = [
  { value: 'off', label: 'Off' },
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
];

const defaultModeOptions: SettingOption[] = [
  { value: 'computer', label: 'vs Computer' },
  { value: 'two-player', label: '2 Players' },
];

const chatModeOptions: SettingOption[] = [
  { value: 'preset-reactions', label: 'Preset reactions only' },
  { value: 'mute', label: 'Mute' },
];

function isDifficulty(value: string) {
  return value === 'beginner' || value === 'professional' || value === 'expert';
}

function isGameplayStyle(value: string): value is GameplayStyle {
  return value === 'real-time' || value === 'asynchronous';
}

function isTimeControl(value: string): value is GameTimeControl {
  return ['1-minute', '3-minutes', '5-minutes', '15-minutes', '1-day', '3-days', '7-days'].includes(
    value,
  );
}

function isAnimationSpeed(value: string): value is AnimationSpeed {
  return value === 'off' || value === 'slow' || value === 'normal' || value === 'fast';
}

function isChatMode(value: string): value is GameChatMode {
  return value === 'preset-reactions' || value === 'mute';
}

function globalDefaultsMessage(useGlobalDefaults: boolean) {
  return useGlobalDefaults ? 'Using global defaults.' : undefined;
}

export default function GameSettingsScreen() {
  const { gameId } = useParams();
  const game = games.find((item) => item.id === gameId);
  const { settings, updateGameSettings, resetGameSettings } = useSettings();
  const [resetOpen, setResetOpen] = useState(false);

  if (!game || game.status !== 'available') return <Navigate to="/games" replace />;

  const gameSettings = settings.gameSettings[game.id] ?? DEFAULT_GAME_SETTINGS;
  const { speedAndMode, rules, visuals, communication } = gameSettings;

  const updateSpeed = (patch: Partial<GameSettings['speedAndMode']>) =>
    updateGameSettings(game.id, {
      ...gameSettings,
      speedAndMode: { ...speedAndMode, ...patch },
    });
  const updateRules = (patch: Partial<GameSettings['rules']>) =>
    updateGameSettings(game.id, { ...gameSettings, rules: { ...rules, ...patch } });
  const updateVisuals = (patch: Partial<GameSettings['visuals']>) =>
    updateGameSettings(game.id, { ...gameSettings, visuals: { ...visuals, ...patch } });
  const updateCommunication = (patch: Partial<GameSettings['communication']>) =>
    updateGameSettings(game.id, {
      ...gameSettings,
      communication: { ...communication, ...patch },
    });

  const selectedTimeOptions =
    speedAndMode.gameplayStyle === 'real-time' ? realTimeOptions : asynchronousOptions;
  const timeControlAvailable =
    speedAndMode.gameplayStyle === 'asynchronous' || game.capabilities.isRealTimeCapable;
  const timeControlValue = selectedTimeOptions.some(
    (option) => option.value === speedAndMode.timeControl,
  )
    ? speedAndMode.timeControl
    : speedAndMode.gameplayStyle === 'real-time'
      ? '5-minutes'
      : '3-days';
  const variantOptions: SettingOption[] = game.capabilities.hasVariants
    ? [
        { value: 'american', label: 'American' },
        { value: 'italian', label: 'Italian (Coming soon)', disabled: true },
        { value: 'international', label: 'International (Coming soon)', disabled: true },
      ]
    : [{ value: 'standard', label: 'Standard only' }];
  const modeOptions = defaultModeOptions.map((option) => ({
    ...option,
    disabled: option.value === 'two-player' && game.maxPlayers < 2,
  }));
  const visualsGlobal = visuals.useGlobalDefaults;
  const speedGlobal = speedAndMode.useGlobalDefaults;
  const rulesGlobal = rules.useGlobalDefaults;
  const communicationGlobal = communication.useGlobalDefaults;

  return (
    <>
      <ScreenHeader title={`${game.name} Settings`} backTo={`/games/${game.id}`} />
      <div className="grid gap-3 pb-4">
        <SettingsSection title="Speed & Mode" open>
          <div className="grid">
            <SettingToggle
              label="Use global defaults for Speed & Mode"
              description="Use arcade-wide gameplay preferences."
              status="active"
              checked={speedGlobal}
              onChange={(checked) => updateSpeed({ useGlobalDefaults: checked })}
            />
            <SettingSelect
              label="Gameplay style"
              description="Choose real-time or turn-based play."
              status="preview"
              options={[
                {
                  value: 'real-time',
                  label: 'Real-time',
                  disabled: !game.capabilities.isRealTimeCapable,
                },
                { value: 'asynchronous', label: 'Asynchronous' },
              ]}
              value={speedAndMode.gameplayStyle}
              onChange={(value) => {
                if (!isGameplayStyle(value)) return;
                updateSpeed({
                  gameplayStyle: value,
                  timeControl: value === 'real-time' ? '5-minutes' : '3-days',
                });
              }}
              disabled={speedGlobal}
              disabledMessage={
                globalDefaultsMessage(speedGlobal) ??
                (!game.capabilities.isRealTimeCapable
                  ? 'Real-time is not available for this game.'
                  : undefined)
              }
            />
            <SettingSelect
              label="Time control"
              description={
                speedAndMode.gameplayStyle === 'real-time'
                  ? 'Choose the match clock.'
                  : 'Choose the time allowed for each move.'
              }
              status={timeControlAvailable ? 'preview' : 'unavailable'}
              options={selectedTimeOptions}
              value={timeControlValue}
              onChange={(value) => {
                if (isTimeControl(value)) updateSpeed({ timeControl: value });
              }}
              disabled={speedGlobal}
              disabledMessage={globalDefaultsMessage(speedGlobal)}
            />
            <SettingSlider
              label="Increment per move in seconds"
              description="Add this many seconds after each move."
              status={game.capabilities.isRealTimeCapable ? 'preview' : 'unavailable'}
              min={0}
              max={120}
              step={5}
              value={speedAndMode.incrementSeconds}
              valueLabel={`${speedAndMode.incrementSeconds} sec`}
              onChange={(value) => updateSpeed({ incrementSeconds: value })}
              disabled={speedGlobal}
              disabledMessage={globalDefaultsMessage(speedGlobal)}
            />
            <SettingSlider
              label="Opponent skill range"
              description="Search for opponents within this range of my rating."
              status="preview"
              min={50}
              max={500}
              step={50}
              value={speedAndMode.opponentSkillRange}
              valueLabel={`±${speedAndMode.opponentSkillRange}`}
              onChange={(value) => updateSpeed({ opponentSkillRange: value })}
              disabled={speedGlobal}
              disabledMessage={globalDefaultsMessage(speedGlobal)}
            />
            <SettingSegmented
              label="Default difficulty for this game"
              description="Choose the computer opponent difficulty."
              status="active"
              options={difficultyOptions}
              value={speedGlobal ? settings.difficulty : speedAndMode.difficulty}
              onChange={(value) => {
                if (isDifficulty(value)) updateSpeed({ difficulty: value });
              }}
              disabled={speedGlobal}
              disabledMessage={globalDefaultsMessage(speedGlobal)}
            />
            <SettingSegmented
              label="Default mode"
              description="Choose the default player setup."
              status="active"
              options={modeOptions}
              value={speedGlobal ? 'computer' : speedAndMode.defaultMode}
              onChange={(value) => {
                if (value === 'computer' || value === 'two-player') {
                  updateSpeed({ defaultMode: value });
                }
              }}
              disabled={speedGlobal}
              disabledMessage={
                speedGlobal
                  ? globalDefaultsMessage(speedGlobal)
                  : game.maxPlayers < 2
                    ? '2 Players is not available for this game.'
                    : undefined
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Rules & Variations">
          <div className="grid">
            <SettingToggle
              label="Use global defaults for Rules & Variations"
              description="Use the standard settings for rules and variations."
              status="active"
              checked={rulesGlobal}
              onChange={(checked) => updateRules({ useGlobalDefaults: checked })}
            />
            <SettingSelect
              label="Variant"
              description={
                game.capabilities.hasVariants
                  ? 'American rules are available; other variants are in preview.'
                  : 'Standard only.'
              }
              status={game.capabilities.hasVariants ? 'active' : 'unavailable'}
              options={variantOptions}
              value={game.capabilities.hasVariants ? rules.variant : 'standard'}
              onChange={(value) => updateRules({ variant: value })}
              disabled={rulesGlobal}
              disabledMessage={globalDefaultsMessage(rulesGlobal)}
            />
            <SettingToggle
              label="Board setup / handicap mode"
              description="Set a custom starting position."
              status={game.capabilities.hasHandicap ? 'preview' : 'unavailable'}
              checked={rules.handicapMode}
              onChange={(checked) => updateRules({ handicapMode: checked })}
              disabled={rulesGlobal}
              disabledMessage={globalDefaultsMessage(rulesGlobal)}
            />
            <SettingToggle
              label="Draw rules"
              description="Configure how drawn games are handled."
              status={game.capabilities.hasDrawRules ? 'preview' : 'unavailable'}
              checked={rules.drawRules}
              onChange={(checked) => updateRules({ drawRules: checked })}
              disabled={rulesGlobal}
              disabledMessage={globalDefaultsMessage(rulesGlobal)}
            />
            <SettingToggle
              label="Allow undo"
              description="Allow undoing a move during play."
              status="preview"
              checked={rules.allowUndo}
              onChange={(checked) => updateRules({ allowUndo: checked })}
              disabled={rulesGlobal}
              disabledMessage={globalDefaultsMessage(rulesGlobal)}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Visuals & Ergonomics">
          <div className="grid">
            <SettingToggle
              label="Use global defaults for Visuals & Ergonomics"
              description="Use arcade-wide visual preferences."
              status="active"
              checked={visualsGlobal}
              onChange={(checked) => updateVisuals({ useGlobalDefaults: checked })}
            />
            <SettingThemePicker
              label="Board skin"
              description="Choose a board color theme."
              status="preview"
              value={visualsGlobal ? settings.themeId : visuals.boardSkin}
              onChange={(value) => {
                const theme = themes.find((item) => item.id === value);
                if (theme) updateVisuals({ boardSkin: theme.id });
              }}
              disabled={visualsGlobal}
              disabledMessage={globalDefaultsMessage(visualsGlobal)}
            />
            <SettingThemePicker
              label="Piece style"
              description="Choose a piece color theme."
              status="preview"
              value={visualsGlobal ? settings.themeId : visuals.pieceStyle}
              onChange={(value) => {
                const theme = themes.find((item) => item.id === value);
                if (theme) updateVisuals({ pieceStyle: theme.id });
              }}
              disabled={visualsGlobal}
              disabledMessage={globalDefaultsMessage(visualsGlobal)}
            />
            <SettingToggle
              label="Legal move highlights"
              description="Highlight available moves on the board."
              status="preview"
              checked={
                visualsGlobal ? settings.showLegalMoveHighlights : visuals.legalMoveHighlights
              }
              onChange={(checked) => updateVisuals({ legalMoveHighlights: checked })}
              disabled={visualsGlobal}
              disabledMessage={globalDefaultsMessage(visualsGlobal)}
            />
            <SettingToggle
              label="Last move indicator"
              description="Mark the most recent move."
              status="preview"
              checked={visualsGlobal ? settings.showLastMoveMarker : visuals.lastMoveIndicator}
              onChange={(checked) => updateVisuals({ lastMoveIndicator: checked })}
              disabled={visualsGlobal}
              disabledMessage={globalDefaultsMessage(visualsGlobal)}
            />
            <SettingToggle
              label="Threat warnings"
              description="Show warnings about possible threats."
              status="preview"
              checked={visuals.threatWarnings}
              onChange={(checked) => updateVisuals({ threatWarnings: checked })}
              disabled={visualsGlobal}
              disabledMessage={globalDefaultsMessage(visualsGlobal)}
            />
            <SettingToggle
              label="Auto-flip board for local 2-player"
              description="Rotate the board for the next local player."
              status="preview"
              checked={visualsGlobal ? settings.autoFlipBoard : visuals.autoFlipBoard}
              onChange={(checked) => updateVisuals({ autoFlipBoard: checked })}
              disabled={visualsGlobal}
              disabledMessage={globalDefaultsMessage(visualsGlobal)}
            />
            <SettingSegmented
              label="Animation speed"
              description="Choose how quickly animations play."
              status="preview"
              options={animationOptions}
              value={visualsGlobal ? settings.animationSpeed : visuals.animationSpeed}
              onChange={(value) => {
                if (isAnimationSpeed(value)) updateVisuals({ animationSpeed: value });
              }}
              disabled={visualsGlobal}
              disabledMessage={globalDefaultsMessage(visualsGlobal)}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Communication & Etiquette">
          <div className="grid">
            <SettingToggle
              label="Use global defaults for Communication & Etiquette"
              description="Use arcade-wide communication preferences."
              status="active"
              checked={communicationGlobal}
              onChange={(checked) => updateCommunication({ useGlobalDefaults: checked })}
            />
            <SettingToggle
              label="Submit move confirmation"
              description="Confirm a move before submitting it."
              status="preview"
              checked={communicationGlobal ? settings.confirmMove : communication.confirmMove}
              onChange={(checked) => updateCommunication({ confirmMove: checked })}
              disabled={communicationGlobal}
              disabledMessage={globalDefaultsMessage(communicationGlobal)}
            />
            <SettingSegmented
              label="In-game chat"
              description="Choose preset reactions or mute chat."
              status="preview"
              options={chatModeOptions}
              value={communication.chatMode}
              onChange={(value) => {
                if (isChatMode(value)) updateCommunication({ chatMode: value });
              }}
              disabled={communicationGlobal}
              disabledMessage={globalDefaultsMessage(communicationGlobal)}
            />
            <SettingToggle
              label="Free-text chat"
              description="Not available in v1"
              status="preview"
              checked={false}
              onChange={() => undefined}
              disabled
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Multiplayer">
          <MultiplayerSettingsBlock settings={settings} gameSettings={gameSettings} />
        </SettingsSection>

        <SettingButton
          label="Reset this game's settings"
          description="Restore this game's settings to their defaults."
          status="active"
          variant="danger"
          onClick={() => setResetOpen(true)}
        />
      </div>
      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset this game's settings?"
        description={`Settings for ${game.name} will be cleared and global defaults will be used.`}
      >
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              resetGameSettings(game.id);
              setResetOpen(false);
            }}
          >
            Reset
          </Button>
        </div>
      </Dialog>
    </>
  );
}
