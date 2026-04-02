import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodexDialogProvider, useCodexDialog } from '../CodexDialogProvider';

function TestTrigger({ onAction }: { onAction?: () => void }) {
  const { openDialog } = useCodexDialog();
  return (
    <>
      <button onClick={() => openDialog({
        type: 'confirm',
        title: 'Delete Item',
        message: 'Are you sure?',
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        onConfirm: () => onAction?.(),
      })}>Open Confirm</button>
      <button onClick={() => openDialog({
        type: 'addScreen',
        onSubmit: () => onAction?.(),
      })}>Open Add Screen</button>
    </>
  );
}

describe('CodexDialogProvider', () => {
  it('renders children without a dialog initially', () => {
    render(
      <CodexDialogProvider>
        <span>Page Content</span>
      </CodexDialogProvider>,
    );
    expect(screen.getByText('Page Content')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a confirm dialog when triggered via hook', () => {
    render(
      <CodexDialogProvider>
        <TestTrigger />
      </CodexDialogProvider>,
    );
    fireEvent.click(screen.getByText('Open Confirm'));
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('closes the dialog when cancel is clicked', () => {
    render(
      <CodexDialogProvider>
        <TestTrigger />
      </CodexDialogProvider>,
    );
    fireEvent.click(screen.getByText('Open Confirm'));
    expect(screen.getByText('Delete Item')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
  });

  it('calls onConfirm and closes when confirm is clicked', () => {
    const onAction = vi.fn();
    render(
      <CodexDialogProvider>
        <TestTrigger onAction={onAction} />
      </CodexDialogProvider>,
    );
    fireEvent.click(screen.getByText('Open Confirm'));
    fireEvent.click(screen.getByText('Delete'));

    expect(onAction).toHaveBeenCalledOnce();
    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
  });

  it('opens the add screen modal when triggered', () => {
    render(
      <CodexDialogProvider>
        <TestTrigger />
      </CodexDialogProvider>,
    );
    fireEvent.click(screen.getByText('Open Add Screen'));
    expect(screen.getByText('New Screen')).toBeInTheDocument();
  });

  it('throws when useCodexDialog is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestTrigger />)).toThrow(
      'useCodexDialog must be used within a CodexDialogProvider',
    );
    consoleSpy.mockRestore();
  });
});
