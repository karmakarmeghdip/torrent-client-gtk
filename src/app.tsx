import * as Adw from "@gtkx/ffi/adw";
import { AdwApplicationWindow, AdwNavigationView, AdwToolbarView, quit } from "@gtkx/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSetAtom, useAtom, useStore } from "jotai";
import { injectStyles } from "./styles";
import {
  allTorrentsAtom,
  configAtom,
  updateConfigAtom,
  serviceInitializedAtom,
  setServiceInitializedAtom,
  playerStateAtom,
} from "./store/torrentStore";
import { 
  initializeTorrentService, 
  shutdownTorrentService,
  pauseTorrent,
  resumeTorrent,
  getActiveTorrents,
} from "./services/torrentService";
import { loadConfig, saveConfig } from "./services/configService";
import { setPlayerCallbacks } from "./services/playerService";
import { Header } from "./components/Header";
import { TorrentList } from "./components/TorrentList";
import { PreferencesDialog } from "./components/PreferencesDialog";
import { AboutDialog } from "./components/AboutDialog";
import { VideoPlayerPage } from "./components/VideoPlayerPage";

injectStyles();

export const App = () => {
  const store = useStore();
  const [config, setConfig] = useAtom(configAtom);
  const [, setInitialized] = useAtom(setServiceInitializedAtom);
  const isInitialized = useAtom(serviceInitializedAtom)[0];
  const [torrents] = useAtom(allTorrentsAtom);
  const [playerState] = useAtom(playerStateAtom);
  const updateConfig = useSetAtom(updateConfigAtom);

  const [showAbout, setShowAbout] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>(["torrents"]);
  const windowRef = useRef<Adw.ApplicationWindow | null>(null);

  // Initialize torrent service on mount
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // Load config first
        const loadedConfig = await loadConfig();
        if (isMounted) {
          setConfig(loadedConfig);
        }

        // Initialize torrent service with jotai store
        await initializeTorrentService(store);
        
        if (isMounted) {
          setInitialized(true);
          console.log("[App] Torrent service initialized");
          
          // Set up player callbacks
          setPlayerCallbacks(
            () => {
              // Navigate to video player page
              setNavigationHistory(["torrents", "video-player"]);
            },
            () => {
              // Navigate back to torrents
              setNavigationHistory(["torrents"]);
            }
          );
        }
      } catch (error) {
        console.error("[App] Failed to initialize:", error);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      shutdownTorrentService();
    };
  }, [store, setConfig, setInitialized]);

  // Save config when it changes
  useEffect(() => {
    if (isInitialized) {
      saveConfig(config).catch((err) => {
        console.error("[App] Failed to save config:", err);
      });
    }
  }, [config, isInitialized]);

  const handleDarkModeToggle = () => {
    updateConfig({ darkMode: !config.darkMode });
  };

  const handleNotificationsToggle = () => {
    updateConfig({ notifications: !config.notifications });
  };

  const handleAutoStartToggle = () => {
    updateConfig({ autoStart: !config.autoStart });
  };

  const handleDownloadPathChange = (path: string) => {
    updateConfig({ downloadPath: path });
  };

  const handleResumeAll = useCallback(() => {
    torrents.forEach((t) => {
      if (t.status === "Paused") {
        resumeTorrent(t.id);
      }
    });
  }, [torrents]);

  const handlePauseAll = useCallback(() => {
    torrents.forEach((t) => {
      if (t.status === "Downloading" || t.status === "Seeding") {
        pauseTorrent(t.id);
      }
    });
  }, [torrents]);

  const handleBackFromPlayer = useCallback(() => {
    setNavigationHistory(["torrents"]);
  }, []);

  return (
    <AdwApplicationWindow
      title="Torrent Client"
      defaultWidth={800}
      defaultHeight={600}
      onClose={quit}
      ref={windowRef}
    >
      <AdwNavigationView 
        history={navigationHistory}
        onHistoryChanged={setNavigationHistory}
      >
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
                onDarkModeToggle={handleDarkModeToggle}
                notifications={config.notifications}
                onNotificationsToggle={handleNotificationsToggle}
                autoStart={config.autoStart}
                onAutoStartToggle={handleAutoStartToggle}
                downloadPath={config.downloadPath}
                onDownloadPathChange={handleDownloadPathChange}
                onClosed={() => setShowPreferences(false)}
              />
            )}

            {showAbout && <AboutDialog onClosed={() => setShowAbout(false)} />}
          </AdwToolbarView>
        </AdwNavigationView.Page>

        {playerState.isPlaying && (
          <VideoPlayerPage
            activeTorrents={getActiveTorrents()}
            onBack={handleBackFromPlayer}
            windowRef={windowRef}
          />
        )}
      </AdwNavigationView>
    </AdwApplicationWindow>
  );
};

export default App;
