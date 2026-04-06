import * as Gtk from "@gtkx/ffi/gtk";
import { GtkBox, GtkButton, GtkLabel, GtkProgressBar } from "@gtkx/react";
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
import { TorrentFileSelector } from "./TorrentFileSelector";

interface TorrentItemProps {
  torrentId: string;
}

export const TorrentItem = ({ torrentId }: TorrentItemProps) => {
  const [torrent] = useAtom(getTorrentAtom(torrentId));
  const [, setActiveStream] = useAtom(setActiveStreamAtom);
  const [showFileSelector, setShowFileSelector] = useState(false);

  if (!torrent) {
    return null;
  }

  const t = torrent;

  const handleToggleStatus = () => {
    if (t.status === "Downloading" || t.status === "Seeding" || t.status === "Streaming") {
      pauseTorrent(t.id);
    } else {
      resumeTorrent(t.id);
    }
  };

  const handleDelete = () => {
    removeTorrent(t.id, false);
  };

  const startPlayback = useCallback(
    async (fileIndex: number) => {
      const activeTorrents = getActiveTorrents();
      const streamUrl = await startStreaming(t.id, fileIndex, activeTorrents);

      if (streamUrl) {
        setActiveStream({
          torrentId: t.id,
          fileIndex,
          streamUrl,
        });
        openPlayer();
      }
    },
    [t.id, setActiveStream]
  );

  const handlePlay = useCallback(async () => {
    if (!t.videoFiles || t.videoFiles.length === 0) {
      return;
    }

    if (t.videoFiles.length === 1) {
      // Single video file - play directly
      await startPlayback(t.videoFiles[0].index);
    } else {
      // Multiple files - show selector
      setShowFileSelector(true);
    }
  }, [t.videoFiles, startPlayback]);

  const handleSelectFile = useCallback(
    async (fileIndex: number) => {
      setShowFileSelector(false);
      await startPlayback(fileIndex);
    },
    [startPlayback]
  );

  return (
    <GtkBox
      orientation={Gtk.Orientation.VERTICAL}
      spacing={8}
      marginStart={16}
      marginEnd={16}
      marginTop={12}
      marginBottom={12}
    >
      <GtkBox spacing={16} valign={Gtk.Align.CENTER}>
        <GtkBox orientation={Gtk.Orientation.VERTICAL} spacing={4} hexpand>
          <GtkLabel label={t.name} halign={Gtk.Align.START} cssClasses={["heading"]} />
          <GtkBox spacing={8}>
            <GtkLabel label={t.size} cssClasses={["dim-label"]} />
            <GtkLabel label="•" cssClasses={["dim-label"]} />
            <GtkLabel label={t.status} cssClasses={["dim-label"]} />
            {t.status === "Downloading" && (
              <>
                <GtkLabel label="•" cssClasses={["dim-label"]} />
                <GtkLabel label={`${t.speed} - ${t.peers} peers`} cssClasses={["dim-label"]} />
              </>
            )}
            {t.status === "Seeding" && (
              <>
                <GtkLabel label="•" cssClasses={["dim-label"]} />
                <GtkLabel label={`${t.peers} peers`} cssClasses={["dim-label"]} />
              </>
            )}
          </GtkBox>
        </GtkBox>
        <GtkBox spacing={8} valign={Gtk.Align.CENTER}>
          {t.videoFiles && t.videoFiles.length > 0 && (
            <GtkButton
              iconName="video-display-symbolic"
              tooltipText="Watch Video"
              cssClasses={["circular", "suggested-action"]}
              onClicked={handlePlay}
            />
          )}
          <GtkButton
            iconName={
              t.status === "Downloading" || t.status === "Seeding" || t.status === "Streaming"
                ? "media-playback-pause-symbolic"
                : "media-playback-start-symbolic"
            }
            tooltipText={
              t.status === "Downloading" || t.status === "Seeding" || t.status === "Streaming"
                ? "Pause"
                : "Resume"
            }
            cssClasses={["circular"]}
            onClicked={handleToggleStatus}
          />
          <GtkButton
            iconName="edit-delete-symbolic"
            tooltipText="Remove Torrent"
            cssClasses={["circular"]}
            onClicked={handleDelete}
          />
        </GtkBox>
      </GtkBox>
      <GtkProgressBar fraction={t.progress} showText={false} />
      {showFileSelector && t.videoFiles && (
        <TorrentFileSelector
          torrentName={t.name}
          files={t.videoFiles}
          onSelect={handleSelectFile}
          onCancel={() => setShowFileSelector(false)}
        />
      )}
    </GtkBox>
  );
};
