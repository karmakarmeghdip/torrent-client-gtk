import { useCallback } from "react";
import { pauseTorrent, resumeTorrent } from "../services/torrentService";
import type { TorrentStatus } from "../types";
import { isActiveTransfer } from "../utils/torrent";

interface Torrent {
  id: string;
  status: TorrentStatus;
}

export function useTorrentHandlers(torrents: Torrent[]) {
  const handleResumeAll = useCallback(() => {
    for (const t of torrents) {
      if (t.status === "Paused") {
        resumeTorrent(t.id);
      }
    }
  }, [torrents]);

  const handlePauseAll = useCallback(() => {
    for (const t of torrents) {
      if (isActiveTransfer(t.status)) {
        pauseTorrent(t.id);
      }
    }
  }, [torrents]);

  return { handleResumeAll, handlePauseAll };
}
