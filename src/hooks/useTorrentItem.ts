import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import { errorService } from "../services/errorService";
import {
  getActiveTorrents,
  pauseTorrent,
  removeTorrent,
  resumeTorrent,
} from "../services/torrentService";
import { startStreaming } from "../services/videoStreamingService";
import { getTorrentAtom, setActiveStreamAtom } from "../store";
import { createLogger } from "../utils/logger";
import { isActive } from "../utils/torrent";

const log = createLogger("useTorrentItem");

async function ensureTorrentActive(torrentId: string): Promise<boolean> {
  const activeTorrents = getActiveTorrents();
  if (activeTorrents.has(torrentId)) {
    return true;
  }
  log.info("ensureTorrentActive: resuming...", { torrentId });
  resumeTorrent(torrentId);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return getActiveTorrents().has(torrentId);
}

export function useTorrentItem(torrentId: string) {
  const [torrent] = useAtom(getTorrentAtom(torrentId));
  const [, setActiveStream] = useAtom(setActiveStreamAtom);
  const [showFileSelector, setShowFileSelector] = useState(false);

  const startPlayback = useCallback(
    async (fileIndex: number) => {
      try {
        log.info("startPlayback", { torrentId, fileIndex });
        const isActiveNow = await ensureTorrentActive(torrentId);
        if (!isActiveNow) {
          log.error("startPlayback: failed to resume torrent", { torrentId });
          errorService.error("Failed to resume torrent for streaming", "VideoPlayer");
          return;
        }
        const streamUrl = await startStreaming(torrentId, fileIndex, getActiveTorrents());
        if (!streamUrl) {
          log.error("startPlayback: failed to get stream URL", { torrentId, fileIndex });
          errorService.error("Failed to start video streaming", "VideoPlayer");
          return;
        }
        log.debug("startPlayback: got stream URL, setting active stream");
        setActiveStream({ torrentId, fileIndex, streamUrl });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        log.error("startPlayback: unexpected error", { torrentId, error: message });
        errorService.error(`Failed to start playback: ${message}`, "VideoPlayer");
      }
    },
    [torrentId, setActiveStream]
  );

  const handlePlay = useCallback(async () => {
    try {
      log.debug("handlePlay", { torrentId, hasVideoFiles: !!torrent?.videoFiles });
      if (!torrent?.videoFiles || torrent.videoFiles.length === 0) {
        log.warn("handlePlay: no video files");
        return;
      }
      if (torrent.videoFiles.length === 1) {
        await startPlayback(torrent.videoFiles[0].index);
      } else {
        setShowFileSelector(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      log.error("handlePlay: error", { torrentId, error: message });
      errorService.error(`Failed to play video: ${message}`, "VideoPlayer");
    }
  }, [torrent?.videoFiles, startPlayback, torrentId]);

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
    log.info("handleToggleStatus", { torrentId, status: torrent.status });
    try {
      if (isActive(torrent.status)) {
        pauseTorrent(torrent.id);
      } else {
        resumeTorrent(torrent.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errorService.error(`Failed to toggle status: ${message}`, "TorrentItem");
    }
  }, [torrent, torrentId]);

  const handleDelete = useCallback(async () => {
    if (!torrent) {
      return;
    }
    log.info("handleDelete", { torrentId });
    try {
      await removeTorrent(torrent.id, false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errorService.error(`Failed to remove torrent: ${message}`, "TorrentItem");
    }
  }, [torrent, torrentId]);

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
