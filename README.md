# Torrent Client GTK

<p align="center">
  <img src="https://img.shields.io/badge/status-in_development-orange?style=flat" alt="Status">
  <img src="https://img.shields.io/badge/platform-Linux-blue?style=flat" alt="Platform">
</p>

A native Linux desktop torrent client built with GTK4 and Libadwaita, written in TypeScript with React and GTKX.

> **⚠️ This application is currently in development.**

## Features

- **Torrent Management** — Add, download, and manage torrents with an intuitive interface
- **Media Streaming** — Stream video files directly while downloading
- **File Selection** — Choose which files from a torrent to download

## Roadmap

The goal is to build a full-featured torrent media client with:

- 📡 **RSS Support** — Subscribe to torrent feeds and automatically download new content
- 🎌 **Anilist Integration** — Anime tracking and metadata from Anilist
- 🎬 **IMDb Integration** — Movie and TV show information powered by IMDb
- 🎨 **Netflix-style UI** — Beautiful media browsing experience with cover art and details
- 📱 **GNOME HIG Compliant** — Native Linux look and feel following GNOME Human Interface Guidelines

## Tech Stack

- **GTK4** with **Libadwaita** for native GNOME integration
- **React** + **TypeScript** for the UI
- **GTKX** for bridging React with GTK
- **WebTorrent** for torrent handling
- **Jotai** for state management

## Getting Started

```bash
# Install dependencies
bun install

# Start development server (runs the app)
bun run dev

# Build for production
bun run build
```

## License

MIT