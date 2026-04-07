import { atom } from "jotai";

/** Error severity levels */
type ErrorSeverity = "error" | "warning" | "info";

/** Application error type */
interface AppError {
  id: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: number;
  source?: string;
  recoverable?: boolean;
}

/** Toast notification type for non-fatal errors */
interface ToastNotification {
  id: string;
  message: string;
  severity: Exclude<ErrorSeverity, "info">;
  timestamp: number;
  source?: string;
  /** Auto-dismiss timeout in ms (0 = no auto-dismiss) */
  timeout: number;
}

/** Generate unique error ID */
function generateErrorId(): string {
  return `error-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Base atom for error list */
export const errorsAtom = atom<AppError[]>([]);

/** Base atom for toast notifications */
export const toastsAtom = atom<ToastNotification[]>([]);

/** Derived atom to check if there are any errors */
export const hasErrorsAtom = atom((get) => get(errorsAtom).length > 0);

/** Derived atom to check if there are any toasts */
export const hasToastsAtom = atom((get) => get(toastsAtom).length > 0);

/** Derived atom to get only unrecoverable/fatal errors */
export const fatalErrorsAtom = atom((get) =>
  get(errorsAtom).filter((e) => e.severity === "error" && e.recoverable === false)
);

/** Derived atom to get recoverable errors (warnings that should show as toasts) */
export const recoverableErrorsAtom = atom((get) =>
  get(errorsAtom).filter((e) => e.recoverable === true || e.severity === "warning")
);

/** Action atom to add a fatal error (shows alert dialog) */
export const addFatalErrorAtom = atom(
  null,
  (_get, set, { message, source }: { message: string; source?: string }) => {
    const error: AppError = {
      id: generateErrorId(),
      message,
      severity: "error",
      timestamp: Date.now(),
      source,
      recoverable: false,
    };
    set(errorsAtom, (prev) => [...prev, error]);
  }
);

/** Action atom to remove a toast by ID */
export const removeToastAtom = atom(null, (_get, set, id: string) => {
  set(toastsAtom, (prev) => prev.filter((t) => t.id !== id));
});

/** Action atom to add a toast notification (non-fatal) */
export const addToastAtom = atom(
  null,
  (
    _get,
    set,
    {
      message,
      severity = "warning",
      source,
      timeout = 5000,
    }: {
      message: string;
      severity?: "error" | "warning";
      source?: string;
      timeout?: number;
    }
  ) => {
    const toast: ToastNotification = {
      id: generateErrorId(),
      message,
      severity,
      timestamp: Date.now(),
      source,
      timeout,
    };
    set(toastsAtom, (prev) => [...prev, toast]);

    // Auto-dismiss if timeout is set
    if (timeout > 0) {
      setTimeout(() => {
        set(removeToastAtom, toast.id);
      }, timeout);
    }
  }
);

/** Action atom to remove an error by ID */
export const removeErrorAtom = atom(null, (_get, set, id: string) => {
  set(errorsAtom, (prev) => prev.filter((e) => e.id !== id));
});

/** Action atom to clear all errors */
export const clearErrorsAtom = atom(null, (_get, set) => {
  set(errorsAtom, []);
});

/** Action atom to clear all toasts */
export const clearToastsAtom = atom(null, (_get, set) => {
  set(toastsAtom, []);
});

/** Action atom to dismiss all notifications (errors and toasts) */
export const dismissAllNotificationsAtom = atom(null, (_get, set) => {
  set(errorsAtom, []);
  set(toastsAtom, []);
});

/** Helper to report an error with automatic severity detection */
export function createErrorReporter(
  setFatalError: (params: { message: string; source?: string }) => void,
  showToast: (params: {
    message: string;
    severity?: "error" | "warning";
    source?: string;
    timeout?: number;
  }) => void
) {
  return {
    /** Report a fatal error that requires user attention (shows alert dialog) */
    fatal: (message: string, source?: string) => {
      setFatalError({ message, source });
    },

    /** Report an error that can be ignored (shows toast) */
    error: (message: string, source?: string) => {
      showToast({ message, severity: "error", source, timeout: 8000 });
    },

    /** Report a warning (shows toast) */
    warn: (message: string, source?: string) => {
      showToast({ message, severity: "warning", source, timeout: 5000 });
    },

    /** Handle an async operation with automatic error reporting */
    async wrap<T>(
      operation: () => Promise<T>,
      options: {
        errorMessage: string;
        source: string;
        fatal?: boolean;
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
      }
    ): Promise<T | null> {
      try {
        const result = await operation();
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? `${options.errorMessage}: ${error.message}`
            : options.errorMessage;

        if (options.fatal) {
          this.fatal(errorMessage, options.source);
        } else {
          this.error(errorMessage, options.source);
        }

        if (options.onError && error instanceof Error) {
          options.onError(error);
        }

        return null;
      }
    },
  };
}

// Type exports at end of module
export type { AppError, ErrorSeverity, ToastNotification };

export type ErrorReporter = ReturnType<typeof createErrorReporter>;
