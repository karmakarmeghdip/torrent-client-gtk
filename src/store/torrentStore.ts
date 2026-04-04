import { atom, type Atom } from "jotai";
import { Torrent, TorrentStatus } from "../types";

// Initial dummy data
const initialTorrents: Torrent[] = [
  {
    id: "1",
    name: "Ubuntu 24.04 LTS Desktop (64-bit)",
    size: "4.5 GB",
    progress: 0.65,
    speed: "3.2 MB/s",
    status: "Downloading",
    peers: 45,
  },
  {
    id: "2",
    name: "Arch Linux 2024.01.01 x86_64",
    size: "900 MB",
    progress: 1.0,
    speed: "0 B/s",
    status: "Seeding",
    peers: 12,
  },
  {
    id: "3",
    name: "Fedora Workstation 40 Live ISO",
    size: "2.1 GB",
    progress: 0.15,
    speed: "800 KB/s",
    status: "Downloading",
    peers: 8,
  },
  {
    id: "4",
    name: "Debian 12.5.0 amd64 netinst",
    size: "628 MB",
    progress: 0.0,
    speed: "0 B/s",
    status: "Paused",
    peers: 0,
  },
];

// Map of all torrents by id - single source of truth
const initialTorrentsMap = new Map<string, Torrent>(
  initialTorrents.map((t) => [t.id, t]),
);

// ============================================
// Base Atoms
// ============================================

/** Map containing all torrent data - keyed by torrent ID */
export const torrentsMapAtom = atom<Map<string, Torrent>>(initialTorrentsMap);

/** Ordered list of torrent IDs for list rendering */
export const torrentIdsAtom = atom<string[]>(initialTorrents.map((t) => t.id));

/** Simulation running state (for dummy data updates) */
export const simulationEnabledAtom = atom<boolean>(true);

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
      newSpeed = "1.5 MB/s";
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
      const newSpeed = torrent.progress >= 1.0 ? "0 B/s" : "2.0 MB/s";
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

/** Update torrent progress (used by simulation / webtorrent) */
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

// ============================================
// Simulation (dummy data updates)
// ============================================

/** Atom to track simulation interval */
export const simulationIntervalAtom = atom<number | null>(null);

/** Start/stop simulation */
export const setSimulationEnabledAtom = atom(
  null,
  (get, set, enabled: boolean) => {
    // Clear existing interval
    const existingInterval = get(simulationIntervalAtom);
    if (existingInterval) {
      clearInterval(existingInterval);
      set(simulationIntervalAtom, null);
    }

    set(simulationEnabledAtom, enabled);

    if (enabled) {
      const interval = setInterval(() => {
        const map = get(torrentsMapAtom);
        const newMap = new Map(map);
        let hasChanges = false;

        for (const [id, torrent] of newMap) {
          if (torrent.status === "Downloading") {
            const newProgress = Math.min(torrent.progress + 0.01, 1.0);
            const newStatus: TorrentStatus = newProgress >= 1.0
              ? "Seeding"
              : "Downloading";
            newMap.set(id, { ...torrent, progress: newProgress, status: newStatus });
            hasChanges = true;
          }
        }

        if (hasChanges) {
          set(torrentsMapAtom, newMap);
        }
      }, 1000);

      set(simulationIntervalAtom, interval);
    }
  },
);
