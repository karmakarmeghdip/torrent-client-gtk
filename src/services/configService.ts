import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { AppConfig } from "../types";

const APP_ID = "com.torrent.client";

/** Get XDG config directory or fallback to ~/.config */
function getConfigDir(): string {
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  if (xdgConfig) {
    return join(xdgConfig, APP_ID);
  }
  return join(homedir(), ".config", APP_ID);
}

const CONFIG_PATH = join(getConfigDir(), "config.json");

const DEFAULT_CONFIG: AppConfig = {
  downloadPath: join(homedir(), "Downloads"),
  autoStart: true,
  notifications: true,
  darkMode: false,
};

/** Ensure config directory exists */
async function ensureConfigDir(): Promise<void> {
  const configDir = getConfigDir();
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }
}

/** Load config from disk or return defaults */
export async function loadConfig(): Promise<AppConfig> {
  try {
    await ensureConfigDir();
    const data = await readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(data) as Partial<AppConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    // File doesn't exist or is invalid, return defaults
    return { ...DEFAULT_CONFIG };
  }
}

/** Save config to disk */
export async function saveConfig(config: AppConfig): Promise<void> {
  await ensureConfigDir();
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

/** Get default download path */
export function getDefaultDownloadPath(): string {
  return join(homedir(), "Downloads");
}

/** Validate and sanitize config values */
export function sanitizeConfig(config: Partial<AppConfig>): AppConfig {
  return {
    downloadPath: config.downloadPath || DEFAULT_CONFIG.downloadPath,
    autoStart: config.autoStart ?? DEFAULT_CONFIG.autoStart,
    notifications: config.notifications ?? DEFAULT_CONFIG.notifications,
    darkMode: config.darkMode ?? DEFAULT_CONFIG.darkMode,
  };
}
