import { useState } from 'react';
import Button from '@/components/Button';
import SettingButton from '@/components/settings/SettingButton';
import Dialog from '@/components/Dialog';
import { useSettings } from '@/hooks/useSettings';
import { useStats } from '@/hooks/useStats';
import type { SettingStatus } from '@/components/settings/SettingRow';

interface ResetDataCardProps {
  label?: string;
  description?: string;
  status?: SettingStatus;
}

export default function ResetDataCard({
  label = 'Reset all data',
  description = 'Clears your settings, scores, streaks and points.',
  status = 'active',
}: ResetDataCardProps) {
  const { resetSettings } = useSettings();
  const { resetStats } = useStats();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <SettingButton
        label={label}
        description={description}
        status={status}
        variant="danger"
        onClick={() => setConfirmOpen(true)}
      />
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Reset all data?"
        description="Your settings, scores, streaks and points will be cleared. This can't be undone."
      >
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              resetSettings();
              resetStats();
              setConfirmOpen(false);
            }}
          >
            Reset
          </Button>
        </div>
      </Dialog>
    </>
  );
}
