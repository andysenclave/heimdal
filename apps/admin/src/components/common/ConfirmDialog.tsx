import { DecoModal } from '@components/primitives';
import { DecoButton } from '@components/primitives';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isLoading,
}: ConfirmDialogProps) {
  return (
    <DecoModal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <DecoButton variant="ghost" onClick={onClose}>
            Cancel
          </DecoButton>
          <DecoButton variant="danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : confirmLabel}
          </DecoButton>
        </>
      }
    >
      <p className="text-sm text-deco-text-soft">{message}</p>
    </DecoModal>
  );
}
