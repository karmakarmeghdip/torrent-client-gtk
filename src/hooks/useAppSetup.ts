import type * as Adw from "@gtkx/ffi/adw";
import { useAtom, useSetAtom, useStore } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadConfig, saveConfig } from "../services/configService";
import { errorService } from "../services/errorService";
import { initializeTorrentService, shutdownTorrentService } from "../services/torrentService";
import {
  configAtom,
  playerStateAtom,
  serviceInitializedAtom,
  setServiceInitializedAtom,
  updateConfigAtom,
} from "../store";
import { createLogger } from "../utils/logger";

const log = createLogger("useAppSetup");

export function useAppSetup() {
  const store = useStore();
  const [config, setConfig] = useAtom(configAtom);
  const [, setInitialized] = useAtom(setServiceInitializedAtom);
  const isInitialized = useAtom(serviceInitializedAtom)[0];
  const [playerState] = useAtom(playerStateAtom);
  const updateConfig = useSetAtom(updateConfigAtom);

  const [showAbout, setShowAbout] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>(["main"]);
  const windowRef = useRef<Adw.ApplicationWindow | null>(null);

  // Initialize torrent service on mount
  useEffect(() => {
    let isMounted = true;

    log.info("Initializing torrent service...");
    const init = async () => {
      try {
        const loadedConfig = await loadConfig();
        if (isMounted) {
          setConfig(loadedConfig);
        }
        await initializeTorrentService(store);
        if (isMounted) {
          log.info("Torrent service initialized");
          setInitialized(true);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        log.error("Init failed", { error: msg });
        errorService.fatal(`Failed to initialize app: ${msg}`, "AppSetup");
      }
    };

    init().catch((error: Error) => {
      log.error("Init failed", { error: error.message });
      errorService.fatal(`Failed to initialize app: ${error.message}`, "AppSetup");
    });

    return () => {
      log.info("Shutting down torrent service");
      isMounted = false;
      shutdownTorrentService();
    };
  }, [store, setConfig, setInitialized]);

  // Save config + navigate to video player when playing
  useEffect(() => {
    if (isInitialized) {
      saveConfig(config).catch((e: Error) => errorService.error(e.message, "Config"));
    }
    if (playerState.isPlaying) {
      log.info("Player started, navigating to video-player");
      setNavigationHistory(["main", "video-player"]);
    }
  }, [config, isInitialized, playerState.isPlaying]);

  const toggleDarkMode = useCallback(
    () => updateConfig({ darkMode: !config.darkMode }),
    [config.darkMode, updateConfig]
  );
  const toggleNotifications = useCallback(
    () => updateConfig({ notifications: !config.notifications }),
    [config.notifications, updateConfig]
  );
  const toggleAutoStart = useCallback(
    () => updateConfig({ autoStart: !config.autoStart }),
    [config.autoStart, updateConfig]
  );
  const updateDownloadPath = useCallback(
    (path: string) => updateConfig({ downloadPath: path }),
    [updateConfig]
  );

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
  };
}
