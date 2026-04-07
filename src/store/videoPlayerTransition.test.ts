import { describe, expect, it } from "vitest";
import {
  addTorrentAtom,
  closePlayerAtom,
  playerStateAtom,
  setActiveStreamAtom,
  torrentsMapAtom,
  updateTorrentProgressAtom,
} from "../store";
import { createStoreForTesting } from "../testUtils";
import type { Torrent } from "../types";

function createTorrentWithVideo(id: string, progress: number): Torrent {
  return {
    id,
    name: `Torrent ${id}`,
    size: "1 GB",
    progress,
    speed: "1 MB/s",
    status: "Downloading",
    peers: 5,
    magnetUri: `magnet:?xt=urn:btih:${id}`,
    downloadPath: "/downloads",
    addedAt: Date.now(),
    videoFiles: [
      {
        index: 0,
        name: `video-${id}.mp4`,
        path: `video-${id}.mp4`,
        size: "1 GB",
        type: "video/mp4",
      },
    ],
  };
}

describe("Video player transition - Player state management", () => {
  it("should NOT modify torrent status when starting/stopping player", () => {
    const store = createStoreForTesting();
    const torrent: Torrent = createTorrentWithVideo("test-1", 0.5);
    store.set(addTorrentAtom, torrent);

    expect(store.get(torrentsMapAtom).get("test-1")?.status).toBe("Downloading");

    store.set(setActiveStreamAtom, {
      torrentId: "test-1",
      fileIndex: 0,
      streamUrl: "http://localhost:1234/stream",
    });

    expect(store.get(torrentsMapAtom).get("test-1")?.status).toBe("Downloading");
    expect(store.get(playerStateAtom).isPlaying).toBe(true);

    store.set(closePlayerAtom);
    expect(store.get(playerStateAtom).isPlaying).toBe(false);
    expect(store.get(torrentsMapAtom).get("test-1")?.status).toBe("Downloading");
  });

  it("should preserve torrent status during progress updates while player is open", () => {
    const store = createStoreForTesting();
    const torrent: Torrent = createTorrentWithVideo("test-1", 0.5);
    store.set(addTorrentAtom, torrent);

    store.set(setActiveStreamAtom, {
      torrentId: "test-1",
      fileIndex: 0,
      streamUrl: "http://localhost:1234/stream",
    });

    store.set(updateTorrentProgressAtom, {
      id: "test-1",
      progress: 0.6,
      speed: "1 MB/s",
      peers: 10,
    });

    const torrentAfterUpdate = store.get(torrentsMapAtom).get("test-1");
    expect(torrentAfterUpdate?.status).toBe("Downloading");
    expect(torrentAfterUpdate?.progress).toBe(0.6);
  });
});

describe("Video player transition - Multiple cycles", () => {
  it("should handle multiple play/stop cycles without losing torrents", () => {
    const store = createStoreForTesting();
    const torrent: Torrent = createTorrentWithVideo("test-1", 0.5);
    store.set(addTorrentAtom, torrent);

    expect(store.get(torrentsMapAtom).size).toBe(1);

    store.set(setActiveStreamAtom, { torrentId: "test-1", fileIndex: 0, streamUrl: "url1" });
    expect(store.get(playerStateAtom).isPlaying).toBe(true);
    store.set(closePlayerAtom);
    expect(store.get(playerStateAtom).isPlaying).toBe(false);

    store.set(updateTorrentProgressAtom, {
      id: "test-1",
      progress: 0.6,
      speed: "1 MB/s",
      peers: 10,
    });

    store.set(setActiveStreamAtom, { torrentId: "test-1", fileIndex: 0, streamUrl: "url2" });
    expect(store.get(playerStateAtom).isPlaying).toBe(true);
    store.set(closePlayerAtom);
    expect(store.get(playerStateAtom).isPlaying).toBe(false);

    store.set(setActiveStreamAtom, { torrentId: "test-1", fileIndex: 0, streamUrl: "url3" });
    expect(store.get(playerStateAtom).isPlaying).toBe(true);
    store.set(closePlayerAtom);
    expect(store.get(playerStateAtom).isPlaying).toBe(false);

    const finalTorrent = store.get(torrentsMapAtom).get("test-1");
    expect(finalTorrent).toBeDefined();
    expect(finalTorrent?.name).toBe("Torrent test-1");
    expect(store.get(torrentsMapAtom).size).toBe(1);
  });

  it("should maintain multiple torrents during streaming", () => {
    const store = createStoreForTesting();

    for (let i = 1; i <= 3; i++) {
      const torrent: Torrent = createTorrentWithVideo(`test-${i}`, i * 0.1);
      store.set(addTorrentAtom, torrent);
    }

    expect(store.get(torrentsMapAtom).size).toBe(3);

    store.set(setActiveStreamAtom, { torrentId: "test-1", fileIndex: 0, streamUrl: "url1" });

    for (let i = 1; i <= 3; i++) {
      store.set(updateTorrentProgressAtom, {
        id: `test-${i}`,
        progress: i * 0.2,
        speed: `${i} MB/s`,
        peers: i,
      });
    }

    store.set(closePlayerAtom);

    expect(store.get(torrentsMapAtom).size).toBe(3);
    for (let i = 1; i <= 3; i++) {
      const t = store.get(torrentsMapAtom).get(`test-${i}`);
      expect(t?.progress).toBe(i * 0.2);
    }
  });

  it("should handle switching between different torrents", () => {
    const store = createStoreForTesting();
    store.set(addTorrentAtom, createTorrentWithVideo("test-1", 0.5));
    store.set(addTorrentAtom, createTorrentWithVideo("test-2", 0.3));

    store.set(setActiveStreamAtom, { torrentId: "test-1", fileIndex: 0, streamUrl: "url1" });
    expect(store.get(playerStateAtom).torrentId).toBe("test-1");

    store.set(closePlayerAtom);
    store.set(setActiveStreamAtom, { torrentId: "test-2", fileIndex: 0, streamUrl: "url2" });
    expect(store.get(playerStateAtom).torrentId).toBe("test-2");

    store.set(closePlayerAtom);
    store.set(setActiveStreamAtom, { torrentId: "test-1", fileIndex: 0, streamUrl: "url3" });
    expect(store.get(playerStateAtom).torrentId).toBe("test-1");

    expect(store.get(torrentsMapAtom).size).toBe(2);
  });
});
