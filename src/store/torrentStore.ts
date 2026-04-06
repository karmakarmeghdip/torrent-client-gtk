import { type Atom, atom } from "jotai";
import type { AppConfig, PlayerState, Torrent, TorrentStatus, TorrentVideoFile } from "../types";

// ============================================
// Base Atoms
// ============================================

/** Map containing all torrent data - keyed by torrent ID */
const torrentsMapAtom = atom<Map<string, Torrent>>(new Map());

/** Ordered list of torrent IDs for list rendering */
const torrentIdsAtom = atom<string[]>([]);

/** App configuration */
const configAtom = atom<AppConfig>({
  downloadPath: "",
  autoStart: true,
  notifications: true,
  darkMode: false,
});

/** Whether the torrent service is initialized */
const serviceInitializedAtom = atom<boolean>(false);

/** Player state atom */
const playerStateAtom = atom<PlayerState>({
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
const allTorrentsAtom = atom((get) => {
  const ids = get(torrentIdsAtom);
  const map = get(torrentsMapAtom);
  return ids.map((id) => map.get(id)).filter((t): t is Torrent => t !== undefined);
});

// Simple atom cache for granular torrent atoms
const torrentAtoms = new Map<string, Atom<Torrent | undefined>>();

/** Get a single torrent by ID (granular - components only re-render when this torrent changes) */
const getTorrentAtom = (id: string): Atom<Torrent | undefined> => {
  if (!torrentAtoms.has(id)) {
    torrentAtoms.set(
      id,
      atom((get) => get(torrentsMapAtom).get(id))
    );
  }
  const existingAtom = torrentAtoms.get(id);
  if (!existingAtom) {
    throw new Error(`Failed to create atom for torrent ${id}`);
  }
  return existingAtom;
};

/** Count of active (downloading/seeding) torrents */
const activeTorrentsCountAtom = atom((get) => {
  const map = get(torrentsMapAtom);
  return Array.from(map.values()).filter(
    (t) => t.status === "Downloading" || t.status === "Seeding"
  ).length;
});

/** Count of completed torrents */
const completedTorrentsCountAtom = atom((get) => {
  const map = get(torrentsMapAtom);
  return Array.from(map.values()).filter((t) => t.progress >= 1.0).length;
});

// ============================================
// Action Atoms
// ============================================

/** Toggle torrent status (pause/resume) */
const toggleTorrentStatusAtom = atom(null, (get, set, id: string) => {
  const map = new Map(get(torrentsMapAtom));
  const torrent = map.get(id);
  if (!torrent) {
    return;
  }

  let newStatus: TorrentStatus;
  let newSpeed: string;

  if (torrent.status === "Downloading" || torrent.status === "Seeding") {
    newStatus = "Paused";
    newSpeed = "0 B/s";
  } else if (torrent.progress >= 1.0) {
    // Resuming completed torrent
    newStatus = "Seeding";
    newSpeed = "0 B/s";
  } else {
    // Resuming incomplete torrent
    newStatus = "Downloading";
    newSpeed = "0 B/s";
  }

  map.set(id, { ...torrent, status: newStatus, speed: newSpeed });
  set(torrentsMapAtom, map);
});

/** Delete a torrent by ID */
const deleteTorrentAtom = atom(null, (get, set, id: string) => {
  const map = new Map(get(torrentsMapAtom));
  map.delete(id);
  set(torrentsMapAtom, map);

  const ids = get(torrentIdsAtom).filter((torrentId) => torrentId !== id);
  set(torrentIdsAtom, ids);
});

/** Resume all paused torrents */
const resumeAllTorrentsAtom = atom(null, (get, set) => {
  const map = new Map(get(torrentsMapAtom));

  for (const [id, torrent] of map) {
    if (torrent.status === "Paused") {
      const newStatus: TorrentStatus = torrent.progress >= 1.0 ? "Seeding" : "Downloading";
      const newSpeed = torrent.progress >= 1.0 ? "0 B/s" : "0 B/s";
      map.set(id, { ...torrent, status: newStatus, speed: newSpeed });
    }
  }

  set(torrentsMapAtom, map);
});

/** Pause all active torrents */
const pauseAllTorrentsAtom = atom(null, (get, set) => {
  const map = new Map(get(torrentsMapAtom));

  for (const [id, torrent] of map) {
    if (torrent.status === "Downloading" || torrent.status === "Seeding") {
      map.set(id, { ...torrent, status: "Paused", speed: "0 B/s" });
    }
  }

  set(torrentsMapAtom, map);
});

/** Update torrent progress (used by webtorrent service) */
const updateTorrentProgressAtom = atom(
  null,
  (
    get,
    set,
    {
      id,
      progress,
      speed,
      peers,
    }: {
      id: string;
      progress: number;
      speed?: string;
      peers?: number;
    }
  ) => {
    const map = new Map(get(torrentsMapAtom));
    const torrent = map.get(id);
    if (!torrent) {
      return;
    }

    const newProgress = Math.min(progress, 1.0);
    let newStatus: TorrentStatus;
    if (newProgress >= 1.0) {
      newStatus = "Seeding";
    } else if (torrent.status === "Paused") {
      newStatus = "Paused";
    } else {
      newStatus = "Downloading";
    }

    map.set(id, {
      ...torrent,
      progress: newProgress,
      status: newStatus,
      ...(speed && { speed }),
      ...(peers !== undefined && { peers }),
    });

    set(torrentsMapAtom, map);
  }
);

/** Add a new torrent */
const addTorrentAtom = atom(null, (get, set, torrent: Torrent) => {
  const map = new Map(get(torrentsMapAtom));
  map.set(torrent.id, torrent);
  set(torrentsMapAtom, map);

  const ids = [...get(torrentIdsAtom), torrent.id];
  set(torrentIdsAtom, ids);
});

/** Update app configuration */
const updateConfigAtom = atom(null, (get, set, updates: Partial<AppConfig>) => {
  const current = get(configAtom);
  set(configAtom, { ...current, ...updates });
});

/** Set the entire config atom */
const setConfigAtom = atom(null, (_get, set, config: AppConfig) => {
  set(configAtom, config);
});

/** Set service initialized state */
const setServiceInitializedAtom = atom(null, (_get, set, initialized: boolean) => {
  set(serviceInitializedAtom, initialized);
});

/** Update torrent with video file list after metadata */
const setTorrentVideoFilesAtom = atom(
  null,
  (get, set, { id, files }: { id: string; files: TorrentVideoFile[] }) => {
    const map = new Map(get(torrentsMapAtom));
    const torrent = map.get(id);
    if (torrent) {
      map.set(id, { ...torrent, videoFiles: files });
      set(torrentsMapAtom, map);
    }
  }
);

/** Set active stream */
const setActiveStreamAtom = atom(
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
    }
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
  }
);

/** Close player and stop streaming */
const closePlayerAtom = atom(null, (get, set) => {
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
      let newStatus: TorrentStatus;
      if (torrent.progress >= 1.0) {
        newStatus = "Seeding";
      } else if (torrent.status === "Paused") {
        newStatus = "Paused";
      } else {
        newStatus = "Downloading";
      }
      map.set(playerState.torrentId, {
        ...torrent,
        status: newStatus,
        selectedVideoFile: undefined,
      });
      set(torrentsMapAtom, map);
    }
  }
});

// ============================================
// Exports
// ============================================

export {
  activeTorrentsCountAtom,
  addTorrentAtom,
  allTorrentsAtom,
  closePlayerAtom,
  completedTorrentsCountAtom,
  configAtom,
  deleteTorrentAtom,
  getTorrentAtom,
  pauseAllTorrentsAtom,
  playerStateAtom,
  resumeAllTorrentsAtom,
  serviceInitializedAtom,
  setActiveStreamAtom,
  setConfigAtom,
  setServiceInitializedAtom,
  setTorrentVideoFilesAtom,
  toggleTorrentStatusAtom,
  torrentIdsAtom,
  torrentsMapAtom,
  updateConfigAtom,
  updateTorrentProgressAtom,
};
