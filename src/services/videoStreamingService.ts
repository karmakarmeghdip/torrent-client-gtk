import type { Server } from "http";
import WebTorrent from "webtorrent";
import type { Torrent as WebTorrentTorrent } from "webtorrent";
import type { TorrentVideoFile } from "../types";

// Store reference to torrentService's client
let client: InstanceType<typeof WebTorrent> | null = null;

// HTTP server instance
let videoServer: Server | null = null;
let serverPort: number = 0;

// Track active streaming torrent
let activeStreamingTorrent: string | null = null;
let activeStreamingFileIndex: number | null = null;

// Video file extensions for auto-detection
const VIDEO_EXTENSIONS = [
  ".mp4",
  ".mkv",
  ".avi",
  ".mov",
  ".webm",
  ".ogv",
  ".ogg",
  ".m4v",
  ".flv",
  ".wmv",
  ".mpg",
  ".mpeg",
  ".ts",
  ".m2ts",
];

/** Format bytes to human readable string */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/** Set the WebTorrent client reference */
export function setStreamingClient(
  wtClient: InstanceType<typeof WebTorrent>,
): void {
  client = wtClient;
}

/** Initialize video streaming server */
export function initializeVideoServer(): boolean {
  if (!client) {
    console.error("[VideoStreaming] Client not set");
    return false;
  }
  if (videoServer) {
    return true;
  }

  try {
    // Create HTTP server using WebTorrent's createServer
    const server = client.createServer({
      origin: "*",
    });

    // Type assertion needed due to WebTorrent types
    videoServer = server as unknown as Server;

    // Find an available port
    videoServer.listen(0, () => {
      const address = videoServer?.address();
      if (address && typeof address !== "string") {
        serverPort = address.port;
        console.log(
          `[VideoStreaming] Server started on port ${serverPort}`,
        );
      }
    });

    return true;
  } catch (error) {
    console.error("[VideoStreaming] Failed to start server:", error);
    return false;
  }
}

/** Shutdown video server */
export function shutdownVideoServer(): void {
  if (videoServer) {
    videoServer.close(() => {
      console.log("[VideoStreaming] Server stopped");
    });
    videoServer = null;
    serverPort = 0;
    activeStreamingTorrent = null;
    activeStreamingFileIndex = null;
  }
}

/** Check if file is a video based on extension */
export function isVideoFile(filename: string): boolean {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

/** Get video files from a WebTorrent torrent */
export function getVideoFiles(
  torrent: WebTorrentTorrent,
): TorrentVideoFile[] {
  return torrent.files
    .map((file, index) => ({ file, index }))
    .filter(({ file }) => isVideoFile(file.name))
    .map(({ file, index }) => ({
      index,
      name: file.name,
      path: file.path,
      size: formatBytes(file.length),
      type: "video/mp4",
    }));
}

/** Get the active streaming torrent ID */
export function getActiveStreamingTorrent(): string | null {
  return activeStreamingTorrent;
}

/** Start streaming a specific file from a torrent */
export async function startStreaming(
  torrentId: string,
  fileIndex: number,
  activeTorrents: Map<string, WebTorrentTorrent>,
): Promise<string | null> {
  if (!client || !videoServer) {
    console.error("[VideoStreaming] Server not initialized");
    return null;
  }

  const wt = activeTorrents.get(torrentId);
  if (!wt) {
    console.error(`[VideoStreaming] Torrent ${torrentId} not found`);
    return null;
  }

  const file = wt.files[fileIndex];
  if (!file) {
    console.error(
      `[VideoStreaming] File index ${fileIndex} not found in torrent`,
    );
    return null;
  }

  // Stop any existing streaming first
  await stopStreaming(activeTorrents);

  // Prioritize this file for streaming
  file.select();

  // Wait for server to be ready
  if (serverPort === 0) {
    // Server is still starting, wait a bit
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Build stream URL
  // Format: http://localhost:port/webtorrent/<infoHash>/<filepath>
  const encodedPath = encodeURIComponent(file.path).replace(/%2F/g, "/");
  const streamUrl = `http://localhost:${serverPort}/webtorrent/${wt.infoHash}/${encodedPath}`;

  activeStreamingTorrent = torrentId;
  activeStreamingFileIndex = fileIndex;

  console.log(`[VideoStreaming] Started streaming: ${file.name}`);
  console.log(`[VideoStreaming] URL: ${streamUrl}`);

  return streamUrl;
}

/** Stop streaming current file */
export async function stopStreaming(
  activeTorrents: Map<string, WebTorrentTorrent>,
): Promise<void> {
  if (!activeStreamingTorrent) return;

  const wt = activeTorrents.get(activeStreamingTorrent);
  if (wt && activeStreamingFileIndex !== null) {
    const file = wt.files[activeStreamingFileIndex];
    if (file) {
      // Deselect the file to stop prioritization
      file.deselect();
      console.log(
        `[VideoStreaming] Stopped streaming: ${file.name}`,
      );
    }
  }

  activeStreamingTorrent = null;
  activeStreamingFileIndex = null;
}

/** Get server port */
export function getServerPort(): number {
  return serverPort;
}
