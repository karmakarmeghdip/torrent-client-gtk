import { createStore } from "jotai";
import { addTorrentAtom } from "./store/actionAtoms";
import { torrentIdsAtom, torrentsMapAtom } from "./store/baseAtoms";
import type { Torrent } from "./types";

/**
 * Creates a Jotai store for testing purposes
 */
export function createStoreForTesting() {
  return createStore();
}

/**
 * Creates a store pre-populated with test torrents
 */
export function createStoreWithTorrents(torrents: Torrent[]) {
  const store = createStore();
  for (const torrent of torrents) {
    store.set(addTorrentAtom, torrent);
  }
  return store;
}

/**
 * Helper to get the current state of torrents
 */
export function getTorrentsState(store: ReturnType<typeof createStore>) {
  return {
    map: store.get(torrentsMapAtom),
    ids: store.get(torrentIdsAtom),
  };
}
