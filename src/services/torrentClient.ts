import type { Instance as WebTorrentInstance } from "webtorrent";
import WebTorrent from "webtorrent";
import type { ServiceStore } from "./types";

// WebTorrent client instance
let client: WebTorrentInstance | null = null;

// Store reference for lazy initialization
let serviceStore: ServiceStore | null = null;

/** Get the WebTorrent client instance */
export function getClient(): WebTorrentInstance | null {
  return client;
}

/** Check if client is initialized */
export function isClientInitialized(): boolean {
  return client !== null;
}

/** Initialize the WebTorrent client */
export function initializeClient(): WebTorrentInstance {
  if (client) {
    return client;
  }

  client = new WebTorrent();
  return client;
}

/** Set the service store reference */
export function setServiceStore(store: ServiceStore): void {
  serviceStore = store;
}

/** Get the service store reference */
export function getServiceStore(): ServiceStore | null {
  return serviceStore;
}

/** Check if store is available */
export function hasStore(): boolean {
  return serviceStore !== null;
}

/** Shutdown and destroy the WebTorrent client */
export function shutdownClient(): void {
  if (client) {
    client.destroy(() => {
      // Destroy callback - no additional cleanup needed
    });
    client = null;
  }
  serviceStore = null;
}
