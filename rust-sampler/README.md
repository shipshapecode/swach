# Swach Pixel Sampler

A high-performance, cross-platform pixel sampling tool written in Rust for the Swach color picker.

## Overview

This Rust binary provides continuous, real-time pixel sampling for the Swach color picker's magnifier feature. It communicates with the Electron main process via JSON over stdin/stdout.

## Platform Support

### macOS ✅

- Uses Core Graphics `CGDisplayCreateImage` for efficient screen capture
- Direct pixel access without full screenshots
- Hardware-accelerated sampling
- Native cursor position tracking via NSEvent

### Linux (X11) ✅

- Uses native X11 `XGetImage` and `XGetPixel` APIs
- Direct pixel sampling without external tools
- Native cursor position tracking via `XQueryPointer`
- No external dependencies required
- Best performance

### Linux (Wayland) ✅

- Uses XDG Desktop Portal + PipeWire for screen capture
- **Persistent tokens** - Permission dialog only shown once, then saved
- Supports GNOME, KDE Plasma, and other Portal-compatible desktops
- Performance: Good, comparable to X11
- Note: Requires PipeWire and portal support (standard on modern distros)

### Windows ✅

- Uses Windows GDI `GetPixel` API
- Direct pixel sampling without screenshots
- Native cursor position tracking via `GetCursorPos`
- No external dependencies required

## Linux Setup

### Build Dependencies

#### For All Linux Users (X11 + Wayland)

```bash
# Ubuntu/Debian
sudo apt install build-essential pkg-config libx11-dev libpipewire-0.3-dev

# Fedora
sudo dnf install gcc pkg-config libX11-devel pipewire-devel

# Arch Linux
sudo pacman -S base-devel pkg-config libx11 pipewire
```

**Note:** PipeWire support is enabled by default. This allows the sampler to work on both X11 and Wayland systems seamlessly:

- On X11: Uses direct X11 capture (fastest)
- On Wayland: Falls back to Portal + PipeWire (with persistent permissions)

#### Optional: X11-Only Build

If you only need X11 support (no Wayland):

```bash
cargo build --no-default-features
```

#### Optional: Wayland Support (Experimental)

**Note:** Wayland support is not currently used and requires additional system libraries. Only enable this if you're developing Wayland features.

```bash
# Ubuntu/Debian
sudo apt install libpipewire-0.3-dev

# Fedora
sudo dnf install pipewire-devel

# Arch Linux
sudo pacman -S pipewire
```

To build with Wayland support:

```bash
cargo build --features wayland
```

### Runtime Dependencies

#### For X11

No additional runtime dependencies! X11 direct capture is used automatically.

#### For Wayland

PipeWire must be running (standard on modern Linux distros):

```bash
# Check if PipeWire is running
systemctl --user status pipewire

# Most modern distros (Ubuntu 22.04+, Fedora 34+, etc.) have PipeWire by default
```

**First-time Permission:**

- On first use, you'll see a system dialog asking for screen capture permission
- Click "Share" to grant permission
- The permission token is saved in `~/.local/share/swach/screencast-token`
- Future launches will use the saved token automatically (no permission dialog)

## Building

### Development Build

```bash
cargo build
```

The debug binary will be at `target/debug/swach-sampler`

### Release Build

```bash
cargo build --release
```

The optimized binary will be at `target/release/swach-sampler`

## Communication Protocol

### Input (Commands from Electron)

Commands are sent as JSON over stdin, one per line:

```json
{"command": "start", "grid_size": 9, "sample_rate": 60}
{"command": "update_grid", "grid_size": 11}
{"command": "stop"}
```

#### Start Command

- `grid_size`: Number of pixels in each dimension (e.g., 9 = 9x9 grid)
- `sample_rate`: Target sampling frequency in Hz (e.g., 60 = 60 FPS)

#### Update Grid Command

- `grid_size`: New grid size to use

#### Stop Command

- No parameters, cleanly exits the sampler

### Output (Pixel Data to Electron)

Pixel data is sent as JSON over stdout, one object per sample:

```json
{
  "cursor": {"x": 100, "y": 200},
  "center": {"r": 255, "g": 128, "b": 64, "hex": "#FF8040"},
  "grid": [
    [
      {"r": 255, "g": 128, "b": 64, "hex": "#FF8040"},
      {"r": 254, "g": 127, "b": 63, "hex": "#FE7F3F"},
      ...
    ],
    ...
  ],
  "timestamp": 1700000000000
}
```

### Error Output

Errors are sent as JSON to stdout:

```json
{
  "error": "Failed to capture screen: permission denied"
}
```

Debug/diagnostic messages are sent to stderr.

## Performance Notes

### Sampling Rate

- **macOS**: Can achieve 60+ FPS easily with direct pixel access
- **Windows**: Similar to macOS, native GDI is very fast
- **Linux (X11)**: Individual XGetImage calls per pixel - can achieve 30-60 FPS depending on grid size
- **Linux (Wayland via XWayland)**: Same as X11 - 30-60 FPS

### Grid Sampling

Larger grid sizes (e.g., 15x15 vs 9x9) require more individual pixel samples, which impacts performance on all platforms. The impact is most noticeable on Linux/X11 where each pixel requires a separate X11 call.

## Permissions

### macOS

- Requires "Screen Recording" permission in System Preferences → Security & Privacy → Screen Recording
- Electron app must be granted this permission

### Linux (Wayland)

- Not supported - Wayland security model prevents pixel access

### Linux (X11)

- No special permissions required
- Direct X11 access for pixel sampling and cursor position

### Windows

- No special permissions required
- Uses standard GDI APIs

## Integration with Electron

The `RustSamplerManager` class in `electron-app/src/rust-sampler-manager.ts` handles spawning and communicating with this binary.

### Development Mode

Binary location: `rust-sampler/target/debug/swach-sampler`

### Production Mode

Binary location: `<app.resourcesPath>/swach-sampler` (or `.exe` on Windows)

The binary is automatically bundled with the Electron app during packaging.
