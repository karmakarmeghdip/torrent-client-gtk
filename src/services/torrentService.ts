import type { Torrent as WebTorrentClient } from "webtorrent";
import { initializeClient, setServiceStore, shutdownClient } from "./torrentClient";
import {
  clearActiveTorrents,
  getActiveTorrents,
  pauseTorrentDownload,
  resumeTorrentDownload,
} from "./torrentDownload";
import { addTorrent, removeTorrent, restorePersistedTorrents } from "./torrentLifecycle";
import type { ServiceStore } from "./types";
import {
  initializeVideoServer,
  setStreamingClient,
  shutdownVideoServer,
} from "./videoStreamingService";

// Type for store atoms
interface StoreAtoms {
  torrentsMapAtom: import("jotai").WritableAtom<
    Map<string, import("../types").Torrent>,
    [Map<string, import("../types").Torrent>],
    void
  >;
  addTorrentAtom: import("jotai").WritableAtom<null, [import("../types").Torrent], void>;
  deleteTorrentAtom: import("jotai").WritableAtom<null, [string], void>;
  setTorrentVideoFilesAtom: import("jotai").WritableAtom<
    null,
    [
      {
        id: string;
        files: Array<{ index: number; name: string; path: string; size: string; type: string }>;
      },
    ],
    void
  >;
}

// Lazy-loaded atoms to avoid circular dependencies
let torrentAtoms: StoreAtoms | null = null;

// Store reference
let storeRef: ServiceStore | null = null;

/** Initialize the torrent service */
export async function initializeTorrentService(store: ServiceStore): Promise<void> {
  storeRef = store;
  setServiceStore(store);

  // Lazy import atoms
  const storeModule = await import("../store");
  torrentAtoms = {
    torrentsMapAtom: storeModule.torrentsMapAtom,
    addTorrentAtom: storeModule.addTorrentAtom,
    deleteTorrentAtom: storeModule.deleteTorrentAtom,
    setTorrentVideoFilesAtom: storeModule.setTorrentVideoFilesAtom,
  };

  // Create WebTorrent client
  initializeClient();

  // Set client reference for video streaming
  setStreamingClient(initializeClient());

  // Initialize video streaming server
  initializeVideoServer();

  // Restore persisted torrents
  if (torrentAtoms) {
    await restorePersistedTorrents(store, torrentAtoms);
  }
}

/** Shutdown the torrent service */
export function shutdownTorrentService(): void {
  shutdownVideoServer();
  clearActiveTorrents();
  shutdownClient();
  storeRef = null;
  torrentAtoms = null;
}

/** Get active torrents map */
export function getActiveTorrentsMap(): Map<string, WebTorrentClient> {
  return getActiveTorrents();
}

/** Pause a torrent */
export function pauseTorrent(id: string): void {
  if (!(torrentAtoms && storeRef)) {
    return;
  }
  pauseTorrentDownload(id, storeRef, torrentAtoms);
}

/** Resume a torrent */
export function resumeTorrent(id: string): void {
  if (!(torrentAtoms && storeRef)) {
    return;
  }

  const map = storeRef.get(torrentAtoms.torrentsMapAtom);
  const torrent = map.get(id);
  if (!torrent) {
    return;
  }

  const onMetadata = () => {
    // Metadata is handled by lifecycle service
  };

  resumeTorrentDownload({
    id,
    magnetUri: torrent.magnetUri,
    downloadPath: torrent.downloadPath,
    progress: torrent.progress,
    store: storeRef,
    atoms: torrentAtoms,
    onMetadata,
  });
}

/** Remove a torrent */
export async function removeTorrentById(id: string, deleteFiles = false): Promise<void> {
  if (!(torrentAtoms && storeRef)) {
    return;
  }
  await removeTorrent(id, storeRef, torrentAtoms, deleteFiles);
}

/** Add a new torrent from magnet URI */
export async function addTorrentFromMagnet(
  magnetUri: string,
  downloadPath?: string
): Promise<import("../types").Torrent | null> {
  if (!(torrentAtoms && storeRef)) {
    return null;
  }
  return await addTorrent(magnetUri, storeRef, torrentAtoms, downloadPath);
}

// Re-exports for backwards compatibility
export {
  addTorrentFromMagnet as addTorrent,
  getActiveTorrentsMap as getActiveTorrents,
  removeTorrentById as removeTorrent,
};
