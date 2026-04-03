import { toast } from 'sonner';

const TOAST_DURATION = 10000; // 10 seconds

export const decoToast = {
  success: (message: string) =>
    toast.success(message, { duration: TOAST_DURATION }),
  error: (message: string) =>
    toast.error(message, { duration: TOAST_DURATION }),
  warning: (message: string) =>
    toast.warning(message, { duration: TOAST_DURATION }),
  info: (message: string) =>
    toast.info(message, { duration: TOAST_DURATION }),
};
