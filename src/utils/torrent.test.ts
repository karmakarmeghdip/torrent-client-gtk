import { describe, expect, it } from "vitest";
import type { Torrent } from "../types";
import {
  canPause,
  canResume,
  formatPeersLabel,
  getDisplayStatus,
  isActive,
  isActiveTransfer,
  isCompleted,
  shouldShowPeers,
} from "./torrent";

function createTorrent(overrides: Partial<Torrent> = {}): Torrent {
  return {
    id: "test-1",
    name: "Test Torrent",
    size: "1 GB",
    progress: 0.5,
    speed: "1 MB/s",
    status: "Downloading",
    peers: 5,
    magnetUri: "magnet:?xt=urn:btih:test",
    downloadPath: "/downloads",
    addedAt: Date.now(),
    ...overrides,
  };
}

describe("isActiveTransfer and isActive", () => {
  it("should identify Downloading as active", () => {
    expect(isActiveTransfer("Downloading")).toBe(true);
    expect(isActive("Downloading")).toBe(true);
  });
  it("should identify Seeding as active", () => {
    expect(isActiveTransfer("Seeding")).toBe(true);
    expect(isActive("Seeding")).toBe(true);
  });
  it("should identify Paused as inactive", () => {
    expect(isActiveTransfer("Paused")).toBe(false);
    expect(isActive("Paused")).toBe(false);
  });
  it("should identify Error as inactive", () => {
    expect(isActiveTransfer("Error")).toBe(false);
    expect(isActive("Error")).toBe(false);
  });
});

describe("canPause and canResume", () => {
  it("canPause should return true for Downloading/Seeding", () => {
    expect(canPause(createTorrent({ status: "Downloading" }))).toBe(true);
    expect(canPause(createTorrent({ status: "Seeding" }))).toBe(true);
    expect(canPause(createTorrent({ status: "Paused" }))).toBe(false);
  });
  it("canResume should return true for Paused/Error", () => {
    expect(canResume(createTorrent({ status: "Paused" }))).toBe(true);
    expect(canResume(createTorrent({ status: "Error" }))).toBe(true);
    expect(canResume(createTorrent({ status: "Downloading" }))).toBe(false);
  });
});

describe("isCompleted and getDisplayStatus", () => {
  it("isCompleted should work correctly", () => {
    expect(isCompleted(createTorrent({ progress: 1.0 }))).toBe(true);
    expect(isCompleted(createTorrent({ progress: 0.5 }))).toBe(false);
  });
  it("getDisplayStatus should return correct status", () => {
    expect(getDisplayStatus(createTorrent({ status: "Seeding", progress: 1.0 }))).toBe("Seeding");
    expect(getDisplayStatus(createTorrent({ status: "Downloading", progress: 1.0 }))).toBe(
      "Completed"
    );
    expect(getDisplayStatus(createTorrent({ status: "Downloading", progress: 0.5 }))).toBe(
      "Downloading"
    );
    expect(getDisplayStatus(createTorrent({ status: "Paused", progress: 0.5 }))).toBe("Paused");
  });
});

describe("shouldShowPeers and formatPeersLabel", () => {
  it("shouldShowPeers should return true for Downloading and Seeding", () => {
    expect(shouldShowPeers("Downloading")).toBe(true);
    expect(shouldShowPeers("Seeding")).toBe(true);
    expect(shouldShowPeers("Paused")).toBe(false);
  });
  it("formatPeersLabel should format correctly", () => {
    expect(formatPeersLabel("Downloading", 10, "1.5 MB/s")).toBe("1.5 MB/s - 10 peers");
    expect(formatPeersLabel("Seeding", 5, "0 B/s")).toBe("5 peers");
    expect(formatPeersLabel("Paused", 0, "0 B/s")).toBe("0 peers");
  });
});
