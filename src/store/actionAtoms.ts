import { atom } from "jotai";
import type { AppConfig, Torrent, TorrentStatus } from "../types";
import {
  configAtom,
  playerStateAtom,
  serviceInitializedAtom,
  torrentIdsAtom,
  torrentsMapAtom,
} from "./baseAtoms";
import { clearTorrentAtom } from "./derivedAtoms";

/** Toggle torrent status (pause/resume) */
export const toggleTorrentStatusAtom = atom(null, (get, set, id: string) => {
  const map = get(torrentsMapAtom);
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
    newStatus = "Seeding";
    newSpeed = "0 B/s";
  } else {
    newStatus = "Downloading";
    newSpeed = "0 B/s";
  }

  set(torrentsMapAtom, new Map(map).set(id, { ...torrent, status: newStatus, speed: newSpeed }));
});

/** Delete a torrent by ID */
export const deleteTorrentAtom = atom(null, (get, set, id: string) => {
  const map = get(torrentsMapAtom);
  const newMap = new Map(map);
  newMap.delete(id);
  set(torrentsMapAtom, newMap);

  const ids = get(torrentIdsAtom).filter((torrentId) => torrentId !== id);
  set(torrentIdsAtom, ids);

  // Clear from atom cache to prevent memory leak
  clearTorrentAtom(id);
});

/** Resume all paused torrents */
export const resumeAllTorrentsAtom = atom(null, (get, set) => {
  const map = get(torrentsMapAtom);
  const newMap = new Map(map);

  for (const [id, torrent] of newMap) {
    if (torrent.status === "Paused") {
      const newStatus: TorrentStatus = torrent.progress >= 1.0 ? "Seeding" : "Downloading";
      newMap.set(id, { ...torrent, status: newStatus, speed: "0 B/s" });
    }
  }

  set(torrentsMapAtom, newMap);
});

/** Pause all active torrents */
export const pauseAllTorrentsAtom = atom(null, (get, set) => {
  const map = get(torrentsMapAtom);
  const newMap = new Map(map);

  for (const [id, torrent] of newMap) {
    if (torrent.status === "Downloading" || torrent.status === "Seeding") {
      newMap.set(id, { ...torrent, status: "Paused", speed: "0 B/s" });
    }
  }

  set(torrentsMapAtom, newMap);
});

/** Update torrent progress (used by webtorrent service) */
export const updateTorrentProgressAtom = atom(
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
    const map = get(torrentsMapAtom);
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

    set(
      torrentsMapAtom,
      new Map(map).set(id, {
        ...torrent,
        progress: newProgress,
        status: newStatus,
        ...(speed && { speed }),
        ...(peers !== undefined && { peers }),
      })
    );
  }
);

/** Add a new torrent */
export const addTorrentAtom = atom(null, (get, set, torrent: Torrent) => {
  const map = get(torrentsMapAtom);
  set(torrentsMapAtom, new Map(map).set(torrent.id, torrent));

  const ids = get(torrentIdsAtom);
  set(torrentIdsAtom, [...ids, torrent.id]);
});

/** Update app configuration */
export const updateConfigAtom = atom(null, (get, set, updates: Partial<AppConfig>) => {
  const current = get(configAtom);
  set(configAtom, { ...current, ...updates });
});

/** Set the entire config atom */
export const setConfigAtom = atom(null, (_get, set, config: AppConfig) => {
  set(configAtom, config);
});

/** Set service initialized state */
export const setServiceInitializedAtom = atom(null, (_get, set, initialized: boolean) => {
  set(serviceInitializedAtom, initialized);
});

/** Update torrent with video file list after metadata */
export const setTorrentVideoFilesAtom = atom(
  null,
  (
    get,
    set,
    {
      id,
      files,
    }: {
      id: string;
      files: Array<{ index: number; name: string; path: string; size: string; type: string }>;
    }
  ) => {
    const map = get(torrentsMapAtom);
    const torrent = map.get(id);
    if (torrent) {
      set(torrentsMapAtom, new Map(map).set(id, { ...torrent, videoFiles: files }));
    }
  }
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
    const map = get(torrentsMapAtom);
    const torrent = map.get(torrentId);
    if (torrent) {
      set(
        torrentsMapAtom,
        new Map(map).set(torrentId, {
          ...torrent,
          status: "Streaming",
          selectedVideoFile: fileIndex,
        })
      );
    }
  }
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
    const map = get(torrentsMapAtom);
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
      set(
        torrentsMapAtom,
        new Map(map).set(playerState.torrentId, {
          ...torrent,
          status: newStatus,
          selectedVideoFile: undefined,
        })
      );
    }
  }
});
