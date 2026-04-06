import { atom } from "jotai";
import type { AppConfig, PlayerState, Torrent } from "../types";

/** Map containing all torrent data - keyed by torrent ID */
export const torrentsMapAtom = atom<Map<string, Torrent>>(new Map());

/** Ordered list of torrent IDs for list rendering */
export const torrentIdsAtom = atom<string[]>([]);

/** App configuration */
export const configAtom = atom<AppConfig>({
  downloadPath: "",
  autoStart: true,
  notifications: true,
  darkMode: false,
});

/** Whether the torrent service is initialized */
export const serviceInitializedAtom = atom<boolean>(false);

/** Player state atom */
export const playerStateAtom = atom<PlayerState>({
  torrentId: null,
  fileIndex: null,
  streamUrl: null,
  isPlaying: false,
  isFullscreen: false,
});
