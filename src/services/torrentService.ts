import type { Atom, WritableAtom } from "jotai";
import type { Torrent as WebTorrentClient, Instance as WebTorrentInstance } from "webtorrent";
import WebTorrent from "webtorrent";
import type { PersistedTorrent, Torrent, TorrentStatus } from "../types";
import { loadConfig } from "./configService";
import { addPersistedTorrent, loadState, removePersistedTorrent } from "./stateService";
import {
  getVideoFiles,
  initializeVideoServer,
  setStreamingClient,
  shutdownVideoServer,
} from "./videoStreamingService";

// Store reference to jotai store for direct atom updates
// This will be set during initialization
let jotaiStore: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: <T>(atom: Atom<T>) => T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set: <T, A extends unknown[], R>(atom: WritableAtom<T, A, R>, ...args: A) => R;
} | null = null;

// Atoms will be imported lazily to avoid circular dependencies
let torrentAtoms: typeof import("../store/torrentStore") | null = null;

// WebTorrent client instance
let client: WebTorrentInstance | null = null;

// Map to track webtorrent client instances by torrent ID
const activeTorrents = new Map<string, WebTorrentClient>();

// Track last update time to throttle UI updates
const lastUpdateTime = new Map<string, number>();
const UPDATE_THROTTLE_MS = 500; // Update UI at most every 500ms

/** Format bytes to human readable string */
function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/** Format speed (bytes/sec) to human readable string */
function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) {
    return "0 B/s";
  }
  return `${formatBytes(bytesPerSecond)}/s`;
}

/** Generate a unique ID for a torrent */
function generateTorrentId(magnetUri: string): string {
  // Use a hash of the magnet URI for consistent IDs
  let hash = 0;
  for (let i = 0; i < magnetUri.length; i++) {
    const char = magnetUri.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }
  return `torrent-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
}

/** Initialize the torrent service with jotai store reference */
export async function initializeTorrentService(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: {
    get: <T>(atom: Atom<T>) => T;
    set: <T, A extends unknown[], R>(atom: WritableAtom<T, A, R>, ...args: A) => R;
  }
): Promise<void> {
  jotaiStore = store;

  // Lazy import atoms to avoid circular dependencies
  torrentAtoms = await import("../store/torrentStore");

  // Create WebTorrent client
  client = new WebTorrent();

  // Set client reference for video streaming service
  setStreamingClient(client);

  // Initialize video streaming server
  initializeVideoServer();

  // Load persisted torrents and restore them
  await restorePersistedTorrents();
}

/** Get the active torrents map */
export function getActiveTorrents(): Map<string, WebTorrentClient> {
  return activeTorrents;
}

/** Shutdown the torrent service */
export async function shutdownTorrentService(): Promise<void> {
  // Shutdown video server first
  shutdownVideoServer();

  if (client) {
    // Destroy all torrents
    for (const [_id, wt] of activeTorrents) {
      wt.destroy({}, () => {});
    }
    activeTorrents.clear();

    // Destroy client
    client.destroy(() => {});
    client = null;
  }

  jotaiStore = null;
  torrentAtoms = null;
}

/** Restore persisted torrents from state file */
async function restorePersistedTorrents(): Promise<void> {
  if (!(torrentAtoms && jotaiStore)) {
    return;
  }

  const config = await loadConfig();
  const state = await loadState();

  for (const persisted of state.torrents) {
    // Create torrent object
    const torrent: Torrent = {
      id: persisted.id,
      name: persisted.name || "Unknown",
      size: "Unknown",
      progress: 0,
      speed: "0 B/s",
      status: config.autoStart ? "Downloading" : "Paused",
      peers: 0,
      magnetUri: persisted.magnetUri,
      downloadPath: persisted.downloadPath,
      addedAt: persisted.addedAt,
    };

    // Add to store
    jotaiStore.set(torrentAtoms.addTorrentAtom, torrent);

    // If auto-start is enabled, start downloading
    if (config.autoStart) {
      await startTorrentDownload(persisted.id, persisted.magnetUri, persisted.downloadPath);
    }
  }
}

/** Add a new torrent from magnet URI */
export async function addTorrent(
  magnetUri: string,
  downloadPath?: string
): Promise<Torrent | null> {
  if (!(client && torrentAtoms && jotaiStore)) {
    return null;
  }

  try {
    // Load config to get default download path if not provided
    const config = await loadConfig();
    const path = downloadPath || config.downloadPath;

    // Generate unique ID
    const id = generateTorrentId(magnetUri);

    // Create initial torrent object
    const torrent: Torrent = {
      id,
      name: "Loading...",
      size: "Unknown",
      progress: 0,
      speed: "0 B/s",
      status: config.autoStart ? "Downloading" : "Paused",
      peers: 0,
      magnetUri,
      downloadPath: path,
      addedAt: Date.now(),
    };

    // Persist to state file
    const persisted: PersistedTorrent = {
      id,
      magnetUri,
      downloadPath: path,
      addedAt: torrent.addedAt,
    };
    await addPersistedTorrent(persisted);

    // Add to jotai store
    jotaiStore.set(torrentAtoms.addTorrentAtom, torrent);

    // Start downloading if auto-start is enabled
    if (config.autoStart) {
      await startTorrentDownload(id, magnetUri, path);
    }

    return torrent;
  } catch (_error) {
    return null;
  }
}

/** Start downloading a torrent */
async function startTorrentDownload(
  id: string,
  magnetUri: string,
  downloadPath: string
): Promise<void> {
  if (!(client && torrentAtoms && jotaiStore)) {
    return;
  }

  // Check if already downloading
  if (activeTorrents.has(id)) {
    return;
  }

  try {
    // Add to webtorrent client
    const wt = client.add(
      magnetUri,
      {
        path: downloadPath,
      },
      (torrent) => {
        // Update torrent name and size once metadata is available
        const size = formatBytes(torrent.length);
        const map = new Map(jotaiStore?.get(torrentAtoms?.torrentsMapAtom) as Map<string, Torrent>);
        const existing = map.get(id);
        if (existing) {
          // Detect video files
          const videoFiles = getVideoFiles(torrent);

          map.set(id, {
            ...existing,
            name: torrent.name,
            size,
            videoFiles: videoFiles.length > 0 ? videoFiles : undefined,
          });
          jotaiStore?.set(torrentAtoms?.torrentsMapAtom, map);

          // Also update via the dedicated atom for video files
          if (videoFiles.length > 0 && torrentAtoms) {
            jotaiStore?.set(torrentAtoms.setTorrentVideoFilesAtom, {
              id,
              files: videoFiles,
            });
          }

          // Update persisted state with name
          addPersistedTorrent({
            id,
            magnetUri,
            downloadPath,
            name: torrent.name,
            addedAt: existing.addedAt,
          });
        }
      }
    );

    // Store reference
    activeTorrents.set(id, wt);

    // Set up progress monitoring
    wt.on("download", () => {
      updateTorrentProgress(id, wt);
    });

    wt.on("done", () => {
      updateTorrentProgress(id, wt);
    });

    wt.on("error", (_err) => {
      updateTorrentStatus(id, "Error");
    });

    wt.on("noPeers", (_announceType) => {});

    // Initial update
    updateTorrentProgress(id, wt);
  } catch (_error) {
    updateTorrentStatus(id, "Error");
  }
}

/** Update torrent progress in the store */
function updateTorrentProgress(id: string, wt: WebTorrentClient): void {
  if (!(torrentAtoms && jotaiStore)) {
    return;
  }

  // Throttle updates
  const now = Date.now();
  const lastUpdate = lastUpdateTime.get(id) || 0;
  if (now - lastUpdate < UPDATE_THROTTLE_MS) {
    return;
  }
  lastUpdateTime.set(id, now);

  const progress = wt.progress;
  const speed = wt.downloadSpeed;
  const peers = wt.numPeers;

  // Get current torrent to check its status
  const map = jotaiStore.get(torrentAtoms.torrentsMapAtom) as Map<string, Torrent>;
  const torrent = map.get(id);

  if (!torrent) {
    return;
  }

  // Determine new status based on progress and current state
  let newStatus: TorrentStatus;
  if (progress >= 1.0) {
    newStatus = "Seeding";
  } else if (torrent.status === "Paused") {
    // Keep paused if it was paused and not complete
    newStatus = "Paused";
  } else {
    // Active downloading
    newStatus = "Downloading";
  }

  // Update progress atom with calculated status
  const newMap = new Map(map);
  newMap.set(id, {
    ...torrent,
    progress,
    speed: formatSpeed(speed),
    peers,
    status: newStatus,
  });
  jotaiStore.set(torrentAtoms.torrentsMapAtom, newMap);
}

/** Update torrent status in the store */
function updateTorrentStatus(id: string, status: TorrentStatus): void {
  if (!(torrentAtoms && jotaiStore)) {
    return;
  }

  const map = new Map(jotaiStore.get(torrentAtoms.torrentsMapAtom) as Map<string, Torrent>);
  const torrent = map.get(id);
  if (torrent) {
    map.set(id, { ...torrent, status });
    jotaiStore.set(torrentAtoms.torrentsMapAtom, map);
  }
}

/** Pause a torrent */
export async function pauseTorrent(id: string): Promise<void> {
  const wt = activeTorrents.get(id);
  if (wt) {
    // WebTorrent doesn't have a true pause, we can only destroy
    // For a real pause/resume, we'd need to store the magnet and re-add
    wt.destroy({}, () => {});
    activeTorrents.delete(id);
  }
  updateTorrentStatus(id, "Paused");
}

/** Resume a torrent */
export async function resumeTorrent(id: string): Promise<void> {
  if (!(torrentAtoms && jotaiStore)) {
    return;
  }

  const map = jotaiStore.get(torrentAtoms.torrentsMapAtom) as Map<string, Torrent>;
  const torrent = map.get(id);
  if (!torrent) {
    return;
  }

  // Update status to "Downloading" immediately so UI shows it's resuming
  // If torrent was completed, it will be "Seeding" once it starts
  const newStatus: TorrentStatus = torrent.progress >= 1.0 ? "Seeding" : "Downloading";
  updateTorrentStatus(id, newStatus);

  await startTorrentDownload(id, torrent.magnetUri, torrent.downloadPath);
}

/** Remove a torrent */
export async function removeTorrent(id: string, deleteFiles = false): Promise<void> {
  if (!(torrentAtoms && jotaiStore)) {
    return;
  }

  // Stop the torrent if active
  const wt = activeTorrents.get(id);
  if (wt) {
    wt.destroy({ destroyStore: deleteFiles }, () => {});
    activeTorrents.delete(id);
  }

  // Remove from persisted state
  await removePersistedTorrent(id);

  // Remove from jotai store
  jotaiStore.set(torrentAtoms.deleteTorrentAtom, id);
}

/** Get all active torrents info */
export function getActiveTorrentsInfo(): Array<{
  id: string;
  name: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
}> {
  const info: Array<{
    id: string;
    name: string;
    progress: number;
    downloadSpeed: number;
    uploadSpeed: number;
    numPeers: number;
  }> = [];

  for (const [id, wt] of activeTorrents) {
    info.push({
      id,
      name: wt.name,
      progress: wt.progress,
      downloadSpeed: wt.downloadSpeed,
      uploadSpeed: wt.uploadSpeed,
      numPeers: wt.numPeers,
    });
  }

  return info;
}
