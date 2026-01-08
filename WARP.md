# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## About Swach

Swach is a modern color palette manager built as a menubar/system tray Electron app with an Ember.js frontend. It features color picking with a pixel-perfect magnifier (powered by the hue-hunter package), palette management, contrast checking, and cloud sync.

## Common Commands

### Development
- `pnpm start` - Start Ember web app only (dev server at http://localhost:4200)
- `pnpm start:electron` - Start Electron app with hot-reload

### Testing
- `ember test` - Run Ember tests once
- `ember test --server` - Run Ember tests in watch mode
- `pnpm test:ember` - Build and run Ember tests in CI mode
- `pnpm test:electron` - Build, package, and run Electron tests

### Linting & Formatting
- `pnpm lint` - Run all linters (JS, CSS, templates, types)
- `pnpm lint:fix` - Auto-fix all linting issues and format code
- `pnpm format` - Format code with Prettier

### Building & Packaging
- `pnpm package` - Package Electron app for current platform (creates app bundle)
- `pnpm make` - Create distributable packages (DMG, deb, etc.) for current platform

### Release
- `release-it` - Interactive release process (tags, changelog, push)

## Architecture Overview

### Tech Stack
- **Frontend**: Ember.js with Embroider (modern build system), TypeScript, Tailwind CSS v4
- **Build Tool**: Vite (via @embroider/vite for fast dev and optimized production)
- **Desktop**: Electron with Electron Forge (menubar app using `menubar` package)
- **Data Layer**: Orbit.js (client-side ORM with sync strategies)
- **Storage**: IndexedDB (local), Supabase (auth + remote database)
- **Color Picker**: hue-hunter package (cross-platform magnifying color picker with Rust-powered pixel sampling)

### Ember + Electron Integration

The app works in two modes, controlled by the `EMBER_CLI_ELECTRON` environment variable:

**Electron Mode** (`EMBER_CLI_ELECTRON=true`):
- Router uses `hash` location type (for file:// protocol)
- Root URL is `''` (empty string)
- App is packaged and loaded from local files

**Web Mode** (default):
- Router uses `history` location type
- Root URL is `/`
- App runs on Vite dev server (http://localhost:4200)

Configuration logic is in `config/environment.js`.

### Build Pipeline

1. **Development** (`pnpm start:electron`):
   - Ember app served by Vite dev server on localhost:4200
   - Electron loads the dev server URL
   - Hot module replacement (HMR) enabled
   - Main process and preload scripts compiled by Forge's Vite plugin

2. **Production** (`pnpm package` or `pnpm make`):
   - Sets `EMBER_CLI_ELECTRON=true` environment variable
   - Builds hue-hunter Rust sampler binary
   - Ember renderer built by Embroider + Vite
   - Electron main process built (`electron-app/main.ts`)
   - Preload scripts built (`electron-app/src/preload.ts`)
   - hue-hunter sampler binary included as `extraResource` in forge config
   - Everything bundled into ASAR archive

Forge config: `forge.config.ts`
Vite configs: `vite.renderer.config.ts`, `vite.main.config.ts`, `vite.preload.config.ts`

### Data Architecture (Orbit.js)

Swach uses Orbit.js for sophisticated offline-first data management with three synchronized data sources:

**Data Sources** (`app/data-sources/`):
- `store` - In-memory cache (primary interface, ember-orbit Store)
- `backup` - IndexedDB persistence (local backup)
- `remote` - Supabase backend (authenticated users only)

**Models** (`app/data-models/`):
- `palette` - Collection of colors with metadata (name, isColorHistory, isFavorite, isLocked, colorOrder array)
- `color` - Individual color with RGBA values, computed hex/hsl/rgba getters

**Sync Strategies** (`app/data-strategies/`):
Coordinate data flow between sources. Orbit handles ALL data synchronization:
- `store-backup-sync` - Persist all store changes to IndexedDB backup (blocking)
- `store-beforequery-remote-query` - Query remote before local queries when authenticated (non-blocking)
- `store-beforeupdate-remote-update` - Push local updates to remote when authenticated (non-blocking, optimistic UI)
- `remote-store-sync` - Pull remote changes to store (blocking)
- Error handling strategies for remote failures

**Sync Behavior**:
- Initial sync on app startup fetches all palettes/colors from Supabase
- Local changes are immediately reflected (optimistic UI), then synced to remote in background
- Pull-based sync before queries ensures fresh data when needed
- No realtime subscriptions - sync is handled via Orbit's strategies only

**Data Service** (`app/services/data.ts`):
- Manages coordinator activation and synchronization
- Ensures single color history palette exists
- Handles data restoration from backup on app start
- Provides `activate()` and `synchronize()` methods

**Important**: Relationships are tracked via the `colorOrder` array attribute on palettes (workaround until Orbit supports ordered relationships). When working with palette colors, respect this order array rather than the `colors` relationship alone.

### Electron Architecture

**Main Process** (`electron-app/main.ts`):
- Creates menubar app using `menubar` package
- Manages window lifecycle and IPC events
- Handles deep linking via `swach://` protocol
- First-run detection with electron-store
- Platform-specific icon paths

**IPC Events** (`electron-app/src/ipc-events.ts`):
- Bidirectional communication between main and renderer
- Color picker integration
- Settings management (dock icon, auto-start)
- Export/import functionality

**Color Picker**:
- Uses the `hue-hunter` npm package (https://github.com/RobbieTheWagner/hue-hunter)
- Provides magnifying glass interface with Rust-powered pixel sampling
- Platform-specific implementations:
  - macOS: Core Graphics APIs
  - Linux X11: XGetImage/XGetPixel (native, no deps)
  - Linux Wayland: XDG Portal + PipeWire (persistent token saved to `~/.local/share/hue-hunter/screencast-token`)
  - Windows: GDI GetPixel API
- Integration: `electron-app/src/color-picker.ts` uses `ColorPicker` class from hue-hunter
- Color naming via `color-name-list` and `nearest-color` packages

### Authentication & Cloud Sync

**Supabase**:
- Authentication via email OTP (passwordless)
- Remote database (PostgreSQL) for palettes and colors
- Row-level security ensures users only access their own data
- Config in `config/environment.js` (supabaseUrl, supabaseAnonKey)

**Session Service** (`app/services/session.ts`):
- Manages authentication state
- Provides `isAuthenticated` and `userId` properties

**Supabase Service** (`app/services/supabase.ts`):
- Provides Supabase client instance
- Used ONLY for auth and as remote API
- No realtime subscriptions - all sync is handled by Orbit

**Remote Sync** (`app/data-sources/remote.ts`):
- Only activates when user is authenticated
- Implements Orbit source interface for Supabase backend
- Transforms between Orbit records and Supabase rows
- All synchronization coordinated by Orbit strategies, not Supabase realtime

### Component Structure

**Key Components** (`app/components/`):
- Color picker integration (launches hue-hunter picker via IPC)
- Palette management (create, edit, delete, reorder)
- Color contrast checker
- Settings panels (cloud, data management)
- Welcome/onboarding flow

**Styling**:
- Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- Custom styles in `app/styles/`
- Component-scoped styles using template-tag components (`.gts` files)

### Routes & Navigation

**Main Routes** (`app/routes/`, `app/router.ts`):
- `/colors` - Main color picker and palette view
- `/contrast` - WCAG contrast checker
- `/kuler` - Color harmony generator
- `/palettes` - Palette library view
- `/settings` - Settings with nested routes (cloud, data)
- `/welcome` - First-run onboarding flow

### Testing

**Ember Tests** (`tests/`):
- QUnit + ember-qunit
- Integration and unit tests
- Test selectors via ember-test-selectors
- Testem for test running (Chrome in CI, Electron for electron-specific tests)


## Important Notes

### EMBER_CLI_ELECTRON Environment Variable
This is the critical flag that switches between web and Electron modes. Always set it to `true` when packaging/building for Electron. Already configured in `package.json` scripts for `package` and `make` commands.

### hue-hunter Color Picker
- Built via `pnpm build:hue-hunter` (automatically called by `package` and `make` commands)
- Binary location: `node_modules/hue-hunter/rust-sampler/target/release/hue-hunter-sampler[.exe]`
- Bundled to production as `extraResource` in `forge.config.ts`
- See hue-hunter README for Rust sampler details: https://github.com/RobbieTheWagner/hue-hunter

### Linux Platform Considerations
- X11 and Wayland support via hue-hunter's Rust sampler
- X11: Native direct capture (fast, no deps)
- Wayland: PipeWire + Portal (requires permission on first use, token saved to `~/.local/share/hue-hunter/screencast-token`)
- Build dependencies: `libx11-dev`, `libpipewire-0.3-dev` (see hue-hunter README)
- Runtime: `libxcb1`, `libxrandr2`, `libdbus-1-3` auto-installed with .deb package

### Code Signing & Notarization
- macOS: Conditional based on `APPLE_ID` and `APPLE_ID_PASSWORD` env vars
- Skip with `SKIP_CODESIGN=true` (used in CI tests)
- Windows: Squirrel installer created unsigned, then signed separately with eSigner
- Configured in `forge.config.ts`

### Package Manager
- Uses **pnpm** (v10.27.0)
- Node.js >= 22 required
- pnpm patches applied for ember-local-storage and object-inspect

### Sentry Error Tracking
- Integrated in both Ember renderer and Electron main/renderer processes
- Initialized in `app/app.ts` and `electron-app/main.ts`
- Uses release version from `package.json`

### Color History Palette
The app maintains exactly one palette marked with `isColorHistory: true` to track recently picked colors. The `data` service enforces this constraint during synchronization, preferring the remote version if multiple exist.

### Orbit.js Schema Migrations
The `SCHEMA_VERSION` in `config/environment.js` can be incremented to trigger migrations. The backup source has a hacky `recreateInverseRelationshipsOnLoad` flag for relationship migrations (see data service comments).

## File Organization

- `app/` - Ember application code (components, routes, services, models, styles)
- `electron-app/` - Electron main process, IPC handlers, color picker integration
- `electron-app/src/color-picker.ts` - Color picker integration using hue-hunter
- `config/` - Ember environment configuration
- `tests/` - Ember test suite
- `public/` - Static assets (copied to build output)
- `patches/` - pnpm patches for dependencies
- `forge.config.ts` - Electron Forge configuration (makers, packager, plugins)
- `ember-cli-build.js` - Ember CLI build configuration (legacy, mostly unused with Embroider)
- `vite.*.config.ts` - Vite configurations for different build targets
