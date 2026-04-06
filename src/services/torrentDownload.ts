import type { WritableAtom } from "jotai";
import type { Torrent as WebTorrentClient } from "webtorrent";
import type { Torrent, TorrentStatus } from "../types";
import { formatSpeed } from "../utils/format";
import { getClient } from "./torrentClient";
import type { ServiceStore } from "./types";

// Track active WebTorrent instances by torrent ID
const activeTorrents = new Map<string, WebTorrentClient>();

// Track last update times for throttling
const lastUpdateTime = new Map<string, number>();

// Throttle configuration
const UPDATE_THROTTLE_MS = 250; // Progress updates at most every 250ms

/** Type for torrent atoms */
interface TorrentAtoms {
  torrentsMapAtom: WritableAtom<Map<string, Torrent>, [Map<string, Torrent>], void>;
}

/** Options for starting torrent download */
interface StartDownloadOptions {
  id: string;
  magnetUri: string;
  downloadPath: string;
  store: ServiceStore;
  atoms: TorrentAtoms;
  onMetadata: (id: string, wt: WebTorrentClient) => void;
}

/** Options for resuming torrent download */
interface ResumeDownloadOptions {
  id: string;
  magnetUri: string;
  downloadPath: string;
  progress: number;
  store: ServiceStore;
  atoms: TorrentAtoms;
  onMetadata: (id: string, wt: WebTorrentClient) => void;
}

/** Update torrent status in store - internal helper */
function updateTorrentStatusInStore(
  id: string,
  status: TorrentStatus,
  store: ServiceStore,
  atoms: TorrentAtoms
): void {
  const map = store.get(atoms.torrentsMapAtom);
  const torrent = map.get(id);
  if (torrent) {
    store.set(atoms.torrentsMapAtom, new Map(map).set(id, { ...torrent, status }));
  }
}

/** Set up torrent event handlers - internal helper */
function setupTorrentEventHandlers(
  id: string,
  wt: WebTorrentClient,
  store: ServiceStore,
  atoms: TorrentAtoms
): void {
  wt.on("download", () => {
    updateTorrentProgress(id, wt, store, atoms);
  });

  wt.on("done", () => {
    updateTorrentProgress(id, wt, store, atoms);
  });

  wt.on("error", () => {
    updateTorrentStatusInStore(id, "Error", store, atoms);
  });

  wt.on("noPeers", () => {
    // No peers callback - intentional no-op
  });
}

/** Get active torrents map */
export function getActiveTorrents(): Map<string, WebTorrentClient> {
  return activeTorrents;
}

/** Check if torrent is currently downloading */
export function isTorrentActive(id: string): boolean {
  return activeTorrents.has(id);
}

/** Update torrent progress with throttling */
export function updateTorrentProgress(
  id: string,
  wt: WebTorrentClient,
  store: ServiceStore,
  atoms: TorrentAtoms
): void {
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
  const map = store.get(atoms.torrentsMapAtom);
  const torrent = map.get(id);

  if (!torrent) {
    return;
  }

  // Determine new status based on progress and current state
  let newStatus: TorrentStatus;
  if (progress >= 1.0) {
    newStatus = "Seeding";
  } else if (torrent.status === "Paused") {
    newStatus = "Paused";
  } else {
    newStatus = "Downloading";
  }

  // Update store
  store.set(
    atoms.torrentsMapAtom,
    new Map(map).set(id, {
      ...torrent,
      progress,
      speed: formatSpeed(speed),
      peers,
      status: newStatus,
    })
  );
}

/** Update torrent status in store - exported for external use */
export function updateTorrentStatus(
  id: string,
  status: TorrentStatus,
  store: ServiceStore,
  atoms: TorrentAtoms
): void {
  updateTorrentStatusInStore(id, status, store, atoms);
}

/** Start downloading a torrent */
export function startTorrentDownload(options: StartDownloadOptions): boolean {
  const { id, magnetUri, downloadPath, store, atoms, onMetadata } = options;
  const client = getClient();
  if (!client) {
    return false;
  }

  // Check if already downloading
  if (activeTorrents.has(id)) {
    return true;
  }

  try {
    const wt = client.add(magnetUri, { path: downloadPath }, (torrent) => {
      onMetadata(id, torrent);
    });

    activeTorrents.set(id, wt);
    setupTorrentEventHandlers(id, wt, store, atoms);
    updateTorrentProgress(id, wt, store, atoms);

    return true;
  } catch {
    updateTorrentStatusInStore(id, "Error", store, atoms);
    return false;
  }
}

/** Pause a torrent by destroying the WebTorrent instance */
export function pauseTorrentDownload(id: string, store: ServiceStore, atoms: TorrentAtoms): void {
  const wt = activeTorrents.get(id);
  if (wt) {
    wt.destroy({}, () => {
      // Destroy callback - intentional no-op
    });
    activeTorrents.delete(id);
    lastUpdateTime.delete(id);
  }
  updateTorrentStatusInStore(id, "Paused", store, atoms);
}

/** Resume a torrent by re-adding it to the client */
export function resumeTorrentDownload(options: ResumeDownloadOptions): void {
  const { id, magnetUri, downloadPath, progress, store, atoms, onMetadata } = options;
  const newStatus: TorrentStatus = progress >= 1.0 ? "Seeding" : "Downloading";
  updateTorrentStatusInStore(id, newStatus, store, atoms);
  startTorrentDownload({ id, magnetUri, downloadPath, store, atoms, onMetadata });
}

/** Remove a torrent from active downloads */
export function removeTorrentDownload(id: string, deleteFiles = false): void {
  const wt = activeTorrents.get(id);
  if (wt) {
    wt.destroy({ destroyStore: deleteFiles }, () => {
      // Destroy callback - intentional no-op
    });
    activeTorrents.delete(id);
    lastUpdateTime.delete(id);
  }
}

/** Clear all active torrents */
export function clearActiveTorrents(): void {
  for (const [, wt] of activeTorrents) {
    wt.destroy({}, () => {
      // Destroy callback - intentional no-op
    });
  }
  activeTorrents.clear();
  lastUpdateTime.clear();
}
