import { useState, type ReactNode } from 'react';
import { BookOpen, Cpu, History, Settings2, Shield, Swords } from 'lucide-react';
import Button from '@/components/Button';
import SegmentedControl from '@/components/SegmentedControl';
import { useSettings } from '@/hooks/useSettings';
import type { Difficulty } from '@/engine/difficulty';
import type { MatchConfig } from '@/games/matchConfig';
import LatrunculiMatch from '@/games/latrunculi/LatrunculiMatch';

type MenuPanel = 'computer' | 'instructions' | 'history' | 'settings' | null;
type BoardSide = 'first' | 'second';

const difficultyOptions = [
  { value: 'beginner' as const, label: 'Recruit' },
  { value: 'professional' as const, label: 'Centurion' },
  { value: 'expert' as const, label: 'General' },
];

function MenuButton({
  icon,
  children,
  onClick,
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      variant="secondary"
      className="latrunculi-menu-button w-full justify-start text-left"
      onClick={onClick}
    >
      {icon}
      {children}
    </Button>
  );
}

function PreferenceSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-4 rounded-xl border border-[#806b4e] bg-[#f2e7d2] px-4 py-3 text-left font-semibold text-[#34291e] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9a4332]/40"
    >
      {label}
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#526f61]' : 'bg-[#847763]'
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

function LatrunculiMainMenu({ onStart }: { onStart: (config: MatchConfig) => void }) {
  const { settings, updateSettings } = useSettings();
  const [panel, setPanel] = useState<MenuPanel>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(settings.difficulty);
  const [side, setSide] = useState<BoardSide>('first');

  const startComputerBattle = () =>
    onStart({ mode: 'computer', humanFirst: side === 'first', difficulty });
  const setAnimations = (enabled: boolean) =>
    updateSettings({ animationSpeed: enabled ? 'normal' : 'off' });

  return (
    <div className="latrunculi-menu flex flex-1 flex-col items-center justify-center gap-5 p-4 sm:p-8">
      <header className="w-full max-w-lg text-center">
        <div className="latrunculi-emblem mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <span aria-hidden="true">I · II</span>
        </div>
        <h1 className="font-serif text-4xl font-bold tracking-[0.16em] sm:text-5xl">LATRUNCULI</h1>
        <p className="mt-2 text-sm font-semibold tracking-[0.25em]">LUDUS LATRUNCULORUM</p>
        <p className="mt-3 font-serif text-lg italic">The Ancient Roman Game of Strategy.</p>
      </header>

      <section className="latrunculi-menu-panel grid w-full max-w-lg gap-3 p-4 sm:p-6">
        <h2 className="sr-only">Main menu</h2>
        <MenuButton
          icon={<Swords aria-hidden="true" />}
          onClick={() => onStart({ mode: 'two-player' })}
        >
          LOCAL BATTLE
        </MenuButton>
        <MenuButton icon={<Cpu aria-hidden="true" />} onClick={() => setPanel('computer')}>
          BATTLE AGAINST THE COMPUTER
        </MenuButton>
        <MenuButton icon={<BookOpen aria-hidden="true" />} onClick={() => setPanel('instructions')}>
          HOW TO PLAY
        </MenuButton>
        <MenuButton icon={<Settings2 aria-hidden="true" />} onClick={() => setPanel('settings')}>
          GAME SETTINGS
        </MenuButton>
        <MenuButton icon={<History aria-hidden="true" />} onClick={() => setPanel('history')}>
          HISTORICAL BACKGROUND
        </MenuButton>
      </section>

      {panel && (
        <section
          className="latrunculi-menu-panel grid w-full max-w-lg gap-4 p-4 sm:p-6"
          aria-labelledby="latrunculi-panel-title"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#8e3b2e]" aria-hidden="true" />
            <h2 id="latrunculi-panel-title" className="font-serif text-xl font-bold">
              {panel === 'computer' && 'Choose your opponent'}
              {panel === 'instructions' && 'How to play'}
              {panel === 'history' && 'Historical background'}
              {panel === 'settings' && 'Game settings'}
            </h2>
          </div>

          {panel === 'computer' && (
            <>
              <p className="text-sm leading-relaxed">
                Choose the strength of the opposing army and the side you command.
              </p>
              <SegmentedControl
                label="Computer difficulty"
                options={difficultyOptions}
                value={difficulty}
                onChange={setDifficulty}
              />
              <SegmentedControl
                label="Army"
                options={[
                  { value: 'first', label: 'Red · First' },
                  { value: 'second', label: 'Blue · Second' },
                ]}
                value={side}
                onChange={setSide}
              />
              <Button className="w-full" onClick={startComputerBattle}>
                Begin computer battle
              </Button>
            </>
          )}

          {panel === 'instructions' && (
            <div className="grid gap-3 text-sm leading-relaxed">
              <p>
                <strong>Movement:</strong> Select a stone, then move it any clear distance in a
                straight row or column. Stones cannot jump or move diagonally.
              </p>
              <p>
                <strong>Capture:</strong> Trap an opposing stone between the stone you just moved
                and another friendly stone, horizontally or vertically. One move may capture more
                than one stone; diagonal trapping does not count.
              </p>
              <p>
                <strong>Victory:</strong> Win by leaving the opposing army with no legal move or no
                surviving stones. A player may also resign. The default game draws after 200 moves.
              </p>
            </div>
          )}

          {panel === 'history' && (
            <div className="grid gap-3 text-sm leading-relaxed">
              <p>
                LATRUNCULI, also called <em>ludus latrunculorum</em>, was a strategy game known in
                ancient Rome. Literary references and archaeological boards attest to the game’s
                presence, but they do not establish one universally agreed set of rules.
              </p>
              <p>
                This app presents a historically inspired reconstruction: two armies maneuver on a
                square board and capture by custodial enclosure. The exact ancient rules remain
                uncertain, so this is one playable interpretation rather than a definitive account.
              </p>
            </div>
          )}

          {panel === 'settings' && (
            <div className="grid gap-3">
              <PreferenceSwitch
                label="Sound effects"
                checked={settings.soundEnabled}
                onChange={(soundEnabled) => updateSettings({ soundEnabled })}
              />
              <PreferenceSwitch
                label="Board animations"
                checked={settings.animationSpeed !== 'off'}
                onChange={setAnimations}
              />
              <div className="grid gap-2">
                <p className="text-sm font-semibold">Default computer difficulty</p>
                <SegmentedControl
                  label="Default computer difficulty"
                  options={difficultyOptions}
                  value={settings.difficulty}
                  onChange={(difficulty) => {
                    updateSettings({ difficulty });
                    setDifficulty(difficulty);
                  }}
                />
              </div>
              <PreferenceSwitch
                label="Show legal move highlights"
                checked={settings.showLegalMoveHighlights}
                onChange={(showLegalMoveHighlights) => updateSettings({ showLegalMoveHighlights })}
              />
              <PreferenceSwitch
                label="Show last move marker"
                checked={settings.showLastMoveMarker}
                onChange={(showLastMoveMarker) => updateSettings({ showLastMoveMarker })}
              />
              <PreferenceSwitch
                label="Show board coordinates"
                checked={settings.showBoardCoordinates}
                onChange={(showBoardCoordinates) => updateSettings({ showBoardCoordinates })}
              />
            </div>
          )}

          <Button variant="secondary" className="w-full" onClick={() => setPanel(null)}>
            Back to main menu
          </Button>
        </section>
      )}
      <footer className="text-center text-xs tracking-wide text-[#68573f]">
        A historically inspired reconstruction · Italy
      </footer>
    </div>
  );
}

export default function LatrunculiGame() {
  const [config, setConfig] = useState<MatchConfig | null>(null);
  if (!config) return <LatrunculiMainMenu onStart={setConfig} />;
  return <LatrunculiMatch config={config} onReturnToMenu={() => setConfig(null)} />;
}
