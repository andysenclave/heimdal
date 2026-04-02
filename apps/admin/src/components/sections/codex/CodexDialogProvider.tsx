import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CodexReviewDialog } from './CodexReviewDialog';
import { CodexConfirmDialog } from './CodexConfirmDialog';
import { CodexAddScreenModal } from './CodexAddScreenModal';

type CodexDialogConfig =
  | {
      type: 'review';
      mode: 'submit' | 'reject';
      versionNumber: number;
      onSubmit: (text: string) => void;
    }
  | {
      type: 'confirm';
      title: string;
      message: string;
      confirmLabel: string;
      confirmVariant: 'danger' | 'success' | 'primary';
      onConfirm: () => void;
    }
  | {
      type: 'addScreen';
      onSubmit: (name: string, slug: string) => void;
    };

interface CodexDialogContextValue {
  openDialog: (config: CodexDialogConfig) => void;
  closeDialog: () => void;
}

const CodexDialogContext = createContext<CodexDialogContextValue | null>(null);

export function useCodexDialog(): CodexDialogContextValue {
  const ctx = useContext(CodexDialogContext);
  if (!ctx) throw new Error('useCodexDialog must be used within a CodexDialogProvider');
  return ctx;
}

export function CodexDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<CodexDialogConfig | null>(null);
  const closeDialog = useCallback(() => setDialog(null), []);

  return (
    <CodexDialogContext.Provider value={{ openDialog: setDialog, closeDialog }}>
      {children}

      {dialog?.type === 'review' && (
        <CodexReviewDialog
          open
          mode={dialog.mode}
          versionNumber={dialog.versionNumber}
          onSubmit={(text) => { dialog.onSubmit(text); closeDialog(); }}
          onCancel={closeDialog}
        />
      )}

      {dialog?.type === 'confirm' && (
        <CodexConfirmDialog
          open
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          confirmVariant={dialog.confirmVariant}
          onConfirm={() => { dialog.onConfirm(); closeDialog(); }}
          onCancel={closeDialog}
        />
      )}

      {dialog?.type === 'addScreen' && (
        <CodexAddScreenModal
          onSubmit={(name, slug) => { dialog.onSubmit(name, slug); closeDialog(); }}
          onCancel={closeDialog}
        />
      )}
    </CodexDialogContext.Provider>
  );
}
