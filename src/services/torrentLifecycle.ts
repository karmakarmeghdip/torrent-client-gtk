import type { WritableAtom } from "jotai";
import type { Torrent as WebTorrentClient } from "webtorrent";
import type { PersistedTorrent, Torrent } from "../types";
import { formatBytes, generateIdFromMagnet } from "../utils/format";
import { loadConfig } from "./configService";
import { errorService } from "./errorService";
import { addPersistedTorrent, removePersistedTorrent } from "./stateService";
import { getClient } from "./torrentClient";
import { startTorrentDownload } from "./torrentDownload";
import type { ServiceStore } from "./types";
import { getVideoFiles } from "./videoStreamingService";

/** Type for store atoms */
interface StoreAtoms {
  torrentsMapAtom: WritableAtom<Map<string, Torrent>, [Map<string, Torrent>], void>;
  addTorrentAtom: WritableAtom<null, [Torrent], void>;
  deleteTorrentAtom: WritableAtom<null, [string], void>;
  setTorrentVideoFilesAtom: WritableAtom<
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

/** Options for handling torrent metadata */
interface MetadataOptions {
  id: string;
  wt: WebTorrentClient;
  magnetUri: string;
  downloadPath: string;
  store: ServiceStore;
  atoms: StoreAtoms;
}

/** Handle torrent metadata ready */
function handleTorrentMetadata(options: MetadataOptions): void {
  const { id, wt, magnetUri, downloadPath, store, atoms } = options;
  const size = formatBytes(wt.length);
  const map = store.get(atoms.torrentsMapAtom);
  const existing = map.get(id);
  if (!existing) {
    return;
  }

  // Detect video files
  const videoFiles = getVideoFiles(wt);

  store.set(
    atoms.torrentsMapAtom,
    new Map(map).set(id, {
      ...existing,
      name: wt.name,
      size,
      videoFiles: videoFiles.length > 0 ? videoFiles : undefined,
    })
  );

  // Also update via the dedicated atom for video files
  if (videoFiles.length > 0) {
    store.set(atoms.setTorrentVideoFilesAtom, { id, files: videoFiles });
  }

  // Update persisted state with name
  const persisted: PersistedTorrent = {
    id,
    magnetUri,
    downloadPath,
    name: wt.name,
    addedAt: existing.addedAt,
  };
  addPersistedTorrent(persisted).catch(() => {
    // Persist errors are non-fatal - show as toast
    errorService.warn("Failed to save torrent state", "StateService");
  });
}

/** Add a new torrent from magnet URI */
export async function addTorrent(
  magnetUri: string,
  store: ServiceStore,
  atoms: StoreAtoms,
  downloadPath?: string
): Promise<Torrent | null> {
  const client = getClient();
  if (!client) {
    return null;
  }

  try {
    // Load config to get default download path if not provided
    const config = await loadConfig();
    const path = downloadPath || config.downloadPath;

    // Generate unique ID
    const id = generateIdFromMagnet(magnetUri);

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
    store.set(atoms.addTorrentAtom, torrent);

    // Start downloading if auto-start is enabled
    if (config.autoStart) {
      const onMetadata = (tid: string, wt: WebTorrentClient) => {
        handleTorrentMetadata({ id: tid, wt, magnetUri, downloadPath: path, store, atoms });
      };
      startTorrentDownload({ id, magnetUri, downloadPath: path, store, atoms, onMetadata });
    }

    return torrent;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    errorService.error(`Failed to add torrent: ${message}`, "TorrentLifecycle");
    return null;
  }
}

/** Remove a torrent */
export async function removeTorrent(
  id: string,
  store: ServiceStore,
  atoms: StoreAtoms,
  deleteFiles = false
): Promise<void> {
  // Import here to avoid circular dependency
  const { removeTorrentDownload } = await import("./torrentDownload");

  // Stop the torrent if active
  removeTorrentDownload(id, deleteFiles);

  // Remove from persisted state
  await removePersistedTorrent(id);

  // Remove from jotai store
  store.set(atoms.deleteTorrentAtom, id);
}

/** Restore persisted torrents from state file */
export async function restorePersistedTorrents(
  store: ServiceStore,
  atoms: StoreAtoms
): Promise<void> {
  const config = await loadConfig();
  const { loadState } = await import("./stateService");
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
    store.set(atoms.addTorrentAtom, torrent);

    // If auto-start is enabled, start downloading
    if (config.autoStart) {
      const { magnetUri, downloadPath, id } = persisted;
      const onMetadata = (tid: string, wt: WebTorrentClient) => {
        handleTorrentMetadata({ id: tid, wt, magnetUri, downloadPath, store, atoms });
      };
      startTorrentDownload({ id, magnetUri, downloadPath, store, atoms, onMetadata });
    }
  }
}
