import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SettingsProvider from '@/components/SettingsProvider';
import SettingButton from '@/components/settings/SettingButton';
import SettingSegmented from '@/components/settings/SettingSegmented';
import SettingSelect from '@/components/settings/SettingSelect';
import SettingSlider from '@/components/settings/SettingSlider';
import SettingToggle from '@/components/settings/SettingToggle';

const options = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
];

describe('shared setting controls', () => {
  it.each(['active', 'preview'] as const)('renders the toggle in %s mode', async (status) => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SettingToggle label="Example toggle" checked={false} onChange={onChange} status={status} />,
    );

    const toggle = screen.getByRole('switch', { name: 'Example toggle' });
    expect(toggle.getAttribute('aria-disabled')).toBe(String(status === 'preview'));
    expect(toggle.getAttribute('disabled') !== null).toBe(status === 'preview');
    expect(screen.queryByText('Coming soon') !== null).toBe(status === 'preview');
    await user.click(toggle);
    expect(onChange).toHaveBeenCalledTimes(status === 'active' ? 1 : 0);
  });

  it.each(['active', 'preview'] as const)('renders the select in %s mode', async (status) => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SettingSelect
        label="Example select"
        value="one"
        options={options}
        onChange={onChange}
        status={status}
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Example select' }) as HTMLSelectElement;
    expect(select.disabled).toBe(status === 'preview');
    expect(select.getAttribute('aria-disabled')).toBe(String(status === 'preview'));
    expect(screen.queryByText('Coming soon') !== null).toBe(status === 'preview');
    await user.selectOptions(select, 'two');
    expect(onChange).toHaveBeenCalledTimes(status === 'active' ? 1 : 0);
  });

  it.each(['active', 'preview'] as const)('renders the slider in %s mode', (status) => {
    const onChange = vi.fn();
    render(
      <SettingSlider
        label="Example slider"
        value={2}
        min={0}
        max={4}
        onChange={onChange}
        status={status}
      />,
    );

    const slider = screen.getByRole('slider', { name: 'Example slider' }) as HTMLInputElement;
    expect(slider.disabled).toBe(status === 'preview');
    expect(slider.getAttribute('aria-disabled')).toBe(String(status === 'preview'));
    expect(screen.queryByText('Coming soon') !== null).toBe(status === 'preview');
    fireEvent.change(slider, { target: { value: '3' } });
    expect(onChange).toHaveBeenCalledTimes(status === 'active' ? 1 : 0);
  });

  it.each(['active', 'preview'] as const)(
    'renders segmented control in %s mode',
    async (status) => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SettingSegmented
          label="Example segmented"
          value="one"
          options={options}
          onChange={onChange}
          status={status}
        />,
      );

      const secondOption = screen.getByRole('radio', { name: 'Two' });
      expect(secondOption.getAttribute('aria-disabled')).toBe(String(status === 'preview'));
      expect(secondOption.getAttribute('disabled') !== null).toBe(status === 'preview');
      expect(screen.queryByText('Coming soon') !== null).toBe(status === 'preview');
      await user.click(secondOption);
      expect(onChange).toHaveBeenCalledTimes(status === 'active' ? 1 : 0);
    },
  );

  it.each(['active', 'preview'] as const)('renders the button in %s mode', async (status) => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <SettingsProvider>
        <SettingButton label="Example action" onClick={onClick} status={status} />
      </SettingsProvider>,
    );

    const button = screen.getByRole('button', { name: 'Example action' });
    expect(button.getAttribute('aria-disabled')).toBe(String(status === 'preview'));
    expect(button.getAttribute('disabled') !== null).toBe(status === 'preview');
    expect(screen.queryByText('Coming soon') !== null).toBe(status === 'preview');
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(status === 'active' ? 1 : 0);
  });
});
