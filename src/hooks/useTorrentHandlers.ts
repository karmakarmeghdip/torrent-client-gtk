import { getDefaultStore } from "jotai";
import { useCallback } from "react";
import { pauseTorrent, resumeTorrent } from "../services/torrentService";
import { torrentsMapAtom } from "../store/baseAtoms";
import { isActiveTransfer } from "../utils/torrent";

// Stable callback references that read from store when executed
export function useTorrentHandlers() {
  const handleResumeAll = useCallback(() => {
    const store = getDefaultStore();
    const map = store.get(torrentsMapAtom);
    // Resume all paused torrents
    for (const [id, torrent] of map) {
      if (torrent.status === "Paused") {
        resumeTorrent(id);
      }
    }
  }, []);

  const handlePauseAll = useCallback(() => {
    const store = getDefaultStore();
    const map = store.get(torrentsMapAtom);
    // Pause all active torrents
    for (const [id, torrent] of map) {
      if (isActiveTransfer(torrent.status)) {
        pauseTorrent(id);
      }
    }
  }, []);

  return { handleResumeAll, handlePauseAll };
}
