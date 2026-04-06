const BYTES_PER_KB = 1024;
const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** Format bytes to human readable string */
export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }

  const i = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_KB));
  const unit = SIZE_UNITS[Math.min(i, SIZE_UNITS.length - 1)];
  const value = bytes / BYTES_PER_KB ** i;

  return `${Number.parseFloat(value.toFixed(2))} ${unit}`;
}

/** Format speed (bytes/sec) to human readable string */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) {
    return "0 B/s";
  }
  return `${formatBytes(bytesPerSecond)}/s`;
}

/** Generate a unique ID from a magnet URI */
export function generateIdFromMagnet(magnetUri: string): string {
  // Use a hash of the magnet URI for consistent IDs
  let hash = 0;
  for (let i = 0; i < magnetUri.length; i++) {
    const char = magnetUri.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }
  return `torrent-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
}
