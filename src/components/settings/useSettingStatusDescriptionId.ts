import { useId } from 'react';

export default function useSettingStatusDescriptionId(
  status: 'active' | 'preview' | 'unavailable',
) {
  const id = useId();
  return status === 'active' ? undefined : id;
}
