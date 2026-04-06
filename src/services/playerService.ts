import { 
  stopStreaming as stopVideoStreaming,
  getActiveStreamingTorrent,
} from "./videoStreamingService";
import { getActiveTorrents } from "./torrentService";

// Store callbacks
let openPlayerCallback: (() => void) | null = null;
let closePlayerCallback: (() => void) | null = null;

/** Set callback to open/close player window */
export function setPlayerCallbacks(
  openCallback: () => void,
  closeCallback: () => void,
): void {
  openPlayerCallback = openCallback;
  closePlayerCallback = closeCallback;
}

/** Open the player window */
export function openPlayer(): void {
  if (openPlayerCallback) {
    openPlayerCallback();
  }
}

/** Stop the current video playback */
export async function stopVideoPlayback(): Promise<void> {
  const activeTorrents = getActiveTorrents();
  await stopVideoStreaming(activeTorrents);
  
  if (closePlayerCallback) {
    closePlayerCallback();
  }
}

/** Check if a specific torrent is currently being streamed */
export function isTorrentStreaming(torrentId: string): boolean {
  return getActiveStreamingTorrent() === torrentId;
}
