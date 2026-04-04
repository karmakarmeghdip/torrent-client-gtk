# AGENTS.md - Torrent Client GTK

## Commands

```bash
bun run dev        # Start dev server with hot reload
bun run build      # Build for production
bun run typecheck  # TypeScript type checking (tsc --noEmit)
bun run start      # Run built app (node dist/bundle.js)
bun install        # Install dependencies
```

**No test or lint scripts configured yet.** Add them when introducing testing/linting tools.

## Testing UI with GTKX MCP

Use the `gtkx` MCP server for UI testing and inspection:
- `gtkx_list_apps` - List connected GTKX applications
- `gtkx_get_widget_tree` - Inspect widget hierarchy
- `gtkx_query_widgets` - Find widgets by role/text/name
- `gtkx_click` / `gtkx_type` - Interact with widgets
- `gtkx_take_screenshot` - Visual verification

Run `bun run dev` first, then use MCP tools to test the running app.

## Architecture

### State Management
- Use **Jotai** for centralized state (atoms in `src/store/`)
- Avoid prop drilling; lift state to atoms when shared across components
- Local `useState` only for component-internal UI state

### File Organization
- **Keep files under 250 LOC** - split into smaller, focused files
- `src/components/` - React components (one per file)
- `src/hooks/` - Custom React hooks
- `src/store/` - Jotai atoms and state logic
- `src/types.ts` - Shared TypeScript interfaces
- `src/data.ts` - Static/mock data
- `src/styles.ts` - Global CSS injection

### High Cohesion, Low Coupling
- Each file should have a single responsibility
- Components receive data via props, not direct store access
- Hooks encapsulate business logic, return clean APIs

## Code Style

### Imports
```tsx
import { GtkBox, GtkButton, quit } from "@gtkx/react";
import * as Gtk from "@gtkx/ffi/gtk";
import { atom, useAtom } from "jotai";
import { useState } from "react";
import { Torrent } from "../types";
```
Order: GTKX/react → FFI → libraries → React → local (relative, `.tsx` extension omitted)

### Naming Conventions
- Components: `PascalCase` (e.g., `TorrentItem`, `Header`)
- Hooks: `use` prefix + `camelCase` (e.g., `useTorrents`)
- Types/Interfaces: `PascalCase` (e.g., `Torrent`, `TorrentStatus`)
- Atoms: `camelCase` + `Atom` suffix (e.g., `torrentsAtom`)
- Props interfaces: `{ComponentName}Props`

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
- Use named exports (not default)
- Destructure props in function signature
- Use `const` arrow functions

### TypeScript
- `strict: true` enforced in `tsconfig.json`
- Always type props interfaces explicitly
- Use `interface` for object shapes, `type` for unions
- No `any` - use `unknown` if type is truly dynamic

### GTKX Specifics
- Widget slots: `<AdwToolbarView.AddTopBar>`, `<GtkPopoverMenu.MenuSection>`
- Signals: `on<SignalName>` props (e.g., `onClicked`, `onActivated`)
- Use `Gtk.Orientation.VERTICAL` and `Gtk.Align.CENTER` from `@gtkx/ffi/gtk`
- Virtual lists (`GtkListView`) need stable `id` and `value` in items
- Use `quit` from `@gtkx/react` for app exit

### Error Handling
- No error boundaries configured yet - add them for production
- Use try/catch in async operations
- Show user-facing errors via GTK dialogs

## GTKX Widget Reference
- See `.agents/skills/developing-gtkx-apps/SKILL.md` for core patterns
- See `.agents/skills/developing-gtkx-apps/WIDGETS.md` for full widget API
- See `.agents/skills/developing-gtkx-apps/EXAMPLES.md` for code examples
