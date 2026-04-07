import * as Gtk from "@gtkx/ffi/gtk";
import {
  AdwApplicationWindow,
  AdwHeaderBar,
  AdwNavigationView,
  AdwStatusPage,
  AdwToolbarView,
  AdwWindowTitle,
  GtkBox,
  GtkButton,
  GtkMenuButton,
  GtkPopoverMenu,
  quit,
} from "@gtkx/react";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { AboutDialog } from "./components/AboutDialog";
import { AddTorrentPopover } from "./components/AddTorrentPopover";
import { HomePage } from "./components/HomePage";
import { PreferencesDialog } from "./components/PreferencesDialog";
import type { PageId } from "./components/Sidebar";
import { Sidebar } from "./components/Sidebar";
import { TorrentList } from "./components/TorrentList";
import { VideoPlayerPage } from "./components/VideoPlayerPage";
import { useAppSetup } from "./hooks/useAppSetup";
import { useTorrentHandlers } from "./hooks/useTorrentHandlers";
import { errorService } from "./services/errorService";
import { getActiveTorrents } from "./services/torrentService";
import {
  addFatalErrorAtom,
  addToastAtom,
  closePlayerAtom,
  createErrorReporter,
  torrentIdsAtom,
} from "./store";
import { injectStyles } from "./styles";
import { createLogger } from "./utils/logger";

injectStyles();

const log = createLogger("app");

// Content area that switches between home and downloads
const ContentArea = ({
  currentPage,
  hasTorrents,
}: {
  currentPage: PageId;
  hasTorrents: boolean;
}) => {
  if (currentPage === "home") {
    return <HomePage />;
  }
  if (hasTorrents) {
    return <TorrentList />;
  }

  // Empty downloads state
  const messages = [
    "The silence is deafening...",
    "Nothing but crickets here!",
    "Your hard drive thanks you for the break.",
    "Zero bytes, zero worries.",
    "Ready when you are!",
  ];
  return (
    <AdwStatusPage
      iconName="folder-download-symbolic"
      title="No Active Downloads"
      description={messages[Math.floor(Math.random() * messages.length)]}
      vexpand
      hexpand
    />
  );
};

// Main window title - always "Torrent Client"
const MainTitle = () => <AdwWindowTitle title="Torrent Client" subtitle="" />;

// Header actions based on current page
const HeaderActions = ({
  currentPage,
  downloadPath,
  onShowPreferences,
  onShowAbout,
  onResumeAll,
  onPauseAll,
}: {
  currentPage: PageId;
  downloadPath: string;
  onShowPreferences: () => void;
  onShowAbout: () => void;
  onResumeAll: () => void;
  onPauseAll: () => void;
}) => {
  const menuPopover = (
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
            /* TODO: Show keyboard shortcuts */
          }}
        />
      </GtkPopoverMenu.MenuSection>
      <GtkPopoverMenu.MenuSection>
        <GtkPopoverMenu.MenuItem id="about" label="About Torrent Client" onActivate={onShowAbout} />
        <GtkPopoverMenu.MenuItem id="quit" label="Quit" onActivate={quit} accels="<Control>q" />
      </GtkPopoverMenu.MenuSection>
    </GtkPopoverMenu>
  );

  if (currentPage === "home") {
    return (
      <>
        <AdwHeaderBar.PackStart>
          <AddTorrentPopover downloadPath={downloadPath} />
        </AdwHeaderBar.PackStart>
        <AdwHeaderBar.PackEnd>
          <GtkMenuButton iconName="open-menu-symbolic" tooltipText="Menu" popover={menuPopover} />
        </AdwHeaderBar.PackEnd>
      </>
    );
  }

  return (
    <>
      <AdwHeaderBar.PackStart>
        <AddTorrentPopover downloadPath={downloadPath} />
      </AdwHeaderBar.PackStart>
      <AdwHeaderBar.PackEnd>
        <GtkMenuButton iconName="open-menu-symbolic" tooltipText="Menu" popover={menuPopover} />
        <GtkBox cssClasses={["linked"]} marginEnd={8}>
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
        </GtkBox>
      </AdwHeaderBar.PackEnd>
    </>
  );
};

export const App = () => {
  const { handleResumeAll, handlePauseAll } = useTorrentHandlers();
  const {
    config,
    playerState,
    showAbout,
    setShowAbout,
    showPreferences,
    setShowPreferences,
    navigationHistory,
    setNavigationHistory,
    windowRef,
    toggleDarkMode,
    toggleNotifications,
    toggleAutoStart,
    updateDownloadPath,
  } = useAppSetup();

  const torrentIds = useAtomValue(torrentIdsAtom);
  const downloadCount = torrentIds.length;
  const hasTorrents = downloadCount > 0;
  const setFatalError = useSetAtom(addFatalErrorAtom);
  const showToast = useSetAtom(addToastAtom);
  const closePlayer = useSetAtom(closePlayerAtom);
  const [currentPage, setCurrentPage] = useState<PageId>("home");

  useEffect(() => {
    log.debug("App mounted");
    errorService.setReporter(createErrorReporter(setFatalError, showToast));
  }, [setFatalError, showToast]);

  useEffect(() => {
    log.debug("Player state changed", {
      isPlaying: playerState.isPlaying,
      torrentId: playerState.torrentId,
    });
  }, [playerState.isPlaying, playerState.torrentId]);

  const handleHistoryChanged = (newHistory: string[]) => {
    log.debug("handleHistoryChanged", { newHistory, isPlaying: playerState.isPlaying });
    setNavigationHistory(newHistory);
    if (!newHistory.includes("video-player") && playerState.isPlaying) {
      log.info("Navigated away from video-player, closing player");
      closePlayer();
    }
  };

  return (
    <AdwApplicationWindow
      title="Torrent Client"
      defaultWidth={900}
      defaultHeight={700}
      onClose={quit}
      ref={windowRef}
    >
      <AdwNavigationView history={navigationHistory} onHistoryChanged={handleHistoryChanged}>
        <AdwNavigationView.Page id="main" title="Torrent Client">
          <AdwToolbarView>
            <AdwToolbarView.AddTopBar>
              <AdwHeaderBar titleWidget={<MainTitle />}>
                <HeaderActions
                  currentPage={currentPage}
                  downloadPath={config.downloadPath}
                  onShowPreferences={() => setShowPreferences(true)}
                  onShowAbout={() => setShowAbout(true)}
                  onResumeAll={handleResumeAll}
                  onPauseAll={handlePauseAll}
                />
              </AdwHeaderBar>
            </AdwToolbarView.AddTopBar>

            <GtkBox orientation={Gtk.Orientation.HORIZONTAL} vexpand hexpand>
              <Sidebar
                activePage={currentPage}
                downloadCount={downloadCount}
                onPageChange={setCurrentPage}
              />
              <GtkBox vexpand hexpand>
                <ContentArea currentPage={currentPage} hasTorrents={hasTorrents} />
              </GtkBox>
            </GtkBox>
          </AdwToolbarView>
        </AdwNavigationView.Page>
        {playerState.isPlaying && (
          <VideoPlayerPage activeTorrents={getActiveTorrents()} windowRef={windowRef} />
        )}
      </AdwNavigationView>
      {showPreferences && (
        <PreferencesDialog
          darkMode={config.darkMode}
          onDarkModeToggle={toggleDarkMode}
          notifications={config.notifications}
          onNotificationsToggle={toggleNotifications}
          autoStart={config.autoStart}
          onAutoStartToggle={toggleAutoStart}
          downloadPath={config.downloadPath}
          onDownloadPathChange={updateDownloadPath}
          onClosed={() => setShowPreferences(false)}
        />
      )}
      {showAbout && <AboutDialog onClosed={() => setShowAbout(false)} />}
    </AdwApplicationWindow>
  );
};
