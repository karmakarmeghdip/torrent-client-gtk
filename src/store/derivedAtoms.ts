import { type Atom, atom } from "jotai";
import type { Torrent, TorrentStatus } from "../types";
import { isActiveTransfer } from "../utils/torrent";
import { torrentIdsAtom, torrentsMapAtom } from "./baseAtoms";

// Simple atom cache for granular torrent atoms
const torrentAtoms = new Map<string, Atom<Torrent | undefined>>();

/** Get a single torrent by ID (granular - components only re-render when this torrent changes) */
export const getTorrentAtom = (id: string): Atom<Torrent | undefined> => {
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

/** Clear a torrent atom from cache (call when torrent is deleted) */
export function clearTorrentAtom(id: string): void {
  torrentAtoms.delete(id);
}

/** Clear all torrent atoms from cache */
export function clearAllTorrentAtoms(): void {
  torrentAtoms.clear();
}

/** Get all torrents as array (for list views) */
export const allTorrentsAtom = atom((get) => {
  const ids = get(torrentIdsAtom);
  const map = get(torrentsMapAtom);
  return ids.map((id) => map.get(id)).filter((t): t is Torrent => t !== undefined);
});

/** Count of active (downloading/seeding) torrents */
export const activeTorrentsCountAtom = atom((get) => {
  const map = get(torrentsMapAtom);
  return Array.from(map.values()).filter((t) => isActiveTransfer(t.status)).length;
});

/** Count of completed torrents */
export const completedTorrentsCountAtom = atom((get) => {
  const map = get(torrentsMapAtom);
  return Array.from(map.values()).filter((t) => t.progress >= 1.0).length;
});

/** Get torrents by status */
export function getTorrentsByStatusAtom(status: TorrentStatus): Atom<Torrent[]> {
  return atom((get) => {
    const map = get(torrentsMapAtom);
    return Array.from(map.values()).filter((t) => t.status === status);
  });
}
