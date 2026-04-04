export type TorrentStatus = "Downloading" | "Seeding" | "Paused" | "Completed" | "Error";

export interface Torrent {
  id: string;
  name: string;
  size: string;
  progress: number;
  speed: string;
  status: TorrentStatus;
  peers: number;
  /** Magnet URI or torrent file path */
  magnetUri: string;
  /** Download destination path */
  downloadPath: string;
  /** Time when torrent was added */
  addedAt: number;
}

/** Persisted torrent data (stored in state.json) */
export interface PersistedTorrent {
  id: string;
  magnetUri: string;
  downloadPath: string;
  name?: string;
  addedAt: number;
}

/** App configuration (stored in config.json) */
export interface AppConfig {
  /** Default download directory */
  downloadPath: string;
  /** Whether to start downloading automatically */
  autoStart: boolean;
  /** Whether to show notifications */
  notifications: boolean;
  /** Dark mode preference */
  darkMode: boolean;
}
