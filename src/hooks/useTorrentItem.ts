import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import {
  getActiveTorrents,
  pauseTorrent,
  removeTorrent,
  resumeTorrent,
} from "../services/torrentService";
import { startStreaming } from "../services/videoStreamingService";
import { getTorrentAtom, setActiveStreamAtom } from "../store";
import { isActive } from "../utils/torrent";

export function useTorrentItem(torrentId: string) {
  const [torrent] = useAtom(getTorrentAtom(torrentId));
  const [, setActiveStream] = useAtom(setActiveStreamAtom);
  const [showFileSelector, setShowFileSelector] = useState(false);

  const startPlayback = useCallback(
    async (fileIndex: number) => {
      const activeTorrents = getActiveTorrents();
      const streamUrl = await startStreaming(torrentId, fileIndex, activeTorrents);

      if (streamUrl) {
        setActiveStream({ torrentId, fileIndex, streamUrl });
      }
    },
    [torrentId, setActiveStream]
  );

  const handlePlay = useCallback(async () => {
    if (!torrent?.videoFiles || torrent.videoFiles.length === 0) {
      return;
    }
    if (torrent.videoFiles.length === 1) {
      await startPlayback(torrent.videoFiles[0].index);
    } else {
      setShowFileSelector(true);
    }
  }, [torrent?.videoFiles, startPlayback]);

  const handleSelectFile = useCallback(
    async (fileIndex: number) => {
      setShowFileSelector(false);
      await startPlayback(fileIndex);
    },
    [startPlayback]
  );

  const handleToggleStatus = useCallback(() => {
    if (!torrent) {
      return;
    }
    if (isActive(torrent.status)) {
      pauseTorrent(torrent.id);
    } else {
      resumeTorrent(torrent.id);
    }
  }, [torrent]);

  const handleDelete = useCallback(() => {
    if (!torrent) {
      return;
    }
    removeTorrent(torrent.id, false).catch((error: Error) => {
      // Error is logged but not shown to user - could be enhanced with error dialog
      throw error;
    });
  }, [torrent]);

  return {
    torrent,
    showFileSelector,
    setShowFileSelector,
    handlePlay,
    handleSelectFile,
    handleToggleStatus,
    handleDelete,
  };
}
