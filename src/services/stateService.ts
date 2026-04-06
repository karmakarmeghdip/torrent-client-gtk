import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { env } from "node:process";
import type { PersistedTorrent } from "../types";

const APP_ID = "com.torrent.client";

/** Get XDG data directory or fallback to ~/.local/share */
function getDataDir(): string {
  const xdgData = env.XDG_DATA_HOME;
  if (xdgData) {
    return join(xdgData, APP_ID);
  }
  return join(homedir(), ".local", "share", APP_ID);
}

const STATE_PATH = join(getDataDir(), "state.json");

interface StateFile {
  version: number;
  torrents: PersistedTorrent[];
}

const CURRENT_VERSION = 1;

const DEFAULT_STATE: StateFile = {
  version: CURRENT_VERSION,
  torrents: [],
};

/** Ensure data directory exists */
async function ensureDataDir(): Promise<void> {
  const dataDir = getDataDir();
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

/** Load state from disk */
export async function loadState(): Promise<StateFile> {
  try {
    await ensureDataDir();
    const data = await readFile(STATE_PATH, "utf-8");
    const parsed = JSON.parse(data) as Partial<StateFile>;
    return {
      version: parsed.version || CURRENT_VERSION,
      torrents: parsed.torrents || [],
    };
  } catch {
    // File doesn't exist or is invalid, return defaults
    return { ...DEFAULT_STATE };
  }
}

/** Save state to disk */
export async function saveState(torrents: PersistedTorrent[]): Promise<void> {
  await ensureDataDir();
  const state: StateFile = {
    version: CURRENT_VERSION,
    torrents,
  };
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
}

/** Add a torrent to persisted state */
export async function addPersistedTorrent(torrent: PersistedTorrent): Promise<void> {
  const state = await loadState();
  // Check if already exists
  const exists = state.torrents.some((t) => t.id === torrent.id);
  if (!exists) {
    state.torrents.push(torrent);
    await saveState(state.torrents);
  }
}

/** Remove a torrent from persisted state */
export async function removePersistedTorrent(id: string): Promise<void> {
  const state = await loadState();
  state.torrents = state.torrents.filter((t) => t.id !== id);
  await saveState(state.torrents);
}

/** Update a torrent in persisted state */
export async function updatePersistedTorrent(
  id: string,
  updates: Partial<PersistedTorrent>
): Promise<void> {
  const state = await loadState();
  const index = state.torrents.findIndex((t) => t.id === id);
  if (index !== -1) {
    state.torrents[index] = { ...state.torrents[index], ...updates };
    await saveState(state.torrents);
  }
}
