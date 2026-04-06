import { GtkListView, GtkScrolledWindow } from "@gtkx/react";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { torrentIdsAtom } from "../store";
import { TorrentItem } from "./TorrentItem";

export const TorrentList = () => {
  const [torrentIds] = useAtom(torrentIdsAtom);

  // Memoize items array to prevent unnecessary re-renders
  const items = useMemo(() => torrentIds.map((id) => ({ id, value: id })), [torrentIds]);

  return (
    <GtkScrolledWindow vexpand cssClasses={["view"]}>
      <GtkListView
        estimatedItemHeight={80}
        items={items}
        renderItem={(id: string) => <TorrentItem torrentId={id} />}
      />
    </GtkScrolledWindow>
  );
};
