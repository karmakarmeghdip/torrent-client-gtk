# Contributing to Torrent Client GTK

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- **Linux** — This is a GTK4/Linux-only app
- **Bun** — Required for package management (`bun install`)
- **GTK 4.x** and **libadwaita** — Required to run the app

## Setup

```bash
# Clone the repository
git clone https://github.com/your-fork/torrent-client-gtk
cd torrent-client-gtk

# Install dependencies
bun install

# Run the app in development mode
bun run dev
```

## Project Structure

```
src/
├── components/     # React components (one file per component)
├── hooks/         # Custom React hooks for business logic
├── store/         # Jotai atoms for global state
├── services/      # Torrent, streaming, and config services
├── utils/         # Helper functions
├── types.ts       # Shared TypeScript interfaces
├── styles.ts      # Global CSS
└── app.tsx        # Main app component
```

## Code Style

This project uses **Biome** for linting and formatting. Always run these before submitting:

```bash
# Check for issues
bun run lint

# Auto-fix issues
bun run lint:fix

# Format code
bun run format
```

### Key Rules

- **No `any` types** — Use `unknown` if type is truly dynamic
- **No non-null assertions** (`!`) — Handle null properly
- **No `console`** in production — Use proper error handling
- **Use `node:` protocol** — `import { readFile } from "node:fs/promises"`

### Component Pattern

```tsx
interface MyComponentProps {
  data: SomeType;
  onAction: (id: string) => void;
}

export const MyComponent = ({ data, onAction }: MyComponentProps) => (
  <GtkBox>...</GtkBox>
);
```

- Named exports only (not default)
- Destructure props in function signature
- Keep files under 250 LOC

### Import Order

```tsx
import { GtkBox, GtkButton } from "@gtkx/react";
import * as Gtk from "@gtkx/ffi/gtk";
import { atom, useAtom } from "jotai";
import { useState } from "react";
import { Torrent } from "../types";
```

## Submitting Pull Requests

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/my-feature`)
3. **Make** your changes following the code style above
4. **Run** `bun run lint` and `bun run typecheck`
5. **Push** and open a PR

### PR Guidelines

- Keep PRs focused and reasonably sized
- Include a clear description of changes
- Add tests if applicable
- Ensure CI passes

## Getting Help

- Check the GTKX skills in `.agents/skills/developing-gtkx-apps/` for widget patterns
- Reference `AGENTS.md` for detailed architecture decisions
- Look at `references/` for GTKX and WebTorrent documentation