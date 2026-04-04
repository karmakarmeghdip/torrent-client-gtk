import * as Gtk from "@gtkx/ffi/gtk";
import { GtkBox, GtkButton, GtkLabel, GtkProgressBar } from "@gtkx/react";
import { useAtom, useSetAtom } from "jotai";
import { getTorrentAtom, toggleTorrentStatusAtom, deleteTorrentAtom } from "../store/torrentStore";

interface TorrentItemProps {
  torrentId: string;
}

export const TorrentItem = ({ torrentId }: TorrentItemProps) => {
  const [torrent] = useAtom(getTorrentAtom(torrentId));
  const toggleStatus = useSetAtom(toggleTorrentStatusAtom);
  const deleteTorrent = useSetAtom(deleteTorrentAtom);

  if (!torrent) return null;

  const t = torrent;

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
          <GtkLabel
            label={t.name}
            halign={Gtk.Align.START}
            cssClasses={["heading"]}
          />
          <GtkBox spacing={8}>
            <GtkLabel label={t.size} cssClasses={["dim-label"]} />
            <GtkLabel label="•" cssClasses={["dim-label"]} />
            <GtkLabel label={t.status} cssClasses={["dim-label"]} />
            {t.status === "Downloading" && (
              <>
                <GtkLabel label="•" cssClasses={["dim-label"]} />
                <GtkLabel
                  label={`${t.speed} - ${t.peers} peers`}
                  cssClasses={["dim-label"]}
                />
              </>
            )}
            {t.status === "Seeding" && (
              <>
                <GtkLabel label="•" cssClasses={["dim-label"]} />
                <GtkLabel
                  label={`Ratio: 1.5 - ${t.peers} peers`}
                  cssClasses={["dim-label"]}
                />
              </>
            )}
          </GtkBox>
        </GtkBox>
        <GtkBox spacing={8} valign={Gtk.Align.CENTER}>
          <GtkButton
            iconName={
              t.status === "Downloading" || t.status === "Seeding"
                ? "media-playback-pause-symbolic"
                : "media-playback-start-symbolic"
            }
            tooltipText={
              t.status === "Downloading" || t.status === "Seeding"
                ? "Pause"
                : "Resume"
            }
            cssClasses={["circular"]}
            onClicked={() => toggleStatus(t.id)}
          />
          <GtkButton
            iconName="edit-delete-symbolic"
            tooltipText="Remove Torrent"
            cssClasses={["circular"]}
            onClicked={() => deleteTorrent(t.id)}
          />
        </GtkBox>
      </GtkBox>
      <GtkProgressBar fraction={t.progress} showText={false} />
    </GtkBox>
  );
};
