// Type declarations for webtorrent since @types/webtorrent doesn't exist

/// <reference types="node" />

declare module "webtorrent" {
  export interface TorrentFile {
    name: string;
    path: string;
    length: number;
    downloaded: number;
    progress: number;
  }

  export interface Torrent {
    infoHash: string;
    magnetURI: string;
    files: TorrentFile[];
    name: string;
    length: number;
    downloaded: number;
    uploaded: number;
    progress: number;
    downloadSpeed: number;
    uploadSpeed: number;
    numPeers: number;
    path: string;
    ready: boolean;
    paused: boolean;
    done: boolean;

    on(event: "download", callback: () => void): void;
    on(event: "upload", callback: () => void): void;
    on(event: "done", callback: () => void): void;
    on(event: "error", callback: (err: Error) => void): void;
    on(event: "noPeers", callback: (announceType: string) => void): void;
    on(event: "ready", callback: () => void): void;
    on(event: "warning", callback: (err: Error) => void): void;

    destroy(opts?: { destroyStore?: boolean } | (() => void), callback?: () => void): void;
    pause(): void;
    resume(): void;
  }

  export interface Instance {
    torrents: Torrent[];
    downloadSpeed: number;
    uploadSpeed: number;
    progress: number;
    ratio: number;

    add(
      torrentId: string | Buffer | File,
      opts?: { path?: string; announce?: string[] },
      callback?: (torrent: Torrent) => void,
    ): Torrent;
    
    remove(torrentId: string | Torrent, opts?: { destroyStore?: boolean }, callback?: () => void): void;
    get(torrentId: string): Torrent | null;
    
    destroy(callback?: () => void): void;
    
    on(event: "torrent", callback: (torrent: Torrent) => void): void;
    on(event: "error", callback: (err: Error) => void): void;
  }

  interface WebTorrentOptions {
    dht?: boolean | { bootstrap?: string[] };
    tracker?: boolean | { 
      announce?: string[];
      getAnnounceOpts?: () => Record<string, unknown>;
    };
    blocklist?: string[];
  }

  export default class WebTorrent implements Instance {
    constructor(opts?: WebTorrentOptions);
    
    torrents: Torrent[];
    downloadSpeed: number;
    uploadSpeed: number;
    progress: number;
    ratio: number;

    add(
      torrentId: string | Buffer | File,
      opts?: { path?: string; announce?: string[] },
      callback?: (torrent: Torrent) => void,
    ): Torrent;
    
    remove(torrentId: string | Torrent, opts?: { destroyStore?: boolean }, callback?: () => void): void;
    get(torrentId: string): Torrent | null;
    
    destroy(callback?: () => void): void;
    
    on(event: "torrent", callback: (torrent: Torrent) => void): void;
    on(event: "error", callback: (err: Error) => void): void;
  }
}
