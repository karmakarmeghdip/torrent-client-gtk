import * as Gtk from "@gtkx/ffi/gtk";
import {
  AdwDialog,
  AdwHeaderBar,
  AdwToolbarView,
  AdwWindowTitle,
  GtkBox,
  GtkButton,
  GtkLabel,
  GtkListView,
  GtkScrolledWindow,
} from "@gtkx/react";
import type { TorrentVideoFile } from "../types";

interface TorrentFileSelectorProps {
  torrentName: string;
  files: TorrentVideoFile[];
  onSelect: (fileIndex: number) => void;
  onCancel: () => void;
}

export const TorrentFileSelector = ({
  torrentName,
  files,
  onSelect,
  onCancel,
}: TorrentFileSelectorProps) => (
  <AdwDialog
    title={`Play: ${torrentName}`}
  >
    <AdwToolbarView>
      <AdwToolbarView.AddTopBar>
        <AdwHeaderBar
          titleWidget={
            <AdwWindowTitle title="Select Video File" subtitle="" />
          }
          showEndTitleButtons={false}
        >
          <AdwHeaderBar.PackStart>
            <GtkButton label="Cancel" onClicked={onCancel} />
          </AdwHeaderBar.PackStart>
        </AdwHeaderBar>
      </AdwToolbarView.AddTopBar>

      <GtkBox
        orientation={Gtk.Orientation.VERTICAL}
        spacing={12}
        marginTop={12}
        marginBottom={12}
        marginStart={12}
        marginEnd={12}
      >
        <GtkLabel
          label={`${files.length} video file(s) found:`}
          halign={Gtk.Align.START}
          cssClasses={["heading"]}
        />

        <GtkScrolledWindow vexpand>
          <GtkListView
            estimatedItemHeight={60}
            items={files.map((f) => ({ id: String(f.index), value: f }))}
            renderItem={(file: TorrentVideoFile) => (
              <GtkBox
                orientation={Gtk.Orientation.HORIZONTAL}
                spacing={12}
                marginTop={8}
                marginBottom={8}
                valign={Gtk.Align.CENTER}
              >
                <GtkBox
                  orientation={Gtk.Orientation.VERTICAL}
                  hexpand
                  spacing={4}
                >
                  <GtkLabel
                    label={file.name}
                    halign={Gtk.Align.START}
                    ellipsize={3} // Pango.EllipsizeMode.MIDDLE = 2, but using number for compatibility
                  />
                  <GtkLabel
                    label={file.size}
                    halign={Gtk.Align.START}
                    cssClasses={["dim-label"]}
                  />
                </GtkBox>
                <GtkButton
                  label="Play"
                  cssClasses={["suggested-action"]}
                  onClicked={() => onSelect(file.index)}
                />
              </GtkBox>
            )}
          />
        </GtkScrolledWindow>
      </GtkBox>
    </AdwToolbarView>
  </AdwDialog>
);
