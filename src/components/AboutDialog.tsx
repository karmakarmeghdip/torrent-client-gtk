import * as Gtk from "@gtkx/ffi/gtk";
import { AdwAboutDialog } from "@gtkx/react";

interface AboutDialogProps {
  onClosed: () => void;
}

export const AboutDialog = ({ onClosed }: AboutDialogProps) => (
  <AdwAboutDialog
    applicationName="Torrent Client"
    developerName="GTKX"
    version="0.0.1"
    comments="A modern, fast, and beautiful torrent client built with React and GTK4."
    website="https://github.com/gtkx"
    issueUrl="https://github.com/gtkx/issues"
    licenseType={Gtk.License.MIT_X11}
    onClosed={onClosed}
  />
);
