import { useAtom } from "jotai";
import { useCallback } from "react";
import { pauseTorrent, resumeTorrent } from "../services/torrentService";
import { torrentHandlersInfoAtom } from "../store";
import { isActiveTransfer } from "../utils/torrent";

export function useTorrentHandlers() {
  const [torrents] = useAtom(torrentHandlersInfoAtom);

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
