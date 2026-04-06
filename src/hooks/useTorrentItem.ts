import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import { openPlayer } from "../services/playerService";
import {
  getActiveTorrents,
  pauseTorrent,
  removeTorrent,
  resumeTorrent,
} from "../services/torrentService";
import { startStreaming } from "../services/videoStreamingService";
import { getTorrentAtom, setActiveStreamAtom } from "../store/torrentStore";

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
        openPlayer();
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
    const t = torrent;
    if (t.status === "Downloading" || t.status === "Seeding" || t.status === "Streaming") {
      pauseTorrent(t.id);
    } else {
      resumeTorrent(t.id);
    }
  }, [torrent]);

  const handleDelete = useCallback(() => {
    if (!torrent) {
      return;
    }
    removeTorrent(torrent.id, false).catch(() => {
      // Remove errors are silent
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
