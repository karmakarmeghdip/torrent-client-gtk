export type TorrentStatus = "Downloading" | "Seeding" | "Paused" | "Completed";

export interface Torrent {
  id: string;
  name: string;
  size: string;
  progress: number;
  speed: string;
  status: TorrentStatus;
  peers: number;
}
