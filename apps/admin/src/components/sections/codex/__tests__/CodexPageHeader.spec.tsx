import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodexPageHeader } from '../CodexPageHeader';

describe('CodexPageHeader', () => {
  it('renders the page title and subtitle', () => {
    render(<CodexPageHeader showHistory={false} onToggleHistory={vi.fn()} />);
    expect(screen.getByText('Codex')).toBeInTheDocument();
    expect(screen.getByText(/Content management/)).toBeInTheDocument();
  });

  it('shows "Version History" when history is hidden', () => {
    render(<CodexPageHeader showHistory={false} onToggleHistory={vi.fn()} />);
    expect(screen.getByText('Version History')).toBeInTheDocument();
  });

  it('shows "Hide History" when history is visible', () => {
    render(<CodexPageHeader showHistory onToggleHistory={vi.fn()} />);
    expect(screen.getByText('Hide History')).toBeInTheDocument();
  });

  it('calls onToggleHistory when the button is clicked', () => {
    const toggle = vi.fn();
    render(<CodexPageHeader showHistory={false} onToggleHistory={toggle} />);
    fireEvent.click(screen.getByText('Version History'));
    expect(toggle).toHaveBeenCalledOnce();
  });
});
