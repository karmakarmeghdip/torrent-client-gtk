// Base atoms

// Error service
export {
  errorService,
  useErrorReporter,
  useFatalErrors,
  useToasts,
  withErrorHandling,
} from "../services/errorService";
// Action atoms
export {
  addTorrentAtom,
  closePlayerAtom,
  deleteTorrentAtom,
  pauseAllTorrentsAtom,
  resumeAllTorrentsAtom,
  setActiveStreamAtom,
  setConfigAtom,
  setServiceInitializedAtom,
  setTorrentVideoFilesAtom,
  toggleTorrentStatusAtom,
  updateConfigAtom,
  updateTorrentProgressAtom,
} from "./actionAtoms";
export {
  configAtom,
  playerStateAtom,
  serviceInitializedAtom,
  torrentIdsAtom,
  torrentsMapAtom,
} from "./baseAtoms";
// Derived atoms
export {
  activeTorrentsCountAtom,
  allTorrentsAtom,
  clearAllTorrentAtoms,
  clearTorrentAtom,
  completedTorrentsCountAtom,
  getTorrentAtom,
  getTorrentsByStatusAtom,
  torrentHandlersInfoAtom,
} from "./derivedAtoms";
// Error store
export {
  type AppError,
  addFatalErrorAtom,
  addToastAtom,
  clearErrorsAtom,
  clearToastsAtom,
  createErrorReporter,
  dismissAllNotificationsAtom,
  type ErrorReporter,
  type ErrorSeverity,
  errorsAtom,
  fatalErrorsAtom,
  hasErrorsAtom,
  hasToastsAtom,
  recoverableErrorsAtom,
  removeErrorAtom,
  removeToastAtom,
  type ToastNotification,
  toastsAtom,
} from "./errorStore";
