import { describe, expect, it } from "vitest";
import {
  addTorrentAtom,
  closePlayerAtom,
  deleteTorrentAtom,
  playerStateAtom,
  setActiveStreamAtom,
  toggleTorrentStatusAtom,
  torrentsMapAtom,
  updateTorrentProgressAtom,
} from "../store";
import { createStoreForTesting } from "../testUtils";
import type { Torrent } from "../types";

describe("store/actionAtoms - Torrent management", () => {
  describe("addTorrentAtom", () => {
    it("should add a torrent to the store", () => {
      const store = createStoreForTesting();
      const torrent: Torrent = {
        id: "test-1",
        name: "Test Torrent",
        size: "1 GB",
        progress: 0,
        speed: "0 B/s",
        status: "Downloading",
        peers: 0,
        magnetUri: "magnet:?xt=urn:btih:test",
        downloadPath: "/downloads",
        addedAt: Date.now(),
      };

      store.set(addTorrentAtom, torrent);

      const map = store.get(torrentsMapAtom);
      expect(map.has("test-1")).toBe(true);
      expect(map.get("test-1")?.name).toBe("Test Torrent");
    });
  });

  describe("deleteTorrentAtom", () => {
    it("should remove a torrent from the store", () => {
      const store = createStoreForTesting();
      const torrent: Torrent = {
        id: "test-1",
        name: "Test Torrent",
        size: "1 GB",
        progress: 0,
        speed: "0 B/s",
        status: "Downloading",
        peers: 0,
        magnetUri: "magnet:?xt=urn:btih:test",
        downloadPath: "/downloads",
        addedAt: Date.now(),
      };

      store.set(addTorrentAtom, torrent);
      expect(store.get(torrentsMapAtom).has("test-1")).toBe(true);

      store.set(deleteTorrentAtom, "test-1");

      expect(store.get(torrentsMapAtom).has("test-1")).toBe(false);
    });
  });
});

describe("store/actionAtoms - Status management", () => {
  describe("toggleTorrentStatusAtom", () => {
    it("should toggle from Downloading to Paused", () => {
      const store = createStoreForTesting();
      const torrent: Torrent = createDownloadingTorrent("test-1", 0.5);
      store.set(addTorrentAtom, torrent);
      store.set(toggleTorrentStatusAtom, "test-1");

      expect(store.get(torrentsMapAtom).get("test-1")?.status).toBe("Paused");
    });

    it("should toggle from Paused to Downloading", () => {
      const store = createStoreForTesting();
      const torrent: Torrent = {
        id: "test-1",
        name: "Test Torrent",
        size: "1 GB",
        progress: 0.5,
        speed: "0 B/s",
        status: "Paused",
        peers: 0,
        magnetUri: "magnet:?xt=urn:btih:test",
        downloadPath: "/downloads",
        addedAt: Date.now(),
      };

      store.set(addTorrentAtom, torrent);
      store.set(toggleTorrentStatusAtom, "test-1");

      expect(store.get(torrentsMapAtom).get("test-1")?.status).toBe("Downloading");
    });

    it("should toggle from Seeding to Paused", () => {
      const store = createStoreForTesting();
      const torrent: Torrent = {
        id: "test-1",
        name: "Test Torrent",
        size: "1 GB",
        progress: 1.0,
        speed: "0 B/s",
        status: "Seeding",
        peers: 0,
        magnetUri: "magnet:?xt=urn:btih:test",
        downloadPath: "/downloads",
        addedAt: Date.now(),
      };

      store.set(addTorrentAtom, torrent);
      store.set(toggleTorrentStatusAtom, "test-1");

      expect(store.get(torrentsMapAtom).get("test-1")?.status).toBe("Paused");
    });
  });
});

describe("store/actionAtoms - Progress updates", () => {
  it("should update progress and status", () => {
    const store = createStoreForTesting();
    const torrent: Torrent = createDownloadingTorrent("test-1", 0);
    store.set(addTorrentAtom, torrent);
    store.set(updateTorrentProgressAtom, {
      id: "test-1",
      progress: 0.5,
      speed: "500 KB/s",
      peers: 10,
    });

    const updated = store.get(torrentsMapAtom).get("test-1");
    expect(updated?.progress).toBe(0.5);
    expect(updated?.speed).toBe("500 KB/s");
    expect(updated?.peers).toBe(10);
  });

  it("should set status to Seeding when progress is 100%", () => {
    const store = createStoreForTesting();
    const torrent: Torrent = createDownloadingTorrent("test-1", 0.99);
    store.set(addTorrentAtom, torrent);
    store.set(updateTorrentProgressAtom, {
      id: "test-1",
      progress: 1.0,
      speed: "0 B/s",
      peers: 0,
    });

    expect(store.get(torrentsMapAtom).get("test-1")?.status).toBe("Seeding");
  });

  it("should preserve Paused status during progress update", () => {
    const store = createStoreForTesting();
    const torrent: Torrent = {
      id: "test-1",
      name: "Test Torrent",
      size: "1 GB",
      progress: 0.3,
      speed: "0 B/s",
      status: "Paused",
      peers: 0,
      magnetUri: "magnet:?xt=urn:btih:test",
      downloadPath: "/downloads",
      addedAt: Date.now(),
    };

    store.set(addTorrentAtom, torrent);
    store.set(updateTorrentProgressAtom, {
      id: "test-1",
      progress: 0.5,
      speed: "500 KB/s",
      peers: 10,
    });

    expect(store.get(torrentsMapAtom).get("test-1")?.status).toBe("Paused");
  });
});

describe("store/actionAtoms - Player state", () => {
  describe("setActiveStreamAtom", () => {
    it("should set player state to playing", () => {
      const store = createStoreForTesting();
      store.set(setActiveStreamAtom, {
        torrentId: "test-1",
        fileIndex: 0,
        streamUrl: "http://localhost:1234/stream",
      });

      const playerState = store.get(playerStateAtom);
      expect(playerState.isPlaying).toBe(true);
      expect(playerState.torrentId).toBe("test-1");
      expect(playerState.fileIndex).toBe(0);
      expect(playerState.streamUrl).toBe("http://localhost:1234/stream");
    });
  });

  describe("closePlayerAtom", () => {
    it("should reset player state", () => {
      const store = createStoreForTesting();
      store.set(setActiveStreamAtom, {
        torrentId: "test-1",
        fileIndex: 0,
        streamUrl: "http://localhost:1234/stream",
      });
      expect(store.get(playerStateAtom).isPlaying).toBe(true);

      store.set(closePlayerAtom);

      const playerState = store.get(playerStateAtom);
      expect(playerState.isPlaying).toBe(false);
      expect(playerState.torrentId).toBeNull();
      expect(playerState.fileIndex).toBeNull();
      expect(playerState.streamUrl).toBeNull();
    });
  });
});

// Helper function
function createDownloadingTorrent(id: string, progress: number): Torrent {
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
  };
}
