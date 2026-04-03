import { GtkListView, GtkScrolledWindow } from "@gtkx/react";
import { Torrent } from "../types";
import { TorrentItem } from "./TorrentItem";

interface TorrentListProps {
  torrents: Torrent[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TorrentList = ({
  torrents,
  onToggleStatus,
  onDelete,
}: TorrentListProps) => (
  <GtkScrolledWindow vexpand cssClasses={["view"]}>
    <GtkListView
      estimatedItemHeight={80}
      items={torrents.map((t) => ({ id: t.id, value: t }))}
      renderItem={(t: Torrent) => (
        <TorrentItem
          torrent={t}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      )}
    />
  </GtkScrolledWindow>
);
