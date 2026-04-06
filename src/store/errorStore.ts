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

/** Generate unique error ID */
function generateErrorId(): string {
  return `error-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Base atom for error list */
export const errorsAtom = atom<AppError[]>([]);

/** Derived atom to check if there are any errors */
export const hasErrorsAtom = atom((get) => get(errorsAtom).length > 0);

/** Derived atom to get only unrecoverable errors */
export const criticalErrorsAtom = atom((get) =>
  get(errorsAtom).filter((e) => e.severity === "error" && !e.recoverable)
);

/** Action atom to add an error */
export const addErrorAtom = atom(
  null,
  (
    _get,
    set,
    { message, severity = "error", source, recoverable = false }: Omit<AppError, "id" | "timestamp">
  ) => {
    const error: AppError = {
      id: generateErrorId(),
      message,
      severity,
      timestamp: Date.now(),
      source,
      recoverable,
    };
    set(errorsAtom, (prev) => [...prev, error]);
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

/** Helper to handle async operation errors */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  source?: string
): Promise<T | null> {
  try {
    return await operation();
  } catch {
    // Return error info for the caller to handle via addErrorAtom
    const errorInfo = {
      message: errorMessage,
      severity: "error" as const,
      source: source || "unknown",
      recoverable: true,
    };
    // Re-throw with error info attached
    throw Object.assign(new Error(errorMessage), { errorInfo });
  }
}

// Type exports at end of module
export type { AppError, ErrorSeverity };
