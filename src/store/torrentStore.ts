import { atom, type Atom } from "jotai";
import type { Torrent, TorrentStatus, AppConfig, PlayerState, TorrentVideoFile } from "../types";

// ============================================
// Base Atoms
// ============================================

/** Map containing all torrent data - keyed by torrent ID */
export const torrentsMapAtom = atom<Map<string, Torrent>>(new Map());

/** Ordered list of torrent IDs for list rendering */
export const torrentIdsAtom = atom<string[]>([]);

/** App configuration */
export const configAtom = atom<AppConfig>({
  downloadPath: "",
  autoStart: true,
  notifications: true,
  darkMode: false,
});

/** Whether the torrent service is initialized */
export const serviceInitializedAtom = atom<boolean>(false);

/** Player state atom */
export const playerStateAtom = atom<PlayerState>({
  torrentId: null,
  fileIndex: null,
  streamUrl: null,
  isPlaying: false,
  isFullscreen: false,
});

// ============================================
// Derived Atoms
// ============================================

/** Get all torrents as array (for list views) */
export const allTorrentsAtom = atom((get) => {
  const ids = get(torrentIdsAtom);
  const map = get(torrentsMapAtom);
  return ids.map((id) => map.get(id)!).filter(Boolean);
});

// Simple atom cache for granular torrent atoms
const torrentAtoms = new Map<string, Atom<Torrent | undefined>>();

/** Get a single torrent by ID (granular - components only re-render when this torrent changes) */
export const getTorrentAtom = (id: string): Atom<Torrent | undefined> => {
  if (!torrentAtoms.has(id)) {
    torrentAtoms.set(
      id,
      atom((get) => get(torrentsMapAtom).get(id)),
    );
  }
  return torrentAtoms.get(id)!;
};

/** Count of active (downloading/seeding) torrents */
export const activeTorrentsCountAtom = atom((get) => {
  const map = get(torrentsMapAtom);
  return Array.from(map.values()).filter(
    (t) => t.status === "Downloading" || t.status === "Seeding",
  ).length;
});

/** Count of completed torrents */
export const completedTorrentsCountAtom = atom((get) => {
  const map = get(torrentsMapAtom);
  return Array.from(map.values()).filter((t) => t.progress >= 1.0).length;
});

// ============================================
// Action Atoms
// ============================================

/** Toggle torrent status (pause/resume) */
export const toggleTorrentStatusAtom = atom(null, (get, set, id: string) => {
  const map = new Map(get(torrentsMapAtom));
  const torrent = map.get(id);
  if (!torrent) return;

  let newStatus: TorrentStatus;
  let newSpeed: string;

  if (torrent.status === "Downloading" || torrent.status === "Seeding") {
    newStatus = "Paused";
    newSpeed = "0 B/s";
  } else {
    // Resuming
    if (torrent.progress >= 1.0) {
      newStatus = "Seeding";
      newSpeed = "0 B/s";
    } else {
      newStatus = "Downloading";
      newSpeed = "0 B/s";
    }
  }

  map.set(id, { ...torrent, status: newStatus, speed: newSpeed });
  set(torrentsMapAtom, map);
});

/** Delete a torrent by ID */
export const deleteTorrentAtom = atom(null, (get, set, id: string) => {
  const map = new Map(get(torrentsMapAtom));
  map.delete(id);
  set(torrentsMapAtom, map);

  const ids = get(torrentIdsAtom).filter((torrentId) => torrentId !== id);
  set(torrentIdsAtom, ids);
});

/** Resume all paused torrents */
export const resumeAllTorrentsAtom = atom(null, (get, set) => {
  const map = new Map(get(torrentsMapAtom));

  for (const [id, torrent] of map) {
    if (torrent.status === "Paused") {
      const newStatus: TorrentStatus =
        torrent.progress >= 1.0 ? "Seeding" : "Downloading";
      const newSpeed = torrent.progress >= 1.0 ? "0 B/s" : "0 B/s";
      map.set(id, { ...torrent, status: newStatus, speed: newSpeed });
    }
  }

  set(torrentsMapAtom, map);
});

/** Pause all active torrents */
export const pauseAllTorrentsAtom = atom(null, (get, set) => {
  const map = new Map(get(torrentsMapAtom));

  for (const [id, torrent] of map) {
    if (torrent.status === "Downloading" || torrent.status === "Seeding") {
      map.set(id, { ...torrent, status: "Paused", speed: "0 B/s" });
    }
  }

  set(torrentsMapAtom, map);
});

/** Update torrent progress (used by webtorrent service) */
export const updateTorrentProgressAtom = atom(
  null,
  (get, set, { id, progress, speed, peers }: {
    id: string;
    progress: number;
    speed?: string;
    peers?: number;
  }) => {
    const map = new Map(get(torrentsMapAtom));
    const torrent = map.get(id);
    if (!torrent) return;

    const newProgress = Math.min(progress, 1.0);
    const newStatus: TorrentStatus = newProgress >= 1.0
      ? "Seeding"
      : torrent.status === "Paused"
      ? "Paused"
      : "Downloading";

    map.set(id, {
      ...torrent,
      progress: newProgress,
      status: newStatus,
      ...(speed && { speed }),
      ...(peers !== undefined && { peers }),
    });

    set(torrentsMapAtom, map);
  },
);

/** Add a new torrent */
export const addTorrentAtom = atom(null, (get, set, torrent: Torrent) => {
  const map = new Map(get(torrentsMapAtom));
  map.set(torrent.id, torrent);
  set(torrentsMapAtom, map);

  const ids = [...get(torrentIdsAtom), torrent.id];
  set(torrentIdsAtom, ids);
});

/** Update app configuration */
export const updateConfigAtom = atom(
  null,
  (get, set, updates: Partial<AppConfig>) => {
    const current = get(configAtom);
    set(configAtom, { ...current, ...updates });
  },
);

/** Set the entire config atom */
export const setConfigAtom = atom(
  null,
  (get, set, config: AppConfig) => {
    set(configAtom, config);
  },
);

/** Set service initialized state */
export const setServiceInitializedAtom = atom(
  null,
  (get, set, initialized: boolean) => {
    set(serviceInitializedAtom, initialized);
  },
);

/** Update torrent with video file list after metadata */
export const setTorrentVideoFilesAtom = atom(
  null,
  (get, set, { id, files }: { id: string; files: TorrentVideoFile[] }) => {
    const map = new Map(get(torrentsMapAtom));
    const torrent = map.get(id);
    if (torrent) {
      map.set(id, { ...torrent, videoFiles: files });
      set(torrentsMapAtom, map);
    }
  },
);

/** Set active stream */
export const setActiveStreamAtom = atom(
  null,
  (
    get,
    set,
    {
      torrentId,
      fileIndex,
      streamUrl,
    }: {
      torrentId: string;
      fileIndex: number;
      streamUrl: string;
    },
  ) => {
    set(playerStateAtom, {
      torrentId,
      fileIndex,
      streamUrl,
      isPlaying: true,
      isFullscreen: false,
    });

    // Update torrent status to Streaming
    const map = new Map(get(torrentsMapAtom));
    const torrent = map.get(torrentId);
    if (torrent) {
      map.set(torrentId, {
        ...torrent,
        status: "Streaming",
        selectedVideoFile: fileIndex,
      });
      set(torrentsMapAtom, map);
    }
  },
);

/** Close player and stop streaming */
export const closePlayerAtom = atom(null, (get, set) => {
  const playerState = get(playerStateAtom);

  // Reset player state
  set(playerStateAtom, {
    torrentId: null,
    fileIndex: null,
    streamUrl: null,
    isPlaying: false,
    isFullscreen: false,
  });

  // Update torrent status back to appropriate state
  if (playerState.torrentId) {
    const map = new Map(get(torrentsMapAtom));
    const torrent = map.get(playerState.torrentId);
    if (torrent) {
      const newStatus: TorrentStatus =
        torrent.progress >= 1.0
          ? "Seeding"
          : torrent.status === "Paused"
            ? "Paused"
            : "Downloading";
      map.set(playerState.torrentId, {
        ...torrent,
        status: newStatus,
        selectedVideoFile: undefined,
      });
      set(torrentsMapAtom, map);
    }
  }
});
