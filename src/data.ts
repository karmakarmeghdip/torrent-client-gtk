import { Torrent } from "./types";

export const initialTorrents: Torrent[] = [
  {
    id: "1",
    name: "Ubuntu 24.04 LTS Desktop (64-bit)",
    size: "4.5 GB",
    progress: 0.65,
    speed: "3.2 MB/s",
    status: "Downloading",
    peers: 45,
  },
  {
    id: "2",
    name: "Arch Linux 2024.01.01 x86_64",
    size: "900 MB",
    progress: 1.0,
    speed: "0 B/s",
    status: "Seeding",
    peers: 12,
  },
  {
    id: "3",
    name: "Fedora Workstation 40 Live ISO",
    size: "2.1 GB",
    progress: 0.15,
    speed: "800 KB/s",
    status: "Downloading",
    peers: 8,
  },
  {
    id: "4",
    name: "Debian 12.5.0 amd64 netinst",
    size: "628 MB",
    progress: 0.0,
    speed: "0 B/s",
    status: "Paused",
    peers: 0,
  },
];
