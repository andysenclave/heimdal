import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodexScreenStrip } from '../CodexScreenStrip';
import { CodexDialogProvider } from '../CodexDialogProvider';

const screens = [
  { id: 's1', slug: 'home', name: 'Home' },
  { id: 's2', slug: 'settings', name: 'Settings' },
  { id: 's3', slug: 'profile', name: 'Profile' },
];

function renderStrip(overrides = {}) {
  const defaults = {
    screens,
    activeId: null as string | null,
    onSelect: vi.fn(),
    onAddScreen: vi.fn(),
    onDelete: vi.fn(),
    onReorder: vi.fn(),
    isDraft: true,
  };
  const props = { ...defaults, ...overrides };
  return render(
    <CodexDialogProvider>
      <CodexScreenStrip {...props} />
    </CodexDialogProvider>,
  );
}

describe('CodexScreenStrip', () => {
  it('renders all screen names', () => {
    renderStrip();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('calls onSelect when a screen pill is clicked', () => {
    const onSelect = vi.fn();
    renderStrip({ onSelect });
    fireEvent.click(screen.getByText('Settings'));
    expect(onSelect).toHaveBeenCalledWith('s2');
  });

  it('opens the add screen dialog when add button is clicked', () => {
    renderStrip();
    fireEvent.click(screen.getByText('Screen'));
    expect(screen.getByText('New Screen')).toBeInTheDocument();
  });

  it('disables the add button when not in draft mode', () => {
    renderStrip({ isDraft: false });
    const addBtn = screen.getByText('Screen').closest('button');
    expect(addBtn).toBeDisabled();
  });
});
