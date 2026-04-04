import { AdwApplicationWindow, AdwToolbarView, quit } from "@gtkx/react";
import { useState, useEffect, useCallback } from "react";
import { useSetAtom, useAtom, useStore } from "jotai";
import { injectStyles } from "./styles";
import {
  allTorrentsAtom,
  configAtom,
  updateConfigAtom,
  serviceInitializedAtom,
  setServiceInitializedAtom,
} from "./store/torrentStore";
import { 
  initializeTorrentService, 
  shutdownTorrentService,
  pauseTorrent,
  resumeTorrent,
} from "./services/torrentService";
import { loadConfig, saveConfig } from "./services/configService";
import { Header } from "./components/Header";
import { TorrentList } from "./components/TorrentList";
import { PreferencesDialog } from "./components/PreferencesDialog";
import { AboutDialog } from "./components/AboutDialog";

injectStyles();

export const App = () => {
  const store = useStore();
  const [config, setConfig] = useAtom(configAtom);
  const [, setInitialized] = useAtom(setServiceInitializedAtom);
  const isInitialized = useAtom(serviceInitializedAtom)[0];
  const [torrents] = useAtom(allTorrentsAtom);
  const updateConfig = useSetAtom(updateConfigAtom);

  const [showAbout, setShowAbout] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

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

  return (
    <AdwApplicationWindow
      title="Torrent Client"
      defaultWidth={800}
      defaultHeight={600}
      onClose={quit}
    >
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
    </AdwApplicationWindow>
  );
};

export default App;
