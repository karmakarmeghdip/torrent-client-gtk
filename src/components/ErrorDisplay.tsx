import * as Gtk from "@gtkx/ffi/gtk";
import { AdwAlertDialog, AdwBanner, GtkBox } from "@gtkx/react";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import {
  type AppError,
  errorsAtom,
  fatalErrorsAtom,
  removeErrorAtom,
  removeToastAtom,
  type ToastNotification,
  toastsAtom,
} from "../store/errorStore";

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

/** Individual toast banner component */
const ToastItem = ({ toast, onDismiss }: ToastItemProps) => {
  const handleButtonClicked = useCallback(() => {
    onDismiss(toast.id);
  }, [toast.id, onDismiss]);

  // Map severity to button label
  const buttonLabel = useMemo(() => {
    switch (toast.severity) {
      case "error":
        return "Dismiss";
      case "warning":
        return "OK";
      default:
        return "Dismiss";
    }
  }, [toast.severity]);

  return (
    <AdwBanner
      title={toast.message}
      buttonLabel={buttonLabel}
      revealed={true}
      onButtonClicked={handleButtonClicked}
    />
  );
};

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

/** Container for toast banners */
const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <GtkBox orientation={Gtk.Orientation.VERTICAL} spacing={4}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </GtkBox>
  );
};

interface FatalErrorDialogProps {
  error: AppError;
  onDismiss: () => void;
}

/** Fatal error alert dialog */
const FatalErrorDialog = ({ error, onDismiss }: FatalErrorDialogProps) => (
  <AdwAlertDialog
    heading="Error"
    body={error.message}
    responses={[{ id: "dismiss", label: "Dismiss" }]}
    onResponse={(responseId) => {
      if (responseId === "dismiss") {
        onDismiss();
      }
    }}
  />
);

interface FatalErrorDialogsProps {
  errors: AppError[];
  onDismiss: (id: string) => void;
}

/** Multiple fatal errors - show only the first one at a time */
const FatalErrorDialogs = ({ errors, onDismiss }: FatalErrorDialogsProps) => {
  // Show only the first fatal error
  const currentError = errors[0];

  const handleDismiss = useCallback(() => {
    if (currentError) {
      onDismiss(currentError.id);
    }
  }, [currentError, onDismiss]);

  if (!currentError) {
    return null;
  }

  return <FatalErrorDialog error={currentError} onDismiss={handleDismiss} />;
};

/**
 * ErrorDisplay component - renders toast notifications and fatal error dialogs.
 *
 * This component should be placed at the top level of your app, inside the
 * main window. It automatically:
 * - Shows toast banners for non-fatal errors (warnings and recoverable errors)
 * - Shows alert dialogs for fatal errors
 */
export const ErrorDisplay = () => {
  const [toasts] = useAtom(toastsAtom);
  const [fatalErrors] = useAtom(fatalErrorsAtom);
  const removeToast = useSetAtom(removeToastAtom);
  const removeError = useSetAtom(removeErrorAtom);

  // Limit number of visible toasts
  const visibleToasts = useMemo(() => toasts.slice(-3), [toasts]);

  const handleDismissToast = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  const handleDismissError = useCallback(
    (id: string) => {
      removeError(id);
    },
    [removeError]
  );

  // Auto-dismiss old toasts (cleanup for any missed)
  useEffect(() => {
    const now = Date.now();
    const oldToasts = toasts.filter((t) => t.timeout > 0 && now - t.timestamp > t.timeout + 1000);
    for (const toast of oldToasts) {
      removeToast(toast.id);
    }
  }, [toasts, removeToast]);

  const hasFatalErrors = fatalErrors.length > 0;

  return (
    <>
      {/* Toast notifications at the top */}
      <ToastContainer toasts={visibleToasts} onDismiss={handleDismissToast} />

      {/* Fatal error dialogs */}
      {hasFatalErrors && <FatalErrorDialogs errors={fatalErrors} onDismiss={handleDismissError} />}
    </>
  );
};

/**
 * Hook to get the current error state for testing/debugging
 */
export function useErrorState() {
  const [toasts] = useAtom(toastsAtom);
  const [_errors] = useAtom(errorsAtom);
  const [fatalErrors] = useAtom(fatalErrorsAtom);

  return {
    toastCount: toasts.length,
    errorCount: _errors.length,
    fatalErrorCount: fatalErrors.length,
    hasErrors: _errors.length > 0 || toasts.length > 0,
  };
}
