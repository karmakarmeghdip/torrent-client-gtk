import { AdwApplicationWindow, AdwNavigationView, AdwToolbarView, quit } from "@gtkx/react";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { AboutDialog } from "./components/AboutDialog";
import { ErrorDisplay } from "./components/ErrorDisplay";
import { Header } from "./components/Header";
import { PreferencesDialog } from "./components/PreferencesDialog";
import { TorrentList } from "./components/TorrentList";
import { VideoPlayerPage } from "./components/VideoPlayerPage";
import { useAppSetup } from "./hooks/useAppSetup";
import { useTorrentHandlers } from "./hooks/useTorrentHandlers";
import { errorService } from "./services/errorService";
import { getActiveTorrents } from "./services/torrentService";
import { addFatalErrorAtom, addToastAtom, closePlayerAtom, createErrorReporter } from "./store";
import { injectStyles } from "./styles";
import { createLogger } from "./utils/logger";

injectStyles();

const log = createLogger("app");

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

  const setFatalError = useSetAtom(addFatalErrorAtom);
  const showToast = useSetAtom(addToastAtom);
  const closePlayer = useSetAtom(closePlayerAtom);

  useEffect(() => {
    log.debug("App mounted");
    const reporter = createErrorReporter(setFatalError, showToast);
    errorService.setReporter(reporter);
  }, [setFatalError, showToast]);

  useEffect(() => {
    log.debug("Player state changed", {
      isPlaying: playerState.isPlaying,
      torrentId: playerState.torrentId,
    });
  }, [playerState.isPlaying, playerState.torrentId]);

  useEffect(() => {
    log.debug("Navigation history changed", { history: navigationHistory });
  }, [navigationHistory]);

  // Close player when navigating away from video-player page
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
      defaultWidth={800}
      defaultHeight={600}
      onClose={quit}
      ref={windowRef}
    >
      <AdwNavigationView history={navigationHistory} onHistoryChanged={handleHistoryChanged}>
        <AdwNavigationView.Page id="torrents" title="Torrents">
          <AdwToolbarView>
            <AdwToolbarView.AddTopBar>
              <Header
                onShowPreferences={() => setShowPreferences(true)}
                onShowAbout={() => setShowAbout(true)}
                onResumeAll={handleResumeAll}
                onPauseAll={handlePauseAll}
                downloadPath={config.downloadPath}
              />
            </AdwToolbarView.AddTopBar>
            <ErrorDisplay />
            <TorrentList />
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
          </AdwToolbarView>
        </AdwNavigationView.Page>
        {playerState.isPlaying && (
          <VideoPlayerPage activeTorrents={getActiveTorrents()} windowRef={windowRef} />
        )}
      </AdwNavigationView>
    </AdwApplicationWindow>
  );
};
