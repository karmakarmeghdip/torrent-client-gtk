import type { Torrent, TorrentStatus } from "../types";

/** Active transfer statuses (downloading/uploading data) */
export const ACTIVE_TRANSFER_STATUSES: readonly TorrentStatus[] = [
  "Downloading",
  "Seeding",
] as const;

/** Active statuses (downloading, seeding, or streaming) */
export const ACTIVE_STATUSES: readonly TorrentStatus[] = [
  "Downloading",
  "Seeding",
  "Streaming",
] as const;

/** Check if status represents active data transfer */
export function isActiveTransfer(status: TorrentStatus): boolean {
  return ACTIVE_TRANSFER_STATUSES.includes(status);
}

/** Check if status represents any active state (including streaming) */
export function isActive(status: TorrentStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

/** Check if torrent can be paused */
export function canPause(torrent: Torrent): boolean {
  return isActive(torrent.status);
}

/** Check if torrent can be resumed */
export function canResume(torrent: Torrent): boolean {
  return torrent.status === "Paused" || torrent.status === "Error";
}

/** Check if torrent is completed */
export function isCompleted(torrent: Torrent): boolean {
  return torrent.progress >= 1.0;
}

/** Get display status for a torrent */
export function getDisplayStatus(torrent: Torrent): string {
  if (torrent.status === "Streaming") {
    return "Streaming";
  }
  if (isCompleted(torrent)) {
    return torrent.status === "Seeding" ? "Seeding" : "Completed";
  }
  return torrent.status;
}

/** Check if peers should be shown for this status */
export function shouldShowPeers(status: TorrentStatus): boolean {
  return isActiveTransfer(status);
}

/** Format peers label with speed */
export function formatPeersLabel(status: TorrentStatus, peers: number, speed: string): string {
  if (status === "Downloading") {
    return `${speed} - ${peers} peers`;
  }
  return `${peers} peers`;
}
