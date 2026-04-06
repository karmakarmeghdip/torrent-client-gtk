import * as Gtk from "@gtkx/ffi/gtk";
import { GtkBox, GtkButton, GtkLabel, GtkProgressBar } from "@gtkx/react";
import { useTorrentItem } from "../hooks/useTorrentItem";
import { TorrentFileSelector } from "./TorrentFileSelector";

interface TorrentItemProps {
  torrentId: string;
}

export const TorrentItem = ({ torrentId }: TorrentItemProps) => {
  const {
    torrent,
    showFileSelector,
    setShowFileSelector,
    handlePlay,
    handleSelectFile,
    handleToggleStatus,
    handleDelete,
  } = useTorrentItem(torrentId);
  if (!torrent) {
    return null;
  }
  const { status, videoFiles, name, size, speed, peers, progress } = torrent;
  const isActive = status === "Downloading" || status === "Seeding" || status === "Streaming";
  const showPeers = status === "Downloading" || status === "Seeding";
  const peersLabel = `${status === "Downloading" ? `${speed} - ` : ""}${peers} peers`;

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
          <GtkLabel label={name} halign={Gtk.Align.START} cssClasses={["heading"]} />
          <GtkBox spacing={8}>
            <GtkLabel label={size} cssClasses={["dim-label"]} />
            <GtkLabel label="•" cssClasses={["dim-label"]} />
            <GtkLabel label={status} cssClasses={["dim-label"]} />
            {showPeers && (
              <>
                <GtkLabel label="•" cssClasses={["dim-label"]} />
                <GtkLabel label={peersLabel} cssClasses={["dim-label"]} />
              </>
            )}
          </GtkBox>
        </GtkBox>
        <GtkBox spacing={8} valign={Gtk.Align.CENTER}>
          {videoFiles && videoFiles.length > 0 && (
            <GtkButton
              iconName="video-display-symbolic"
              tooltipText="Watch Video"
              cssClasses={["circular", "suggested-action"]}
              onClicked={handlePlay}
            />
          )}
          <GtkButton
            iconName={isActive ? "media-playback-pause-symbolic" : "media-playback-start-symbolic"}
            tooltipText={isActive ? "Pause" : "Resume"}
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
      <GtkProgressBar fraction={progress} showText={false} />
      {showFileSelector && videoFiles && (
        <TorrentFileSelector
          torrentName={name}
          files={videoFiles}
          onSelect={handleSelectFile}
          onCancel={() => setShowFileSelector(false)}
        />
      )}
    </GtkBox>
  );
};
