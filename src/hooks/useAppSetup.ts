import type * as Adw from "@gtkx/ffi/adw";
import { useAtom, useSetAtom, useStore } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadConfig, saveConfig } from "../services/configService";
import { initializeTorrentService, shutdownTorrentService } from "../services/torrentService";
import {
  configAtom,
  playerStateAtom,
  serviceInitializedAtom,
  setServiceInitializedAtom,
  updateConfigAtom,
} from "../store";

export function useAppSetup() {
  const store = useStore();
  const [config, setConfig] = useAtom(configAtom);
  const [, setInitialized] = useAtom(setServiceInitializedAtom);
  const isInitialized = useAtom(serviceInitializedAtom)[0];
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
        const loadedConfig = await loadConfig();
        if (isMounted) {
          setConfig(loadedConfig);
        }

        await initializeTorrentService(store);

        if (isMounted) {
          setInitialized(true);
        }
      } catch (error) {
        // Initialization errors are logged but handled gracefully
        if (error instanceof Error) {
          throw new Error(`Failed to initialize app: ${error.message}`);
        }
      }
    };

    init().catch((error: Error) => {
      // Re-throw to allow error boundary to catch
      throw error;
    });

    return () => {
      isMounted = false;
      shutdownTorrentService();
    };
  }, [store, setConfig, setInitialized]);

  // Save config when it changes
  useEffect(() => {
    if (isInitialized) {
      saveConfig(config).catch((error: Error) => {
        // Config save errors are logged but don't block UI
        throw new Error(`Failed to save config: ${error.message}`);
      });
    }
  }, [config, isInitialized]);

  const toggleDarkMode = useCallback(() => {
    updateConfig({ darkMode: !config.darkMode });
  }, [config.darkMode, updateConfig]);

  const toggleNotifications = useCallback(() => {
    updateConfig({ notifications: !config.notifications });
  }, [config.notifications, updateConfig]);

  const toggleAutoStart = useCallback(() => {
    updateConfig({ autoStart: !config.autoStart });
  }, [config.autoStart, updateConfig]);

  const updateDownloadPath = useCallback(
    (path: string) => {
      updateConfig({ downloadPath: path });
    },
    [updateConfig]
  );

  const goBackFromPlayer = useCallback(() => {
    setNavigationHistory(["torrents"]);
  }, []);

  return {
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
  };
}
