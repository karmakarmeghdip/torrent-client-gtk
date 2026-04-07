import { useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import {
  addFatalErrorAtom,
  addToastAtom,
  createErrorReporter,
  type ErrorReporter,
} from "../store/errorStore";

/**
 * Hook to get an error reporter for showing errors to users.
 *
 * Usage:
 * ```tsx
 * const errors = useErrorReporter();
 *
 * // Fatal error - shows alert dialog
 * errors.fatal("Failed to initialize application", "AppInit");
 *
 * // Non-fatal error - shows toast
 * errors.error("Failed to add torrent", "TorrentService");
 *
 * // Warning - shows toast
 * errors.warn("Low disk space", "DiskMonitor");
 *
 * // Wrap async operations
 * const result = await errors.wrap(
 *   () => fetchData(),
 *   { errorMessage: "Failed to fetch data", source: "DataService" }
 * );
 * ```
 */
export function useErrorReporter(): ErrorReporter {
  const setFatalError = useSetAtom(addFatalErrorAtom);
  const showToast = useSetAtom(addToastAtom);

  return useMemo(() => createErrorReporter(setFatalError, showToast), [setFatalError, showToast]);
}

/**
 * Hook for showing toast notifications.
 *
 * Usage:
 * ```tsx
 * const toasts = useToasts();
 *
 * // Show error toast
 * toasts.error("Something went wrong");
 *
 * // Show warning toast
 * toasts.warn("Please check your settings");
 *
 * // Show with custom timeout (ms)
 * toasts.error("Network error", { timeout: 10000 });
 * ```
 */
export function useToasts() {
  const showToast = useSetAtom(addToastAtom);

  const error = useCallback(
    (message: string, options?: { source?: string; timeout?: number }) => {
      showToast({
        message,
        severity: "error",
        source: options?.source,
        timeout: options?.timeout ?? 8000,
      });
    },
    [showToast]
  );

  const warn = useCallback(
    (message: string, options?: { source?: string; timeout?: number }) => {
      showToast({
        message,
        severity: "warning",
        source: options?.source,
        timeout: options?.timeout ?? 5000,
      });
    },
    [showToast]
  );

  return { error, warn };
}

/**
 * Hook for showing fatal error dialogs.
 *
 * Usage:
 * ```tsx
 * const fatal = useFatalErrors();
 *
 * // Show fatal error dialog
 * fatal.show("Application initialization failed");
 * ```
 */
export function useFatalErrors() {
  const setFatalError = useSetAtom(addFatalErrorAtom);

  const show = useCallback(
    (message: string, source?: string) => {
      setFatalError({ message, source });
    },
    [setFatalError]
  );

  return { show };
}

/**
 * Helper function to safely execute async operations with error handling.
 * Non-fatal errors are shown as toasts.
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: {
    errorMessage: string;
    source: string;
    showToast?: (params: {
      message: string;
      severity: "error" | "warning";
      source?: string;
      timeout?: number;
    }) => void;
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
      error instanceof Error ? `${options.errorMessage}: ${error.message}` : options.errorMessage;

    if (options.showToast) {
      options.showToast({
        message: errorMessage,
        severity: "error",
        source: options.source,
        timeout: 8000,
      });
    }

    if (options.onError && error instanceof Error) {
      options.onError(error);
    }

    return null;
  }
}

/**
 * Service for centralized error reporting.
 * Use this in non-React contexts (e.g., services).
 */
export const errorService = {
  reporter: null as ErrorReporter | null,

  /** Set the error reporter (called during app initialization) */
  setReporter(reporter: ErrorReporter) {
    this.reporter = reporter;
  },

  /** Report a fatal error */
  fatal(message: string, source?: string) {
    this.reporter?.fatal(message, source);
  },

  /** Report a non-fatal error (toast) */
  error(message: string, source?: string) {
    this.reporter?.error(message, source);
  },

  /** Report a warning (toast) */
  warn(message: string, source?: string) {
    this.reporter?.warn(message, source);
  },

  /** Wrap an async operation with error handling */
  wrap<T>(
    operation: () => Promise<T>,
    options: {
      errorMessage: string;
      source: string;
      fatal?: boolean;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<T | null> {
    return this.reporter?.wrap(operation, options) ?? Promise.resolve(null);
  },
};
