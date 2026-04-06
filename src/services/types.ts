import type { Atom, WritableAtom } from "jotai";

/** Type for Jotai store reference used by services */
export interface ServiceStore {
  get: <T>(atom: Atom<T>) => T;
  set: <T, A extends unknown[], R>(atom: WritableAtom<T, A, R>, ...args: A) => R;
}

/** Service initialization status */
export interface ServiceStatus {
  initialized: boolean;
  error: string | null;
}

/** Video file metadata */
export interface VideoFileInfo {
  index: number;
  name: string;
  path: string;
  size: string;
  type: string;
}

/** Active torrent information for display/debugging */
export interface ActiveTorrentInfo {
  id: string;
  name: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
}

/** Update throttling configuration */
export interface ThrottleConfig {
  progressMs: number;
  speedMs: number;
  peersMs: number;
}

/** Default throttle configuration */
export const DEFAULT_THROTTLE_CONFIG: ThrottleConfig = {
  progressMs: 250,
  speedMs: 1000,
  peersMs: 1000,
};
