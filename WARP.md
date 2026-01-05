# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## About Swach

Swach is a modern color palette manager built as a menubar/system tray Electron app with an Ember.js frontend. It features color picking with a pixel-perfect magnifier, palette management, contrast checking, and cloud sync.

## Common Commands

### Development
- `pnpm start` - Start Ember web app only (dev server at http://localhost:4200)
- `pnpm start:electron` - Start Electron app with hot-reload (builds Rust sampler in dev mode)
- `pnpm build:rust:dev` - Build Rust pixel sampler for development (with x11 and wayland features)

### Testing
- `ember test` - Run Ember tests once
- `ember test --server` - Run Ember tests in watch mode
- `pnpm test:ember` - Build and run Ember tests in CI mode
- `pnpm test:electron` - Build, package, and run Electron tests (includes Rust build for CI with x11 only)
- `pnpm test:magnifier` - Run magnifier unit tests (vitest)
- `pnpm test:magnifier:watch` - Run magnifier tests in watch mode
- `pnpm test:rust` - Run Rust sampler tests

### Linting & Formatting
- `pnpm lint` - Run all linters (JS, CSS, templates, types)
- `pnpm lint:fix` - Auto-fix all linting issues and format code
- `pnpm format` - Format code with Prettier

### Building & Packaging
- `pnpm build:rust` - Build production Rust sampler (with x11 and wayland features)
- `pnpm build:rust:ci` - Build Rust sampler for CI (x11 only, no wayland)
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
- **Storage**: IndexedDB (local), AWS Cognito + API Gateway (cloud sync)
- **Color Picker**: Custom Rust binary for cross-platform pixel sampling

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
   - Ember renderer built by Embroider + Vite
   - Electron main process built (`electron-app/main.ts`)
   - Preload scripts built (`electron-app/src/preload.ts`, `electron-app/magnifier/magnifier-preload.ts`)
   - Rust sampler binary included as `extraResource` in forge config
   - Everything bundled into ASAR archive

Forge config: `forge.config.ts`
Vite configs: `vite.renderer.config.ts`, `vite.main.config.ts`, `vite.preload.config.ts`, `vite.magnifier.config.ts`

### Data Architecture (Orbit.js)

Swach uses Orbit.js for sophisticated offline-first data management with three synchronized data sources:

**Data Sources** (`app/data-sources/`):
- `store` - In-memory cache (primary interface, ember-orbit Store)
- `backup` - IndexedDB persistence (local backup)
- `remote` - JSON:API remote sync (AWS API Gateway, authenticated users only)

**Models** (`app/data-models/`):
- `palette` - Collection of colors with metadata (name, isColorHistory, isFavorite, isLocked, colorOrder array)
- `color` - Individual color with RGBA values, computed hex/hsl/rgba getters

**Sync Strategies** (`app/data-strategies/`):
Coordinate data flow between sources. Key strategies:
- `store-backup-sync` - Persist all store changes to IndexedDB backup
- `store-beforequery-remote-query` - Query remote before local queries (when authenticated)
- `store-beforeupdate-remote-update` - Push local updates to remote (when authenticated)
- `remote-store-sync` - Pull remote changes to store
- Error handling strategies for remote failures

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

**Magnifier/Color Picker**:
- Separate BrowserWindow overlaid on screen
- Rust binary (`electron-app/magnifier/rust-sampler/`) for pixel sampling
- Communicates via stdin/stdout JSON protocol
- Platform-specific implementations:
  - macOS: Core Graphics APIs
  - Linux X11: XGetImage/XGetPixel (native, no deps)
  - Linux Wayland: XDG Portal + PipeWire (persistent token)
  - Windows: GDI GetPixel API
- Manager: `electron-app/magnifier/rust-sampler-manager.ts`
- See `electron-app/magnifier/rust-sampler/README.md` for details

### Authentication & Cloud Sync

**AWS Cognito** (`ember-cognito` addon):
- User pools for authentication
- Identity pools for AWS credentials
- Config in `config/environment.js` (poolId, clientId, identityPoolId)

**Session Service** (`app/services/session.ts`):
- Wraps ember-simple-auth session
- Provides `isAuthenticated` state

**Remote Sync**:
- Only activates when user is authenticated
- JSON:API communication with AWS API Gateway
- Coordinates palettes and colors bidirectionally
- Handles conflict resolution (remote preferred for color history palette)

### Component Structure

**Key Components** (`app/components/`):
- Color picker/magnifier integration components
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

**Magnifier Tests**:
- Vitest for TypeScript magnifier code (`electron-app/magnifier/`)
- Unit tests for grid calculation, pixel utils, rust manager

**Rust Tests**:
- Cargo test for Rust sampler logic

## Important Notes

### EMBER_CLI_ELECTRON Environment Variable
This is the critical flag that switches between web and Electron modes. Always set it to `true` when packaging/building for Electron. Already configured in `package.json` scripts for `package` and `make` commands.

### Rust Sampler Binary
- Must be built before packaging: `pnpm build:rust`
- Development builds: `pnpm build:rust:dev` (includes both x11 and wayland)
- CI builds: `pnpm build:rust:ci` (x11 only, for faster CI builds)
- Location in development: `electron-app/magnifier/rust-sampler/target/[debug|release]/swach-sampler[.exe]`
- Location in production: `<app.resourcesPath>/swach-sampler[.exe]`
- Bundled via `extraResource` in `forge.config.ts`

### Linux Platform Considerations
- X11 and Wayland support via Rust sampler feature flags
- X11: Native direct capture (fast, no deps)
- Wayland: PipeWire + Portal (requires permission on first use, token saved to `~/.local/share/swach/screencast-token`)
- Build dependencies: `libx11-dev`, `libpipewire-0.3-dev` (see rust-sampler README)
- Runtime: `libxcb1`, `libxrandr2`, `libdbus-1-3` auto-installed with .deb package

### Code Signing & Notarization
- macOS: Conditional based on `APPLE_ID` and `APPLE_ID_PASSWORD` env vars
- Skip with `SKIP_CODESIGN=true` (used in CI tests)
- Windows: Squirrel installer created unsigned, then signed separately with eSigner
- Configured in `forge.config.ts`

### Package Manager
- Uses **pnpm** (v10.20.0)
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
- `electron-app/` - Electron main process, IPC handlers, magnifier implementation
- `electron-app/magnifier/rust-sampler/` - Rust binary for pixel sampling
- `config/` - Ember environment configuration
- `tests/` - Ember test suite
- `public/` - Static assets (copied to build output)
- `patches/` - pnpm patches for dependencies
- `forge.config.ts` - Electron Forge configuration (makers, packager, plugins)
- `ember-cli-build.js` - Ember CLI build configuration (legacy, mostly unused with Embroider)
- `vite.*.config.ts` - Vite configurations for different build targets
