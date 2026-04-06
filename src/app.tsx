import { AdwApplicationWindow, AdwNavigationView, AdwToolbarView, quit } from "@gtkx/react";
import { useAtom } from "jotai";
import { AboutDialog } from "./components/AboutDialog";
import { Header } from "./components/Header";
import { PreferencesDialog } from "./components/PreferencesDialog";
import { TorrentList } from "./components/TorrentList";
import { VideoPlayerPage } from "./components/VideoPlayerPage";
import { useAppSetup } from "./hooks/useAppSetup";
import { useTorrentHandlers } from "./hooks/useTorrentHandlers";
import { getActiveTorrents } from "./services/torrentService";
import { allTorrentsAtom } from "./store";
import { injectStyles } from "./styles";

injectStyles();

export const App = () => {
  const [torrents] = useAtom(allTorrentsAtom);
  const { handleResumeAll, handlePauseAll } = useTorrentHandlers(torrents);
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
    goBackFromPlayer,
  } = useAppSetup();

  return (
    <AdwApplicationWindow
      title="Torrent Client"
      defaultWidth={800}
      defaultHeight={600}
      onClose={quit}
      ref={windowRef}
    >
      <AdwNavigationView history={navigationHistory} onHistoryChanged={setNavigationHistory}>
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
          <VideoPlayerPage
            activeTorrents={getActiveTorrents()}
            onBack={goBackFromPlayer}
            windowRef={windowRef}
          />
        )}
      </AdwNavigationView>
    </AdwApplicationWindow>
  );
};
