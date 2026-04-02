import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodexAddScreenModal } from '../CodexAddScreenModal';

describe('CodexAddScreenModal', () => {
  it('renders the modal with name and slug inputs', () => {
    render(<CodexAddScreenModal onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('New Screen')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Home Screen')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('home-screen')).toBeInTheDocument();
  });

  it('auto-derives slug from name', () => {
    render(<CodexAddScreenModal onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const nameInput = screen.getByPlaceholderText('Home Screen');
    fireEvent.change(nameInput, { target: { value: 'My New Screen' } });
    const slugInput = screen.getByPlaceholderText('home-screen') as HTMLInputElement;
    expect(slugInput.value).toBe('my-new-screen');
  });

  it('calls onSubmit with name and slug on form submission', () => {
    const onSubmit = vi.fn();
    render(<CodexAddScreenModal onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Home Screen'), { target: { value: 'Dashboard' } });
    fireEvent.click(screen.getByText('Add Screen'));
    expect(onSubmit).toHaveBeenCalledWith('Dashboard', 'dashboard');
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<CodexAddScreenModal onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('does not submit when name is empty', () => {
    const onSubmit = vi.fn();
    render(<CodexAddScreenModal onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText('Add Screen'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows manual slug override', () => {
    const onSubmit = vi.fn();
    render(<CodexAddScreenModal onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Home Screen'), { target: { value: 'Dashboard' } });
    fireEvent.change(screen.getByPlaceholderText('home-screen'), { target: { value: 'custom-slug' } });
    fireEvent.click(screen.getByText('Add Screen'));
    expect(onSubmit).toHaveBeenCalledWith('Dashboard', 'custom-slug');
  });
});
