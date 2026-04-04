import { useState, useRef } from "react";
import {
  GtkBox,
  GtkButton,
  GtkEntry,
  GtkLabel,
  GtkPopover,
} from "@gtkx/react";
import * as Gtk from "@gtkx/ffi/gtk";
import { addTorrent } from "../services/torrentService";

interface AddTorrentPopoverProps {
  downloadPath: string;
}

export const AddTorrentPopover = ({
  downloadPath,
}: AddTorrentPopoverProps) => {
  const [magnetUri, setMagnetUri] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<Gtk.Popover>(null);

  const handleAdd = async () => {
    const text = magnetUri.trim();
    
    if (!text) {
      setError("Please enter a magnet link");
      return;
    }

    // Basic validation for magnet link
    if (!text.startsWith("magnet:")) {
      setError("Invalid magnet link. Must start with 'magnet:'");
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const torrent = await addTorrent(text, downloadPath);
      if (torrent) {
        console.log("[AddTorrentPopover] Added torrent:", torrent.id);
        setMagnetUri(""); // Clear input on success
        // Close the popover
        popoverRef.current?.popdown();
      } else {
        setError("Failed to add torrent");
      }
    } catch (err) {
      console.error("[AddTorrentPopover] Error adding torrent:", err);
      setError("An error occurred while adding the torrent");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEntryChanged = (entry: { text?: string }) => {
    setMagnetUri(entry.text || "");
    if (error) setError(null);
  };

  return (
    <GtkBox>
      <GtkButton
        iconName="list-add-symbolic"
        tooltipText="Add Torrent"
        onClicked={() => popoverRef.current?.popup()}
      />
      <GtkPopover ref={popoverRef} position={Gtk.PositionType.BOTTOM}>
        <GtkBox
          orientation={Gtk.Orientation.VERTICAL}
          spacing={12}
          marginTop={16}
          marginBottom={16}
          marginStart={16}
          marginEnd={16}
          widthRequest={400}
        >
          <GtkLabel
            label="Enter a magnet link:"
            halign={Gtk.Align.START}
          />
          
          <GtkBox spacing={8} valign={Gtk.Align.CENTER}>
            <GtkEntry
              placeholderText="magnet:?xt=urn:btih:..."
              text={magnetUri}
              onChanged={handleEntryChanged}
              hexpand
            />
            <GtkButton
              label={isAdding ? "Adding..." : "Add"}
              onClicked={handleAdd}
              sensitive={!isAdding}
            />
          </GtkBox>

          <GtkLabel
            label={`Save to: ${downloadPath || "~/Downloads"}`}
            halign={Gtk.Align.START}
            cssClasses={["dim-label"]}
          />

          {error && (
            <GtkLabel
              label={error}
              halign={Gtk.Align.START}
              cssClasses={["error"]}
            />
          )}
        </GtkBox>
      </GtkPopover>
    </GtkBox>
  );
};
