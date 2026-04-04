import { GtkListView, GtkScrolledWindow } from "@gtkx/react";
import { useAtom } from "jotai";
import { torrentIdsAtom } from "../store/torrentStore";
import { TorrentItem } from "./TorrentItem";

export const TorrentList = () => {
  const [torrentIds] = useAtom(torrentIdsAtom);

  return (
    <GtkScrolledWindow vexpand cssClasses={["view"]}>
      <GtkListView
        estimatedItemHeight={80}
        items={torrentIds.map((id) => ({ id, value: id }))}
        renderItem={(id: string) => <TorrentItem torrentId={id} />}
      />
    </GtkScrolledWindow>
  );
};
