# Pixel Sampler Architecture

## Overview

Swach uses a Rust-based pixel sampler for high-performance, continuous color picking. This document explains the architecture and how the components interact.

## Architecture

```
┌─────────────────────────────────────────┐
│   Electron Renderer (Magnifier UI)     │
│   - Display pixel grid                  │
│   - Handle zoom/pan interactions        │
│   - Show color information              │
└──────────────┬──────────────────────────┘
               │ IPC
┌──────────────┴──────────────────────────┐
│   Electron Main Process                 │
│   - RustSamplerManager                  │
│   - Spawn/manage Rust process           │
│   - Parse pixel data                    │
│   - Color name lookup                   │
└──────────────┬──────────────────────────┘
               │ stdio (JSON)
┌──────────────┴──────────────────────────┐
│   Rust Binary (swach-sampler)          │
│   - Platform-specific screen capture    │
│   - Continuous pixel sampling           │
│   - Grid sampling around cursor         │
│   - JSON output stream                  │
└─────────────────────────────────────────┘
```

## Components

### 1. Rust Sampler (`rust-sampler/`)

A standalone Rust binary that handles pixel sampling:

**Responsibilities:**

- Capture screen pixels efficiently
- Track cursor position (platform-dependent)
- Sample NxN grid of pixels around cursor
- Stream pixel data as JSON to stdout

**Platform Implementations:**

- **macOS**: Uses Core Graphics CGWindowListCreateImage for optimized batch capture
- **Windows**: Uses GDI BitBlt for grid capture, GetPixel for single pixels
- **Linux (Wayland)**: Uses `grim` for screenshots, caches for performance
- **Linux (X11)**: Uses ImageMagick or scrot for screenshots

See [rust-sampler/README.md](../rust-sampler/README.md) for details.

### 2. RustSamplerManager (`electron-app/src/rust-sampler-manager.ts`)

Manages the Rust sampler process lifecycle:

**Responsibilities:**

- Spawn the Rust binary
- Send commands via stdin (start, update grid, stop)
- Parse pixel data from stdout
- Handle errors and process lifecycle

**Communication:**

- Input: JSON commands over stdin
- Output: JSON pixel data over stdout
- Errors: JSON errors over stdout, diagnostics on stderr

### 3. Magnifying Color Picker (`electron-app/magnifier/magnifier-main-rust.ts`)

Coordinates the color picking experience:

**Responsibilities:**

- Create and manage magnifier window
- Start/stop Rust sampler
- Process pixel data from sampler
- Look up color names
- Handle user interactions (zoom, select, cancel)

**Changes from Screenshot-Based Approach:**

- ❌ No longer takes initial screenshot
- ❌ No longer samples from cached bitmap
- ✅ Receives continuous pixel data from Rust
- ✅ Lower latency, more responsive
- ✅ Platform-optimized sampling

### 4. Magnifier Renderer (`electron-app/magnifier/main.ts`)

The UI layer (unchanged):

**Responsibilities:**

- Render pixel grid as colored squares
- Display color information (hex, name)
- Handle user input (click, scroll, keyboard)
- Smooth animations and transitions

## Data Flow

### 1. Color Picker Launched

```
User clicks eyedropper
  → MagnifyingColorPicker.pickColor()
    → Create magnifier window
    → RustSamplerManager.start(gridSize, sampleRate)
      → Spawn Rust process
      → Send {"command": "start", "grid_size": 9, "sample_rate": 60}
```

### 2. Continuous Sampling

```
Rust sampler (60 FPS loop):
  Get cursor position
  Sample center pixel
  Sample NxN grid around cursor
  → Send JSON to stdout

RustSamplerManager:
  Parse JSON from stdout
  → Invoke callback with pixel data

MagnifyingColorPicker:
  Receive pixel data
  Look up color name
  → Send to renderer via IPC
    → Update pixel grid display
    → Update color information
```

### 3. User Interactions

#### Zoom (Scroll Wheel)

```
User scrolls
  → Renderer sends 'magnifier-zoom-diameter'
    → Main calculates new grid size
      → RustSamplerManager.updateGridSize(newSize)
        → Send {"command": "update_grid", "grid_size": 11}
```

#### Select Color (Click)

```
User clicks
  → Renderer sends 'color-selected'
    → Main resolves with current color
      → RustSamplerManager.stop()
        → Send {"command": "stop"}
          → Rust process exits cleanly
```

#### Cancel (Escape)

```
User presses Escape
  → Renderer sends 'picker-cancelled'
    → Main resolves with null
      → RustSamplerManager.stop()
```

## Performance Characteristics

### macOS

- **Sampling Rate**: 60+ FPS easily achieved
- **Method**: Direct pixel access via Core Graphics
- **Latency**: ~16ms (1 frame at 60 FPS)
- **CPU Usage**: Low (native API is hardware-accelerated)

### Windows

- **Sampling Rate**: 60+ FPS
- **Method**: GDI GetPixel
- **Latency**: ~16ms
- **CPU Usage**: Low to moderate

### Linux (Wayland)

- **Sampling Rate**: ~10 FPS (100ms cache interval)
- **Method**: External tool (`grim`) with caching
- **Latency**: ~100ms (cache refresh interval)
- **CPU Usage**: Moderate (subprocess spawning)

### Linux (X11)

- **Sampling Rate**: ~10-30 FPS (depends on tool)
- **Method**: External tool (ImageMagick/scrot) with caching
- **Latency**: ~100ms
- **CPU Usage**: Moderate

## Migration from Screenshot-Based Approach

### Old Approach (magnifier-main.ts)

1. Take single screenshot using Electron's `desktopCapturer`
2. Cache bitmap in memory
3. Sample pixels from cached bitmap at 8ms intervals
4. Cursor movement samples from frozen screenshot

**Limitations:**

- Screenshot is static (frozen in time)
- High memory usage (full screen bitmap)
- Electron's screenshot API is relatively slow
- Not truly "live" color picking

### New Approach (magnifier-main-rust.ts)

1. Spawn Rust sampler process
2. Rust continuously samples live screen
3. Streams pixel data to Electron
4. Cursor movement shows live colors

**Advantages:**

- ✅ Live, continuous sampling (macOS/Windows)
- ✅ Lower memory usage (only grid data)
- ✅ Platform-optimized performance
- ✅ Better Wayland support (uses proper tools)
- ✅ Separation of concerns (sampling in Rust, UI in Electron)

## Build Process

### Development

```bash
# Build Rust sampler (debug)
pnpm build:rust:dev

# Start Electron (auto-builds Rust)
pnpm start:electron
```

### Production

```bash
# Build Rust sampler (release, optimized)
pnpm build:rust

# Package Electron app (includes Rust binary)
pnpm package

# Create distributable
pnpm make
```

The Rust binary is automatically included in the packaged app:

- **Location in dev**: `rust-sampler/target/debug/swach-sampler`
- **Location in prod**: `<resourcesPath>/swach-sampler`

## Troubleshooting

### Rust Binary Not Found

**Symptom**: "Failed to spawn process" error when launching color picker

**Solution**: Build the Rust sampler:

```bash
cd rust-sampler
cargo build
```

### Wayland Screenshot Fails

**Symptom**: "Failed to run grim" error on Linux

**Solution**: Install grim:

```bash
sudo apt install grim  # Ubuntu/Debian
```

### macOS Screen Recording Permission

**Symptom**: Black/empty pixels on macOS

**Solution**: Grant Screen Recording permission:

1. System Preferences → Security & Privacy → Screen Recording
2. Enable Swach
3. Restart the app

### High CPU Usage on Linux

**Symptom**: High CPU usage during color picking

**Solution**: This is expected on Linux due to external screenshot tools. The sampler caches screenshots for 100ms to balance performance and accuracy.

## Future Improvements

### Potential Enhancements

1. **Wayland Native Protocol**: Use Wayland's screencopy protocol directly instead of `grim`
2. **Shared Memory**: Use shared memory for IPC instead of JSON over stdio
3. **GPU Acceleration**: Leverage GPU for sampling on supported platforms
4. **Adaptive Sampling Rate**: Dynamically adjust based on cursor movement
5. **Multi-Display**: Better support for sampling across multiple displays

### Platform-Specific Ideas

- **macOS**: Explore Metal for GPU-accelerated sampling
- **Windows**: Investigate DXGI for more efficient capture
- **Linux**: Direct DRM/KMS access for Wayland (requires compositor support)
