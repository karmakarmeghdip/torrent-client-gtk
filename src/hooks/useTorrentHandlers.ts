import { useCallback } from "react";
import { pauseTorrent, resumeTorrent } from "../services/torrentService";

interface Torrent {
  id: string;
  status: string;
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
      if (t.status === "Downloading" || t.status === "Seeding") {
        pauseTorrent(t.id);
      }
    }
  }, [torrents]);

  return { handleResumeAll, handlePauseAll };
}
