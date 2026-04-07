import * as Gtk from "@gtkx/ffi/gtk";
import { AdwStatusPage, GtkBox } from "@gtkx/react";

export const HomePage = () => {
  return (
    <GtkBox vexpand hexpand halign={Gtk.Align.FILL}>
      <AdwStatusPage
        iconName="network-wireless-symbolic"
        title="Discover New Torrents"
        description="Browse the latest releases from your configured sources. This feature is coming soon!"
        vexpand
        hexpand
      />
    </GtkBox>
  );
};
