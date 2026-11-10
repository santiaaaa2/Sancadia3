import { useEffect, useState } from 'react';
import SettingButton from '@/components/settings/SettingButton';
import type { SettingStatus } from '@/components/settings/SettingRow';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallAppButtonProps {
  label?: string;
  description?: string;
  status?: SettingStatus;
}

export default function InstallAppButton({
  label = 'Install app',
  description,
  status = 'active',
}: InstallAppButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && navigator.standalone === true);
    if (installed) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  return (
    <SettingButton
      label={label}
      description={
        description ??
        (installPrompt ? 'Add the arcade to your device.' : 'Installation is not available here.')
      }
      status={status}
      disabled={!installPrompt}
      onClick={async () => {
        if (!installPrompt) return;
        await installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
      }}
    />
  );
}
