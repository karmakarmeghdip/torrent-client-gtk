import * as Gtk from "@gtkx/ffi/gtk";
import { GtkBox, GtkButton, GtkEntry, GtkLabel, GtkPopover } from "@gtkx/react";
import { useCallback, useRef, useState } from "react";
import { addTorrent } from "../services/torrentService";

interface AddTorrentPopoverProps {
  downloadPath: string;
}

/** Validate magnet link format */
const validateMagnetLink = (text: string): string | null => {
  if (!text) {
    return "Please enter a magnet link";
  }
  if (!text.startsWith("magnet:")) {
    return "Invalid magnet link. Must start with 'magnet:'";
  }
  return null;
};

interface AddTorrentFormProps {
  magnetUri: string;
  isAdding: boolean;
  error: string | null;
  downloadPath: string;
  onMagnetUriChange: (text: string) => void;
  onAdd: () => void;
}

const AddTorrentForm = ({
  magnetUri,
  isAdding,
  error,
  downloadPath,
  onMagnetUriChange,
  onAdd,
}: AddTorrentFormProps) => (
  <GtkBox
    orientation={Gtk.Orientation.VERTICAL}
    spacing={12}
    marginTop={16}
    marginBottom={16}
    marginStart={16}
    marginEnd={16}
    widthRequest={400}
  >
    <GtkLabel label="Enter a magnet link:" halign={Gtk.Align.START} />

    <GtkBox spacing={8} valign={Gtk.Align.CENTER}>
      <GtkEntry
        placeholderText="magnet:?xt=urn:btih:..."
        text={magnetUri}
        onChanged={(entry: { text?: string }) => onMagnetUriChange(entry.text || "")}
        hexpand
      />
      <GtkButton label={isAdding ? "Adding..." : "Add"} onClicked={onAdd} sensitive={!isAdding} />
    </GtkBox>

    <GtkLabel
      label={`Save to: ${downloadPath || "~/Downloads"}`}
      halign={Gtk.Align.START}
      cssClasses={["dim-label"]}
    />

    {error && <GtkLabel label={error} halign={Gtk.Align.START} cssClasses={["error"]} />}
  </GtkBox>
);

export const AddTorrentPopover = ({ downloadPath }: AddTorrentPopoverProps) => {
  const [magnetUri, setMagnetUri] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<Gtk.Popover>(null);

  const handleAdd = useCallback(async () => {
    const text = magnetUri.trim();
    const validationError = validateMagnetLink(text);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const torrent = await addTorrent(text, downloadPath);
      if (torrent) {
        setMagnetUri("");
        popoverRef.current?.popdown();
      } else {
        setError("Failed to add torrent");
      }
    } catch {
      setError("An error occurred while adding the torrent");
    } finally {
      setIsAdding(false);
    }
  }, [magnetUri, downloadPath]);

  const handleMagnetUriChange = useCallback(
    (text: string) => {
      setMagnetUri(text);
      if (error) {
        setError(null);
      }
    },
    [error]
  );

  return (
    <GtkBox>
      <GtkButton
        iconName="list-add-symbolic"
        tooltipText="Add Torrent"
        onClicked={() => popoverRef.current?.popup()}
      />
      <GtkPopover ref={popoverRef} position={Gtk.PositionType.BOTTOM}>
        <AddTorrentForm
          magnetUri={magnetUri}
          isAdding={isAdding}
          error={error}
          downloadPath={downloadPath}
          onMagnetUriChange={handleMagnetUriChange}
          onAdd={handleAdd}
        />
      </GtkPopover>
    </GtkBox>
  );
};
