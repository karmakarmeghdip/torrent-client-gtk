import {
  AdwHeaderBar,
  AdwWindowTitle,
  GtkButton,
  GtkMenuButton,
  GtkPopoverMenu,
  quit,
} from "@gtkx/react";
import { AddTorrentPopover } from "./AddTorrentPopover";

interface HeaderProps {
  onShowPreferences: () => void;
  onShowAbout: () => void;
  onResumeAll: () => void;
  onPauseAll: () => void;
  downloadPath: string;
}

export const Header = ({
  onShowPreferences,
  onShowAbout,
  onResumeAll,
  onPauseAll,
  downloadPath,
}: HeaderProps) => {
  return (
    <AdwHeaderBar titleWidget={<AdwWindowTitle title="Downloads" subtitle="" />}>
      <AdwHeaderBar.PackStart>
        <AddTorrentPopover downloadPath={downloadPath} />
      </AdwHeaderBar.PackStart>
      <AdwHeaderBar.PackEnd>
        <GtkMenuButton
          iconName="open-menu-symbolic"
          tooltipText="Menu"
          popover={
            <GtkPopoverMenu>
              <GtkPopoverMenu.MenuSection>
                <GtkPopoverMenu.MenuItem
                  id="preferences"
                  label="Preferences"
                  onActivate={onShowPreferences}
                />
                <GtkPopoverMenu.MenuItem
                  id="shortcuts"
                  label="Keyboard Shortcuts"
                  onActivate={() => {
                    // TODO: Implement keyboard shortcuts dialog
                  }}
                />
              </GtkPopoverMenu.MenuSection>
              <GtkPopoverMenu.MenuSection>
                <GtkPopoverMenu.MenuItem
                  id="about"
                  label="About Torrent Client"
                  onActivate={onShowAbout}
                />
                <GtkPopoverMenu.MenuItem
                  id="quit"
                  label="Quit"
                  onActivate={quit}
                  accels="<Control>q"
                />
              </GtkPopoverMenu.MenuSection>
            </GtkPopoverMenu>
          }
        />
        <GtkButton
          iconName="media-playback-start-symbolic"
          tooltipText="Resume All"
          onClicked={onResumeAll}
        />
        <GtkButton
          iconName="media-playback-pause-symbolic"
          tooltipText="Pause All"
          onClicked={onPauseAll}
        />
      </AdwHeaderBar.PackEnd>
    </AdwHeaderBar>
  );
};
