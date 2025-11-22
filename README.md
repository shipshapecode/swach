# Swach

[![Linting](https://github.com/shipshapecode/swach/actions/workflows/lint.yml/badge.svg)](https://github.com/shipshapecode/swach/actions/workflows/lint.yml)
[![Ember](https://github.com/shipshapecode/swach/actions/workflows/ember.yml/badge.svg)](https://github.com/shipshapecode/swach/actions/workflows/ember.yml)
[![Electron](https://github.com/shipshapecode/swach/actions/workflows/electron.yml/badge.svg)](https://github.com/shipshapecode/swach/actions/workflows/electron.yml)

Swach is a modern color palette manager.

<a href="https://swach.io/">
  <img width="1728" 
    alt="Swach homepage showing the app running." 
    src="https://user-images.githubusercontent.com/2640861/194164254-4504e8f3-497c-43b2-8eb9-4bcacd1a69c8.png"
  />
</a>

**[Swach is built and maintained by Ship Shape. Contact us for web and native app development services.](https://shipshape.io/)**

## Prerequisites

You will need the following things properly installed on your computer.

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Ember CLI](https://ember-cli.com/)
- [Google Chrome](https://google.com/chrome/)
- [Rust](https://www.rust-lang.org/) (for building the pixel sampler)

### Linux System Requirements

On Linux, the color picker functionality requires additional system libraries and tools. These dependencies are automatically installed when using the `.deb` package, but if building from source, ensure you have:

```bash
# Debian / Ubuntu
sudo apt-get install libxcb1 libxrandr2 libdbus-1-3

# For Wayland (recommended)
sudo apt-get install grim

# For X11 (fallback)
sudo apt-get install imagemagick xdotool
# OR
sudo apt-get install scrot xdotool

# Alpine
sudo apk add libxcb libxrandr dbus grim
```

**Wayland Users:** The `grim` tool is required for screenshot-based color picking on Wayland. See [rust-sampler/README.md](rust-sampler/README.md) for more details.

## Installation

- `git clone <repository-url>` this repository
- `cd swach`
- `pnpm install`

## Architecture

Swach is built using a modern stack that combines Ember.js with Electron:

- **Ember.js** - Frontend framework using Embroider (modern build system)
- **Vite** - Fast build tool used by Embroider for development and production builds
- **Electron Forge** - Complete toolchain for building, packaging, and distributing Electron apps
- **TypeScript** - Type safety across the entire codebase

### Build System Integration

The build system works as follows:

1. **Ember + Embroider + Vite**: The Ember app is built using Embroider's Vite integration (`@embroider/vite`), which provides fast hot-reload in development and optimized production builds.

2. **Electron Forge + Vite Plugin**: Electron Forge uses its Vite plugin to:
   - Build the main process (`electron-app/src/main.ts`)
   - Build the preload script (`electron-app/src/preload.ts`)
   - Build the renderer process (the Ember app) using the Embroider Vite config

3. **Environment Configuration**: The app detects when it's running in Electron vs web by checking the `EMBER_CLI_ELECTRON` environment variable, which affects:
   - Router location type (`hash` for Electron, `history` for web)
   - Root URL (`''` for Electron, `'/'` for web)
   - Asset loading strategies

## Running / Development

### Electron Development

- `pnpm start:electron` - Starts Electron with hot-reload pointing to Vite dev server
- The Ember app runs on `http://localhost:4200` and Electron loads it via the dev server

### Web Development

- `pnpm start` - Starts just the Ember app for web development
- Visit your app at [http://localhost:4200](http://localhost:4200).
- Visit your tests at [http://localhost:4200/tests](http://localhost:4200/tests).

### Running Tests

- `ember test`
- `ember test --server`

### Linting

- `pnpm lint`
- `pnpm lint:fix`

### Building / Packaging

#### Testing

- `pnpm test:ember` - Builds and runs Ember tests
- `pnpm test:electron` - Builds and packages Electron, then runs Electron-specific tests

#### Production Electron Builds

- `pnpm package` - Packages the Electron app for the current platform (sets `EMBER_CLI_ELECTRON=true`)
- `pnpm make` - Creates distributable packages (DMG, deb, etc.) for the current platform (sets `EMBER_CLI_ELECTRON=true`)

The production builds work by:

1. Electron Forge builds the Ember renderer using Vite with `EMBER_CLI_ELECTRON=true`
2. This enables hash routing and proper asset paths for file-based loading
3. The main and preload processes are built and bundled
4. Everything is packaged into the final Electron app with proper code signing and notarization

## Releasing

- Bump the version with:

```bash
release-it
```

Choose the appropriate major, minor, patch, beta, etc version in the prompt.

GitHub actions should then take that new tag and build and release automatically.
